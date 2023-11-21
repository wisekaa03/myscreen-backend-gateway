import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import parseISO from 'date-fns/parseISO';
import differenceInDays from 'date-fns/differenceInDays';

import { WSGateway } from '@/websocket/ws.gateway';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { RequestApprove, MonitorMultiple } from '@/enums';
import { MailService } from '@/mail/mail.service';
import { RequestEntity } from './request.entity';
import { FileEntity } from './file.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';
import { UserExtEntity } from './user-ext.entity';
import { MonitorService } from '@/database/monitor.service';
import { EditorService } from '@/database/editor.service';

@Injectable()
export class RequestService {
  private logger = new Logger(RequestService.name);

  private frontendUrl: string;

  constructor(
    private readonly mailService: MailService,
    @Inject(forwardRef(() => EditorService))
    private readonly editorService: EditorService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
    @Inject(forwardRef(() => MonitorService))
    private readonly monitorService: MonitorService,
    @InjectRepository(RequestEntity)
    private readonly requestRepository: Repository<RequestEntity>,
    configService: ConfigService,
  ) {
    this.frontendUrl = configService.get<string>(
      'FRONTEND_URL',
      'http://localhost',
    );
  }

  async find(
    find: FindManyOptions<RequestEntity>,
    caseInsensitive = true,
  ): Promise<Array<RequestEntity>> {
    let result: Array<RequestEntity>;
    const findLocal = TypeOrmFind.Nullable(find);

    if (!find.relations) {
      findLocal.relations = {
        buyer: true,
        seller: true,
        monitor: true,
        playlist: true,
      };
    }

    if (caseInsensitive) {
      result = await TypeOrmFind.findCI(this.requestRepository, findLocal);
    } else {
      result = await this.requestRepository.find(findLocal);
    }

    return result;
  }

  async findAndCount(
    find: FindManyOptions<RequestEntity>,
    caseInsensitive = true,
  ): Promise<[Array<RequestEntity>, number]> {
    let result: [Array<RequestEntity>, number];
    const findLocal = TypeOrmFind.Nullable(find);

    if (!find.relations) {
      findLocal.relations = {
        buyer: true,
        seller: true,
        monitor: true,
        playlist: true,
      };
    }
    if (caseInsensitive) {
      result = await TypeOrmFind.findAndCountCI(
        this.requestRepository,
        findLocal,
      );
    } else {
      result = await this.requestRepository.findAndCount(findLocal);
    }

    return result;
  }

  async findOne(
    find: FindManyOptions<RequestEntity>,
    caseInsensitive = true,
  ): Promise<RequestEntity | null> {
    let result: RequestEntity | null;
    const findLocal = TypeOrmFind.Nullable(find);

    if (!find.relations) {
      findLocal.relations = {
        buyer: true,
        seller: true,
        monitor: true,
        playlist: true,
      };
    }

    if (caseInsensitive) {
      result = await TypeOrmFind.findOneCI(
        this.requestRepository,
        TypeOrmFind.Nullable(find),
      );
    } else {
      result = await this.requestRepository.findOne(TypeOrmFind.Nullable(find));
    }

    return result;
  }

  /**
   * WebSocket change
   *
   * TODO: Переделать на более умный алгоритм
   */
  async websocketChange({
    playlist,
    playlistDelete = false,
    files,
    filesDelete = false,
    monitor,
    monitorDelete = false,
    request,
    requestDelete = false,
  }: {
    playlist?: PlaylistEntity;
    playlistDelete?: boolean;
    files?: FileEntity[];
    filesDelete?: boolean;
    monitor?: MonitorEntity;
    monitorDelete?: boolean;
    request?: RequestEntity;
    requestDelete?: boolean;
  }) {
    if (playlist) {
      const requests = await this.monitorRequests({
        playlistId: playlist.id,
      });

      const wsPromise = requests.map(async (requestLocal) =>
        this.wsGateway.onChange({ request: requestLocal }),
      );

      await Promise.allSettled(wsPromise);
      // } else if (files) {
    } else if (monitor) {
      if (monitorDelete) {
        const applications = await this.monitorRequests({
          monitorId: monitor.id,
        });

        const wsPromise = applications.map(async (requestLocal) =>
          this.wsGateway.onChange({ request: requestLocal }),
        );

        await Promise.allSettled(wsPromise);
      } else {
        await this.wsGateway.onChange({ monitor });
      }
    } else if (request) {
      if (requestDelete) {
        await this.wsGateway.onChange({ monitor: request.monitor });
      } else {
        await this.wsGateway.onChange({ request });
      }
    }
  }

