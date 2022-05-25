import http from 'node:http';
import WebSocket from 'ws';
import { Logger } from '@nestjs/common';
import { AbstractWsAdapter } from '@nestjs/websockets';
import {
  CLOSE_EVENT,
  CONNECTION_EVENT,
  ERROR_EVENT,
} from '@nestjs/websockets/constants';
import { MessageMappingProperties } from '@nestjs/websockets/gateway-metadata-explorer';
import { EMPTY, fromEvent, Observable } from 'rxjs';
import { filter, first, mergeMap, share, takeUntil } from 'rxjs/operators';

export enum ReadyState {
  CONNECTING_STATE = 0,
  OPEN_STATE = 1,
  CLOSING_STATE = 2,
  CLOSED_STATE = 3,
}

type HttpServerRegistryKey = number;
type HttpServerRegistryEntry = http.Server;
type WsServerRegistryKey = number;
type WsServerRegistryEntry = WebSocket.Server[];

const UNDERLYING_HTTP_SERVER_PORT = 0;

export class WsAdapter extends AbstractWsAdapter<
  any /* WebSocket.WebSocketServer */,
  any /* WebSocket.WebSocket */,
  WebSocket.ServerOptions
> {
  protected readonly logger = new Logger(WsAdapter.name);

  protected readonly httpServersRegistry = new Map<
    HttpServerRegistryKey,
    HttpServerRegistryEntry
  >();

  protected readonly wsServersRegistry = new Map<
    WsServerRegistryKey,
    WsServerRegistryEntry
  >();

  public create(port: number, options: WebSocket.ServerOptions = {}) {
    const { server, ...wsOptions } = options;

    if (port === UNDERLYING_HTTP_SERVER_PORT && this.httpServer) {
      this.ensureHttpServerExists(port, this.httpServer);
      const wsServer = this.bindErrorHandler(
        new WebSocket.Server({
          noServer: true,
          ...wsOptions,
        }),
      );

      this.addWsServerToRegistry(wsServer, port, options.path ?? '/');
      return wsServer;
    }

    if (server) {
      return server;
    }
    if (options.path && port !== UNDERLYING_HTTP_SERVER_PORT) {
      // Multiple servers with different paths
      // sharing a single HTTP/S server running on different port
      // than a regular HTTP application
      const httpServer = this.ensureHttpServerExists(port);
      httpServer?.listen(port);

      const wsServer = this.bindErrorHandler(
        new WebSocket.Server({
          noServer: true,
          ...wsOptions,
        }),
      );

      this.addWsServerToRegistry(wsServer, port, options.path);
      return wsServer;
    }
    const wsServer = this.bindErrorHandler(
      new WebSocket.Server({
        port,
        ...wsOptions,
      }),
    );
    return wsServer;
  }

  public bindMessageHandlers(
    client: WebSocket.WebSocket,
    handlers: MessageMappingProperties[],
    transform: <T = string>(data: MessageEvent<T>) => Observable<unknown>,
  ): void {
    const close$ = fromEvent(client, CLOSE_EVENT).pipe(share(), first());
    const source$ = fromEvent<MessageEvent<string>>(client, 'message').pipe(
      mergeMap((buffer) =>
        this.bindMessageHandler(buffer, handlers, transform).pipe(
          filter((result) => result),
        ),
      ),
      takeUntil(close$),
    );
    const onMessage = (response: unknown) => {
      if (client.readyState !== ReadyState.OPEN_STATE) {
        return;
      }
      client.send(JSON.stringify(response));
    };
    source$.subscribe(onMessage);
  }

  public bindMessageHandler(
    buffer: MessageEvent<string>,
    handlers: MessageMappingProperties[],
    transform: <T = string>(data: MessageEvent<T>) => Observable<unknown>,
  ): Observable<any> {
    try {
      const message = JSON.parse(buffer.data);
      const messageHandler = handlers.find(
        (handler) => handler.message === message.event,
      ) ?? { callback: () => {} };
      const { callback } = messageHandler;
      return transform(callback(message.data));
    } catch {
      return EMPTY;
    }
  }

  public bindErrorHandler(server: WebSocket.Server): WebSocket.Server {
    server.on(CONNECTION_EVENT, (ws: WebSocket.Server) =>
      ws.on(ERROR_EVENT, (err: Error) => {
        this.logger.error(err);
      }),
    );
    server.on(ERROR_EVENT, (err: Error) => {
      this.logger.error(err);
    });
    return server;
  }

  public bindClientDisconnect(
    client: WebSocket.WebSocket,
    callback: (ws: WebSocket.WebSocket, code: number, reason: Buffer) => void,
  ) {
    client.on(CLOSE_EVENT, callback);
  }

  public async dispose() {
    const closeEventSignals = Array.from(this.httpServersRegistry)
      .filter(([port]) => port !== UNDERLYING_HTTP_SERVER_PORT)
      .map(
        ([, server]) =>
          new Promise((resolve) => {
            server.close(resolve);
          }),
      );

    await Promise.all(closeEventSignals);
    this.httpServersRegistry.clear();
    this.wsServersRegistry.clear();
  }

  protected ensureHttpServerExists(
    port: number,
    httpServer = http.createServer(),
  ): http.Server | undefined {
    if (this.httpServersRegistry.has(port)) {
      return undefined;
    }
    this.httpServersRegistry.set(port, httpServer);

    httpServer.on('upgrade', (request, socket, head) => {
      const baseUrl = `ws://${request.headers.host}/`;
      const { pathname } = new URL(request.url ?? '', baseUrl);
      const wsServersCollection = this.wsServersRegistry.get(port) ?? [];

      let isRequestDelegated = false;
      // eslint-disable-next-line no-restricted-syntax
      for (const wsServer of wsServersCollection) {
        if (pathname === wsServer.path) {
          wsServer.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            wsServer.emit('connection', ws, request);
          });
          isRequestDelegated = true;
          break;
        }
      }
      if (!isRequestDelegated) {
        socket.destroy();
      }
    });

    return httpServer;
  }

  protected addWsServerToRegistry(
    wsServer: WebSocket.Server,
    port: number,
    path: string,
  ) {
    const entries = this.wsServersRegistry.get(port) ?? [];
    entries.push(wsServer);

    // eslint-disable-next-line no-param-reassign
    wsServer.path = path;
    this.wsServersRegistry.set(port, entries);
  }
}
