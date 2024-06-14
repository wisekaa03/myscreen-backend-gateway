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
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import dayjs from 'dayjs';
import { ClientProxy } from '@nestjs/microservices';

import { MailSendBidMessage } from '@/interfaces';
import { MAIL_SERVICE } from '@/constants';
import { WSGateway } from '@/websocket/ws.gateway';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { BidApprove, MonitorMultiple, UserRoleEnum } from '@/enums';
import { BidEntity } from './bid.entity';
import { FileEntity } from './file.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';
import { MonitorService } from '@/database/monitor.service';
import { EditorService } from '@/database/editor.service';
import { FileService } from '@/database/file.service';
import { PlaylistService } from './playlist.service';
import { ActService } from './act.service';
import { getFullName } from '@/utils/full-name';
import { UserResponse } from './user-response.entity';

@Injectable()
export class BidService {
  private logger = new Logger(BidService.name);

  public commissionPercent: number;

  constructor(
    @Inject(MAIL_SERVICE)
    private readonly mailService: ClientProxy,
    @Inject(forwardRef(() => ActService))
    private readonly actService: ActService,
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
    @InjectRepository(BidEntity)
    private readonly bidRepository: Repository<BidEntity>,
    configService: ConfigService,
  ) {
    this.commissionPercent = parseInt(
      configService.getOrThrow('COMMISSION_PERCENT'),
      10,
    );
  }

  async find(
    find: FindManyOptions<BidEntity>,
    caseInsensitive = true,
  ): Promise<BidEntity[]> {
    let result: BidEntity[];
    const findLocal = TypeOrmFind.findParams(BidEntity, find);

    if (!find.relations) {
      findLocal.relations = {
        buyer: true,
        seller: true,
        monitor: true,
        playlist: true,
      };
    }

    if (caseInsensitive) {
      result = await TypeOrmFind.findCI(this.bidRepository, findLocal);
    } else {
      result = await this.bidRepository.find(findLocal);
    }

    return result;
  }

  async findAndCount(
    find: FindManyOptions<BidEntity>,
    caseInsensitive = true,
  ): Promise<[BidEntity[], number]> {
    let result: [BidEntity[], number];
    const findLocal = TypeOrmFind.findParams(BidEntity, find);

    if (!find.relations) {
      findLocal.relations = {
        buyer: true,
        seller: true,
        monitor: true,
        playlist: true,
      };
    }
    if (caseInsensitive) {
      result = await TypeOrmFind.findAndCountCI(this.bidRepository, findLocal);
    } else {
      result = await this.bidRepository.findAndCount(findLocal);
    }

    return result;
  }