  /**
   * Get the requests for the monitor
   *
   * @param {string} monitorId Монитор ID
   * @param {string} playlistId Плэйлист ID
   * @param {(string | Date)} [dateLocal=new Date()] Локальная для пользователя дата
   * @return {*}
   * @memberof RequestService
   */
  async monitorRequests({
    monitorId,
    playlistId,
    dateLocal = new Date(),
  }: {
    monitorId?: string;
    playlistId?: string;
    dateLocal?: Date;
  }) {
    const monitorRequests = await this.find({
      where: [
        {
          monitorId,
          playlistId,
          approved: RequestApprove.ALLOWED,
          dateWhen: LessThanOrEqual<Date>(dateLocal),
          dateBefore: MoreThanOrEqual<Date>(dateLocal),
        },
        {
          monitorId,
          playlistId,
          approved: RequestApprove.ALLOWED,
          dateWhen: LessThanOrEqual<Date>(dateLocal),
          dateBefore: IsNull(),
        },
      ],
      relations: { playlist: { files: true } },
      loadEagerRelations: false,
      order: { updatedAt: 'DESC' },
    });

    let forceReplace = false;

    const expected = monitorRequests.filter(
      ({ dateWhen, dateBefore, playlistChange }) => {
        if (forceReplace) {
          return false;
        }
        let isExpect = true;

        if (dateBefore) {
          const date1 = new Date(dateBefore);
          date1.setSeconds(0, 0);

          isExpect = date1 >= dateLocal;
        }

        if (playlistChange) {
          const date2 = new Date(dateWhen);
          date2.setSeconds(0, 0);

          if (dateLocal >= date2) {
            forceReplace = true;
          }
        }

        return isExpect;
      },
    );

    return expected;
  }

  private async requestPostCreate({
    request,
  }: {
    request: RequestEntity;
  }): Promise<void> {
    const { multiple } = request.monitor;
    if (multiple === MonitorMultiple.SINGLE) {
      await this.websocketChange({ request });
    } else {
      await this.requestRepository.manager.transaction(async (transact) => {
        const groupMonitors = await this.editorService.partitionMonitors({
          request,
        });
        if (!Array.isArray(groupMonitors)) {
          throw new NotAcceptableException('Monitors or Playlists not found');
        }

        const groupMonitorPromise = groupMonitors.map(async (monitor) => {
          const { id, ...insert } = request;
          const req = await transact.save(
            RequestEntity,
            transact.create(RequestEntity, {
              ...insert,
              hide: true,
              parentRequestId: id,
              monitorId: monitor.id,
              playlistId: monitor.playlist.id,
            }),
          );

          await this.websocketChange({ request: req });

          return req;
        });

        await Promise.all(groupMonitorPromise);
      });
    }
  }

  private async requestPreDelete({
    request,
    delete: deleteLocal = false,
  }: {
    request: RequestEntity;
    delete?: boolean;
  }): Promise<void> {
    const { multiple } = request.monitor;
    if (multiple === MonitorMultiple.SINGLE) {
      await this.websocketChange({ request, requestDelete: true });
    } else {
      await this.requestRepository.manager.transaction(async (transact) => {
        const groupApplication = await transact.find(RequestEntity, {
          where: {
            parentRequestId: request.id,
          },
          relations: { monitor: true, playlist: true },
        });
        const groupAppPromise = groupApplication.map(async (app) => {
          await this.websocketChange({
            request: app,
            requestDelete: true,
          });
          if (deleteLocal) {
            if (multiple === MonitorMultiple.SCALING) {
              await transact.delete(PlaylistEntity, { id: app.playlistId });
            }
            await transact.delete(RequestEntity, { id: app.id });
          }
        });

        await Promise.all(groupAppPromise);
      });
    }
  }

