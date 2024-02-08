import {
  BadRequestException,
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
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { parseISO } from 'date-fns/parseISO';
import { differenceInDays } from 'date-fns/differenceInDays';
import { ClientProxy } from '@nestjs/microservices';

import { MAIL_SERVICE, MailSendApplicationMessage } from '@/interfaces';
import { WSGateway } from '@/websocket/ws.gateway';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { RequestApprove, MonitorMultiple, UserRoleEnum } from '@/enums';
import { RequestEntity } from './request.entity';
import { FileEntity } from './file.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';
import { UserExtEntity } from './user-ext.entity';
import { MonitorService } from '@/database/monitor.service';
import { EditorService } from '@/database/editor.service';
import { FileService } from '@/database/file.service';
import { PlaylistService } from './playlist.service';
import { ActService } from './act.service';
import { WalletService } from './wallet.service';
import { getFullName } from '@/utils/full-name';

@Injectable()
export class RequestService {
  private logger = new Logger(RequestService.name);

  private comission: number;

  private frontendUrl: string;

  constructor(
    @Inject(MAIL_SERVICE)
    private readonly mailService: ClientProxy,
    @Inject(forwardRef(() => ActService))
    private readonly actService: ActService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(forwardRef(() => EditorService))
    private readonly editorService: EditorService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
    @Inject(forwardRef(() => MonitorService))
    private readonly monitorService: MonitorService,
    @Inject(forwardRef(() => PlaylistService))
    private readonly playlistService: PlaylistService,
    @InjectRepository(RequestEntity)
    private readonly requestRepository: Repository<RequestEntity>,
    configService: ConfigService,
  ) {
    this.comission = parseInt(configService.get<string>('COMISSION', '5'), 10);
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
    const findLocal = TypeOrmFind.findParams(find);

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
    const findLocal = TypeOrmFind.findParams(find);

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
    const findLocal = TypeOrmFind.findParams(find);

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
        TypeOrmFind.findParams(find),
      );
    } else {
      result = await this.requestRepository.findOne(
        TypeOrmFind.findParams(find),
      );
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
  }): Promise<Array<RequestEntity>> {
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

    let expected = monitorRequests.filter(
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

    const expectedPromise = expected.map(
      async (request) =>
        ({
          ...request,
          playlist: {
            ...request.playlist,
            files: await Promise.all(
              request.playlist.files.map(async (file) =>
                this.fileService.signedUrl(file),
              ),
            ),
          },
        }) as RequestEntity,
    );
    expected = await Promise.all(expectedPromise);

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
          monitor: { groupMonitors: true, user: true },
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
          this.mailService.emit<unknown, MailSendApplicationMessage>(
            'sendApplicationWarningMessage',
            {
              email: sellerEmail,
              applicationUrl: `${this.frontendUrl}/applications`,
            },
          );
        } else {
          this.logger.error(`ApplicationService seller email='${sellerEmail}'`);
        }
      } else if (update.approved === RequestApprove.ALLOWED) {
        // Оплата поступает на пользователя - владельца монитора
        const sumIncrement = -(request.sum * (100 - this.comission)) / 100;
        await this.actService.create({
          user: request.monitor.user,
          sum: sumIncrement,
          description: `Оплата за монитор "${request.monitor.name}" рекламодателем "${getFullName(request.user)}"`,
        });

        await this.requestPostCreate({ request });
      } else if (update.approved === RequestApprove.DENIED) {
        // Снята оплата на пользователя - рекламодателя
        await this.actService.create({
          user: request.seller,
          sum: request.sum,
          description: `Снята оплата за монитор "${request.monitor.name}" рекламодателем "${getFullName(request.user)}"`,
        });

        await this.requestPreDelete({ request });
      }

      return request;
    });
  }

  async create({
    user,
    playlistId,
    monitorIds,
    dateWhen,
    dateBefore,
    playlistChange,
  }: {
    user: UserExtEntity;
    playlistId: string;
    monitorIds: Array<string>;
    dateWhen: Date;
    dateBefore: Date | null;
    playlistChange: boolean;
  }): Promise<RequestEntity[]> {
    const { id: userId, role } = user;

    // Проверяем наличие плейлиста
    if (!Array.isArray(monitorIds) || monitorIds.length < 1) {
      throw new BadRequestException('Monitors should not be null or undefined');
    }
    const where: FindOptionsWhere<PlaylistEntity> = {
      id: playlistId,
    };
    if (role !== UserRoleEnum.Administrator) {
      where.userId = userId;
    }
    const playlist = await this.playlistService.findOne({
      where,
    });
    if (!playlist) {
      throw new NotFoundException(`Playlist "${playlistId}" not found`);
    }

    return this.requestRepository.manager.transaction(async (transact) => {
      const requestsPromise = monitorIds.map(async (monitorId) => {
        // Проверяем наличие мониторов
        let monitor = await this.monitorService.findOne({
          find: {
            where: { id: monitorId },
            loadEagerRelations: false,
            relations: {},
          },
        });
        if (!monitor) {
          throw new NotFoundException(`Monitor "${monitorIds}" not found`);
        }

        monitor = await this.monitorService.update(monitorId, {
          playlist,
        });

        const approved =
          monitor.userId === userId
            ? RequestApprove.ALLOWED
            : RequestApprove.NOTPROCESSED;

        const sum = dateBefore
          ? await this.precalculateSum({
              user,
              minWarranty: monitor.minWarranty,
              price1s: monitor.price1s,
              dateBefore,
              dateWhen,
              playlistId,
            })
          : 0;

        const insert: DeepPartial<RequestEntity> = {
          sellerId: monitor.userId,
          buyerId: userId,
          monitor,
          playlist,
          approved,
          userId,
          dateBefore,
          dateWhen,
          playlistChange,
          sum,
        };

        const insertResult = await transact.insert(
          RequestEntity,
          transact.create(RequestEntity, insert),
        );
        if (!insertResult.identifiers[0]) {
          throw new NotFoundException('Error when creating Request');
        }
        const { id } = insertResult.identifiers[0];

        let relations: FindOneOptions<RequestEntity>['relations'];
        if (
          !(insert.approved === RequestApprove.NOTPROCESSED || !insert.hide)
        ) {
          relations = { buyer: true, seller: true };
        } else {
          relations = {
            buyer: true,
            seller: true,
            monitor: { groupMonitors: true, user: true },
            playlist: { files: true },
            user: true,
          };
        }
        const request = await transact.findOne(RequestEntity, {
          where: { id },
          relations,
        });
        if (!request) {
          throw new NotFoundException('Request not found');
        }

        // Списываем средства со счета пользователя Рекламодателя
        await this.actService.create({
          user,
          sum,
          description: `Оплата за монитор "${monitor.name}" рекламодателем "${getFullName(user)}"`,
        });

        // Отправляем письмо продавцу
        if (insert.approved === RequestApprove.NOTPROCESSED) {
          const sellerEmail = request.seller?.email;
          if (sellerEmail) {
            this.mailService.emit<unknown, MailSendApplicationMessage>(
              'sendApplicationWarningMessage',
              {
                email: sellerEmail,
                applicationUrl: `${this.frontendUrl}/applications`,
              },
            );
          } else {
            this.logger.error(
              `ApplicationService seller email='${sellerEmail}'`,
            );
          }
        } else if (insert.approved === RequestApprove.ALLOWED) {
          // Оплата поступает на пользователя - владельца монитора
          const sumIncrement = -(sum * (100 - this.comission)) / 100;
          await this.actService.create({
            user: request.buyer ?? monitor.user,
            sum: sumIncrement,
            description: `Оплата за монитор "${monitor.name}" рекламодателем "${getFullName(user)}"`,
          });

          await this.requestPostCreate({ request });
        } else if (insert.approved === RequestApprove.DENIED) {
          await this.requestPreDelete({ request });
        }

        return request;
      });

      return Promise.all(requestsPromise);
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

  async precalculatePromo({
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

  async precalculateSum({
    user,
    minWarranty,
    price1s,
    dateBefore,
    dateWhen,
    playlistId,
  }: {
    user: UserExtEntity;
    minWarranty: number;
    price1s: number;
    dateBefore: Date;
    dateWhen: Date;
    playlistId: string;
  }): Promise<number> {
    const playlist = await this.playlistService.findOne({
      where: { id: playlistId, userId: user.id },
      relations: ['files'],
      loadEagerRelations: false,
      select: ['id', 'files'],
    });
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    // продолжительность плейлиста заявки в сек.
    const playlistDuration = playlist.files.reduce(
      (acc, f) => acc + f.duration,
      0,
    );

    // арендуемое время показа за весь период в секундах.
    const diffDays = differenceInDays(dateBefore, dateWhen);
    const seconds = playlistDuration * minWarranty * diffDays * 24 * 60 * 60;

    // сумма списания
    const sum = price1s * seconds;

    return sum;
  }
}