  async findOne(
    find: FindManyOptions<BidEntity>,
    caseInsensitive = true,
  ): Promise<BidEntity | null> {
    let result: BidEntity | null;
    const findLocal = TypeOrmFind.findParams(BidEntity, find);

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
        this.bidRepository,
        TypeOrmFind.findParams(BidEntity, find),
      );
    } else {
      result = await this.bidRepository.findOne(
        TypeOrmFind.findParams(BidEntity, find),
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
    bid,
    bidDelete = false,
  }: {
    playlist?: PlaylistEntity;
    playlistDelete?: boolean;
    files?: FileEntity[];
    filesDelete?: boolean;
    monitor?: MonitorEntity;
    monitorDelete?: boolean;
    bid?: BidEntity;
    bidDelete?: boolean;
  }) {
    if (playlist) {
      const bids = await this.monitorRequests({
        playlistId: playlist.id,
      });

      const wsPromise = bids.map(async (bidLocal) =>
        this.wsGateway.onChange({ bid: bidLocal }),
      );

      await Promise.allSettled(wsPromise);
    }

    if (monitor) {
      if (monitorDelete) {
        const bids = await this.monitorRequests({
          monitorId: monitor.id,
        });

        const wsPromise = bids.map(async (bidLocal) =>
          this.wsGateway.onChange({ bid: bidLocal }),
        );

        await Promise.allSettled(wsPromise);
      }
    }

    if (bid) {
      if (bidDelete) {
        await this.wsGateway.onChange({ monitor: bid.monitor });
      } else {
        await this.wsGateway.onChange({ bid });
      }
    }
  }

  /**
   * Get the bids for the monitor
   *
   * @param {string} monitorId Монитор ID
   * @param {string} playlistId Плэйлист ID
   * @param {(string | Date)} [dateLocal=new Date()] Локальная для пользователя дата
   * @return {*}
   * @memberof BidService
   */
  async monitorRequests({
    monitorId,
    playlistId,
    dateLocal = new Date(),
  }: {
    monitorId?: string;
    playlistId?: string;
    dateLocal?: Date;
  }): Promise<BidEntity[]> {
    const monitorRequests = await this.find({
      where: [
        {
          monitorId,
          playlistId,
          approved: BidApprove.ALLOWED,
          dateWhen: LessThanOrEqual<Date>(dateLocal),
          dateBefore: MoreThanOrEqual<Date>(dateLocal),
        },
        {
          monitorId,
          playlistId,
          approved: BidApprove.ALLOWED,
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
      async (bid) =>
        ({
          ...bid,
          playlist: {
            ...bid.playlist,
            files: await Promise.all(
              bid.playlist.files.map(async (file) =>
                this.fileService.signedUrl(file),
              ),
            ),
          },
        }) as BidEntity,
    );
    expected = await Promise.all(expectedPromise);

    return expected;
  }

  private async bidPostCreate({
    bid,
    entityManager,
  }: {
    bid: BidEntity;
    entityManager?: EntityManager;
  }): Promise<void> {
    const { multiple } = bid.monitor;
    const { id, seqNo, createdAt, updatedAt, ...insert } = bid;
    if (multiple === MonitorMultiple.SINGLE) {
      await this.websocketChange({ bid });
    } else {
      const manager = entityManager ?? this.bidRepository.manager;
      await manager.transaction(async (transact) => {
        const groupMonitors = await this.editorService.partitionMonitors({
          bid,
        });
        if (!Array.isArray(groupMonitors)) {
          throw new NotAcceptableException('Monitors or Playlists not found');
        }

        const groupMonitorPromise = groupMonitors.map(async (monitor) => {
          const createReq = transact.create(BidEntity, {
            ...insert,
            hide: true,
            parentRequestId: id,
            monitorId: monitor.id,
            playlistId: monitor.playlist.id,
          });
          const subBid = await transact.save(BidEntity, createReq);

          await this.websocketChange({ bid: subBid });

          return subBid;
        });

        await Promise.all(groupMonitorPromise);
      });
    }
  }

  private async bidPreDelete({
    bid,
    entityManager,
    delete: deleteLocal = false,
  }: {
    bid: BidEntity;
    entityManager?: EntityManager;
    delete?: boolean;
  }): Promise<void> {
    const { multiple } = bid.monitor;
    if (multiple === MonitorMultiple.SINGLE) {
      await this.websocketChange({ bid, bidDelete: true });
    } else {
      const manager = entityManager ?? this.bidRepository.manager;
      await manager.transaction(async (transact) => {
        const groupApplication = await transact.find(BidEntity, {
          where: {
            parentRequestId: bid.id,
          },
          relations: { monitor: true, playlist: true },
        });
        const groupAppPromise = groupApplication.map(async (bidLocal) => {
          await this.websocketChange({
            bid: bidLocal,
            bidDelete: true,
          });
          if (deleteLocal) {
            if (multiple === MonitorMultiple.SCALING) {
              await transact.delete(PlaylistEntity, {
                id: bidLocal.playlistId,
              });
            }
            await transact.delete(BidEntity, { id: bidLocal.id });
          }
        });

        await Promise.all(groupAppPromise);
      });
    }
  }

  /**
   * Update the bid
   *
   * @param update Partial<BidEntity>
   * @returns
   */
  async update(id: string, update: Partial<BidEntity>): Promise<BidEntity> {
    return this.bidRepository.manager.transaction(async (transact) => {
      const updateResult = await transact.update(
        BidEntity,
        id,
        transact.create(BidEntity, update),
      );
      if (!updateResult.affected) {
        throw new NotFoundException('Application not found');
      }

      let relations: FindOneOptions<BidEntity>['relations'];
      if (update.approved !== BidApprove.NOTPROCESSED) {
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
      const bid = await transact.findOne(BidEntity, {
        where: { id },
        relations,
      });
      if (!bid) {
        throw new NotFoundException('Application not found');
      }

      if (update.approved === BidApprove.NOTPROCESSED) {
        const sellerEmail = bid.seller?.email;
        const language = bid.seller?.preferredLanguage;
        if (sellerEmail) {
          this.mailService.emit<unknown, MailSendBidMessage>(
            'sendBidWarningMessage',
            {
              email: sellerEmail,
              bidUrl: `${this.fileService.frontEndUrl}/bids`,
              language,
            },
          );
        } else {
          this.logger.error(`BidService seller email='${sellerEmail}'`);
        }
      } else if (update.approved === BidApprove.ALLOWED) {
        // Оплата поступает на пользователя - владельца монитора
        const sumIncrement =
          -(Number(bid.sum) * (100 - this.commissionPercent)) / 100;
        if (sumIncrement !== 0) {
          await this.actService.create({
            user: bid.monitor.user,
            sum: sumIncrement,
            isSubscription: false,
            description: `Оплата за монитор "${bid.monitor.name}" рекламодателем "${getFullName(bid.user)}"`,
          });
        }

        await this.bidPostCreate({ bid, entityManager: transact });
      } else if (update.approved === BidApprove.DENIED) {
        // Снята оплата на пользователя - рекламодателя
        if (Number(bid.sum) !== 0) {
          await this.actService.create({
            user: bid.seller,
            sum: bid.sum,
            isSubscription: false,
            description: `Снята оплата за монитор "${bid.monitor.name}" рекламодателем "${getFullName(bid.user)}"`,
          });
        }

        await this.bidPreDelete({ bid, entityManager: transact });
      }

      return bid;
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
    user: UserResponse;
    playlistId: string;
    monitorIds: string[];
    dateWhen: Date;
    dateBefore: Date | null;
    playlistChange: boolean;
  }): Promise<BidEntity[]> {
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
      throw new NotFoundException(`Playlist '${playlistId}' not found`);
    }

    return this.bidRepository.manager.transaction(async (transact) => {
      const bidsPromise = monitorIds.map(async (monitorId) => {
        // Проверяем наличие мониторов
        let monitor = await this.monitorService.findOne({
          find: {
            where: { id: monitorId },
            loadEagerRelations: false,
            relations: {},
          },
        });
        if (!monitor) {
          throw new NotFoundException(`Monitor '${monitorIds}' not found`);
        }

        monitor = await this.monitorService.update(monitorId, {
          playlist,
        });

        const approved =
          monitor.userId === userId
            ? BidApprove.ALLOWED
            : BidApprove.NOTPROCESSED;

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

        const insert: DeepPartial<BidEntity> = {
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
          BidEntity,
          transact.create(BidEntity, insert),
        );
        if (!insertResult.identifiers[0]) {
          throw new NotFoundException('Error when creating Request');
        }
        const { id } = insertResult.identifiers[0];

        let relations: FindOneOptions<BidEntity>['relations'];
        if (!(insert.approved === BidApprove.NOTPROCESSED || !insert.hide)) {
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
        const bid = await transact.findOne(BidEntity, {
          where: { id },
          relations,
        });
        if (!bid) {
          throw new NotFoundException('Request not found');
        }

        // Списываем средства со счета пользователя Рекламодателя
        if (Number(sum) !== 0) {
          await this.actService.create({
            user,
            sum,
            isSubscription: false,
            description: `Оплата за монитор "${monitor.name}" рекламодателем "${getFullName(user)}"`,
          });
        }

        // Отправляем письмо продавцу
        if (insert.approved === BidApprove.NOTPROCESSED) {
          const sellerEmail = bid.seller?.email;
          const language =
            bid.seller.preferredLanguage ?? user.preferredLanguage;
          if (sellerEmail) {
            this.mailService.emit<unknown, MailSendBidMessage>(
              'sendBidWarningMessage',
              {
                email: sellerEmail,
                bidUrl: `${this.fileService.frontEndUrl}/bids`,
                language,
              },
            );
          } else {
            this.logger.error(`BidService seller email='${sellerEmail}'`);
          }
        } else if (insert.approved === BidApprove.ALLOWED) {
          // Оплата поступает на пользователя - владельца монитора
          const sumIncrement =
            -(Number(sum) * (100 - this.commissionPercent)) / 100;
          const actUserResponse = bid.buyer ? bid.buyer : monitor.user;
          if (sumIncrement !== 0) {
            await this.actService.create({
              user: actUserResponse,
              sum: sumIncrement,
              isSubscription: false,
              description: `Оплата за монитор "${monitor.name}" рекламодателем "${getFullName(user)}"`,
            });
          }

          await this.bidPostCreate({ bid, entityManager: transact });
        } else if (insert.approved === BidApprove.DENIED) {
          await this.bidPreDelete({ bid, entityManager: transact });
        }

        return bid;
      });

      return Promise.all(bidsPromise);
    });
  }

  async delete(bid: BidEntity): Promise<DeleteResult> {
    await this.bidPreDelete({
      bid,
      delete: true,
    });

    const deleteResult = await this.bidRepository.delete({
      id: bid.id,
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
    user: UserResponse;
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
    const diffDays = dayjs(dateTo).diff(dateFrom, 'days');

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
    user: UserResponse;
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
    const diffDays = dayjs(dateBefore).diff(dateWhen, 'days');
    const seconds = playlistDuration * minWarranty * diffDays * 24 * 60 * 60;

    // сумма списания
    const sum = price1s * seconds;

    return sum;
  }
}