  /**
   * Update the application
   *
   * @param update Partial<RequestEntity>
   * @returns
   */
  async update(
    id: string,
    update: Partial<RequestEntity>,
  ): Promise<RequestEntity> {
    return this.requestRepository.manager.transaction(async (transact) => {
      const updateResult = await transact.update(
        RequestEntity,
        id,
        transact.create(RequestEntity, update),
      );
      if (!updateResult.affected) {
        throw new NotFoundException('Application not found');
      }

      let relations: FindOneOptions<RequestEntity>['relations'];
      if (update.approved !== RequestApprove.NOTPROCESSED) {
        relations = {
          buyer: true,
          seller: true,
          monitor: { groupMonitors: true },
          playlist: { files: true },
          user: true,
        };
      } else {
        relations = { seller: true };
      }
      const request = await transact.findOne(RequestEntity, {
        where: { id },
        relations,
      });
      if (!request) {
        throw new NotFoundException('Application not found');
      }

      if (update.approved === RequestApprove.NOTPROCESSED) {
        const sellerEmail = request.seller?.email;
        if (sellerEmail) {
          await this.mailService
            .sendApplicationWarningMessage({
              email: sellerEmail,
              applicationUrl: `${this.frontendUrl}/applications`,
            })
            .catch((error: unknown) => {
              this.logger.error(
                `ApplicationService seller email=${sellerEmail}: ${error}`,
                error,
              );
            });
        } else {
          this.logger.error(`ApplicationService seller email='${sellerEmail}'`);
        }
      } else if (update.approved === RequestApprove.ALLOWED) {
        await this.requestPostCreate({ request });
      } else if (update.approved === RequestApprove.DENIED) {
        await this.requestPreDelete({ request });
      }

      return request;
    });
  }

  async create(insert: Partial<RequestEntity>) {
    return this.requestRepository.manager.transaction(async (transact) => {
      const insertResult = await transact.insert(
        RequestEntity,
        transact.create(RequestEntity, insert),
      );
      if (!insertResult.identifiers[0]) {
        throw new NotFoundException('Error when creating Application');
      }
      const { id } = insertResult.identifiers[0];

      let relations: FindOneOptions<RequestEntity>['relations'];
      if (!(insert.approved === RequestApprove.NOTPROCESSED || insert.hide)) {
        relations = { seller: true };
      } else {
        relations = {
          buyer: true,
          seller: true,
          monitor: { groupMonitors: true },
          playlist: { files: true },
          user: true,
        };
      }
      const request = await transact.findOne(RequestEntity, {
        where: { id },
        relations,
      });
      if (!request) {
        throw new NotFoundException('Application not found');
      }

      if (insert.approved === RequestApprove.NOTPROCESSED) {
        const sellerEmail = request.seller?.email;
        if (sellerEmail) {
          await this.mailService
            .sendApplicationWarningMessage({
              email: sellerEmail,
              applicationUrl: `${this.frontendUrl}/applications`,
            })
            .catch((error: unknown) => {
              this.logger.error(
                `ApplicationService seller email=${sellerEmail}: ${error}`,
                error,
              );
            });
        } else {
          this.logger.error(`ApplicationService seller email='${sellerEmail}'`);
        }
      } else if (insert.approved === RequestApprove.ALLOWED) {
        await this.requestPostCreate({ request });
      } else if (insert.approved === RequestApprove.DENIED) {
        await this.requestPreDelete({ request });
      }

      return request;
    });
  }

  async delete(request: RequestEntity): Promise<DeleteResult> {
    await this.requestPreDelete({
      request,
      delete: true,
    });

    const deleteResult = await this.requestRepository.delete({
      id: request.id,
    });

    return deleteResult;
  }

  async precalculate({
    user,
    playlistDuration,
    dateFrom,
    dateTo,
    monitorIds,
  }: {
    user: UserExtEntity;
    playlistDuration: number;
    dateFrom: string;
    dateTo: string;
    monitorIds: string[];
  }): Promise<string> {
    const monitors = await this.monitorService.find({
      userId: user.id,
      find: {
        where: { id: In(monitorIds) },
        relations: [],
        loadEagerRelations: false,
        select: ['id', 'price1s', 'minWarranty'],
      },
    });
    if (!monitors.length) {
      throw new NotFoundException('Monitors not found');
    }
    if (monitorIds && monitors.length !== monitorIds.length) {
      throw new NotFoundException('Monitors not found');
    }
    const diffDays = differenceInDays(parseISO(dateTo), parseISO(dateFrom));

    const sum = monitors.reduce(
      (acc, monitor) =>
        acc +
        playlistDuration * monitor.price1s * monitor.minWarranty * diffDays,
      0,
    );

    return String(sum);
  }
}
