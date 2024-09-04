import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  DeepPartial,
  DeleteResult,
  EntityManager,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import dayjs from 'dayjs';
import { ClientProxy } from '@nestjs/microservices';

import {
  FindManyOptionsExt,
  FindOneOptionsExt,
  MsvcMailBidMessage,
} from '@/interfaces';
import {
  BidApprove,
  MsvcMailService,
  MonitorMultiple,
  UserRoleEnum,
  MICROSERVICE_MYSCREEN,
} from '@/enums';
import {
  BadRequestError,
  InternalServerError,
  NotAcceptableError,
  NotFoundError,
} from '@/errors';
import { getFullName } from '@/utils/full-name';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { MonitorService } from '@/database/monitor.service';
import { EditorService } from '@/database/editor.service';
import { FileService } from '@/database/file.service';
import { ActService } from './act.service';
import { BidEntity } from './bid.entity';
import { PlaylistEntity } from './playlist.entity';
import { UserExtView } from './user-ext.view';
import { WalletService } from './wallet.service';
import { WsStatistics } from './ws.statistics';
import { I18nPath } from '@/i18n';

@Injectable()
export class BidService {
  private logger = new Logger(BidService.name);

  public commissionPercent: number;

  constructor(
    readonly configService: ConfigService,
    private readonly actService: ActService,
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(forwardRef(() => EditorService))
    private readonly editorService: EditorService,
    @Inject(forwardRef(() => MonitorService))
    private readonly monitorService: MonitorService,
    @Inject(forwardRef(() => WsStatistics))
    private readonly wsStatistics: WsStatistics,
    @InjectRepository(BidEntity)
    private readonly bidRepository: Repository<BidEntity>,
    @InjectRepository(PlaylistEntity)
    private readonly playlistRepository: Repository<PlaylistEntity>,
    @Inject(MICROSERVICE_MYSCREEN.MAIL)
    private readonly mailMsvc: ClientProxy,
    private readonly entityManager: EntityManager,
  ) {
    this.commissionPercent = parseInt(
      configService.getOrThrow('COMMISSION_PERCENT'),
      10,
    );
  }

  async find({
    caseInsensitive = true,
    ...find
  }: FindManyOptionsExt<BidEntity>): Promise<BidEntity[]> {
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

  async findAndCount({
    caseInsensitive = true,
    ...find
  }: FindManyOptionsExt<BidEntity>): Promise<[BidEntity[], number]> {
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

  async findOne({
    caseInsensitive = true,
    ...find
  }: FindOneOptionsExt<BidEntity>): Promise<BidEntity | null> {
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

  private async bidPostCreate({
    bid,
    transact,
  }: {
    bid: BidEntity;
    transact?: EntityManager;
  }): Promise<void> {
    if (!bid.monitor) {
      throw new InternalServerError();
    }
    const { multiple } = bid.monitor;
    const { id, seqNo, createdAt, updatedAt, ...insert } = bid;
    if (multiple === MonitorMultiple.SINGLE) {
      await this.wsStatistics.onChange({ bid });
    } else {
      const manager = transact ?? this.entityManager;
      await manager.transaction('REPEATABLE READ', async (transact) => {
        const groupMonitors = await this.editorService.partitionMonitors({
          bid,
        });
        if (!Array.isArray(groupMonitors)) {
          throw new NotAcceptableError('Monitors or Playlists not found');
        }

        const groupMonitorPromise = groupMonitors.map(async (monitor) => {
          const createReq = transact.create(BidEntity, {
            ...insert,
            hide: true,
            parentRequestId: id,
            monitor: monitor.monitor,
            monitorId: monitor.monitorId,
            playlistId: monitor.playlist.id,
          });
          const { id: subBidID } = await transact.save(BidEntity, createReq);
          const subBid = await transact.findOne(BidEntity, {
            where: { id: subBidID },
            relations: { playlist: { files: true } },
          });
          if (!subBid) {
            throw new InternalServerError();
          }

          await this.wsStatistics.onChange({ bid: subBid });

          return subBid;
        });

        await Promise.all(groupMonitorPromise);
      });
    }
  }

  private async bidPreDelete({
    bid,
    transact,
    delete: deleteLocal = false,
  }: {
    bid: BidEntity;
    transact?: EntityManager;
    delete?: boolean;
  }): Promise<void> {
    if (!bid.monitor) {
      throw new InternalServerError();
    }
    const { multiple } = bid.monitor;
    if (multiple === MonitorMultiple.SINGLE) {
      await this.wsStatistics.onChange({ bidDelete: bid });
    } else {
      const manager = transact ?? this.entityManager;
      await manager.transaction('REPEATABLE READ', async (transact) => {
        const groupApplication = await transact.find(BidEntity, {
          where: {
            parentRequestId: bid.id,
          },
          relations: { monitor: true, playlist: true },
        });
        const groupAppPromise = groupApplication.map(async (bidLocal) => {
          await this.wsStatistics.onChange({ bidDelete: bidLocal });
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
    return this.entityManager.transaction(
      'REPEATABLE READ',
      async (transact) => {
        const updateResult = await transact.update(
          BidEntity,
          id,
          transact.create(BidEntity, update),
        );
        if (!updateResult.affected) {
          throw new NotFoundError<I18nPath>('error.bid.not_found');
        }

        let relations: FindOptionsRelations<BidEntity>;
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
          throw new NotFoundError<I18nPath>('error.bid.not_found', {
            args: { id },
          });
        }

        if (update.approved === BidApprove.NOTPROCESSED) {
          if (!bid.seller) {
            throw new InternalServerError();
          }
          const sellerEmail = bid.seller.email;
          if (sellerEmail) {
            const language = bid.seller.preferredLanguage;
            this.mailMsvc.emit<unknown, MsvcMailBidMessage>(
              MsvcMailService.BidWarning,
              {
                email: sellerEmail,
                bidUrl: `${this.fileService.frontEndUrl}/bids`,
                language,
              },
            );
          } else {
            this.logger.error(`BidService seller email undefined ?`);
          }
        } else if (update.approved === BidApprove.ALLOWED) {
          if (!bid.user) {
            throw new InternalServerError();
          }
          // Оплата поступает на пользователя - владельца монитора
          const sumIncrement =
            -(Number(bid.sum) * (100 - this.commissionPercent)) / 100;
          if (sumIncrement !== 0) {
            await this.actService.create({
              userId: bid.sellerId,
              sum: sumIncrement,
              isSubscription: false,
              description: `Оплата заявки №${bid.seqNo} рекламодателем ${getFullName(bid.user)}`,
              transact,
            });
          }

          await this.bidPostCreate({ bid, transact });
        } else if (update.approved === BidApprove.DENIED) {
          // Возврат средств на пользователя - рекламодателя
          if (Number(bid.sum) !== 0 && bid.buyerId) {
            await this.actService.create({
              userId: bid.buyerId,
              sum: -bid.sum,
              isSubscription: false,
              description: `Возврат средств после отмены заявки №${bid.seqNo}`,
              transact,
            });
          }

          await this.bidPreDelete({ bid, transact });
        }

        return bid;
      },
    );
  }

  async create({
    user,
    playlistId,
    monitorIds,
    dateWhen,
    dateBefore,
    playlistChange,
  }: {
    user: UserExtView;
    playlistId: string;
    monitorIds: string[];
    dateWhen: Date;
    dateBefore: Date | null;
    playlistChange: boolean;
  }): Promise<BidEntity[]> {
    const { id: userId, role } = user;
    const totalBalance = await this.walletService.walletSum({ userId });

    // Проверяем наличие плейлиста
    if (!Array.isArray(monitorIds) || monitorIds.length < 1) {
      throw new BadRequestError('Monitors should not be null or undefined');
    }
    const where: FindOptionsWhere<PlaylistEntity> = {
      id: playlistId,
    };
    if (role !== UserRoleEnum.Administrator) {
      where.userId = userId;
    }
    const playlist = await this.playlistRepository.findOne({
      where,
    });
    if (!playlist) {
      throw new NotFoundError<I18nPath>('error.playlist.not_found', {
        args: { id: playlistId },
      });
    }

    return this.entityManager.transaction(
      'REPEATABLE READ',
      async (transact) => {
        const bidsPromise = monitorIds.map(async (monitorId) => {
          // Проверяем наличие мониторов
          let monitor = await this.monitorService.findOne({
            where: { id: monitorId },
            loadEagerRelations: false,
            relations: {},
            transact,
          });
          if (!monitor) {
            throw new NotFoundError(`Monitor '${monitorIds}' not found`);
          }

          monitor = await this.monitorService.update(
            monitorId,
            {
              playlist,
            },
            undefined,
            transact,
          );

          const approved =
            monitor.userId === userId
              ? BidApprove.ALLOWED
              : BidApprove.NOTPROCESSED;

          let sum = 0;
          if (userId !== monitor.userId) {
            sum = await this.precalculateSum({
              user,
              minWarranty: monitor.minWarranty,
              price1s: monitor.price1s,
              dateBefore,
              dateWhen,
              playlistId,
            });

            if (sum > totalBalance) {
              throw new NotAcceptableError<I18nPath>('error.BALANCE', {
                args: { sum, totalBalance },
              });
            }
          }

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
            throw new NotFoundError<I18nPath>('error.bid.error');
          }
          const { id } = insertResult.identifiers[0];

          let relations: FindOptionsRelations<BidEntity>;
          if (!(insert.approved === BidApprove.NOTPROCESSED || !insert.hide)) {
            relations = { buyer: true, seller: true, user: true };
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
            throw new NotFoundError<I18nPath>('error.bid.not_found', {
              args: { id },
            });
          }
          if (!bid.user || !bid.seller || !bid.buyer) {
            throw new InternalServerError();
          }

          // Списываем средства со счета пользователя Рекламодателя
          if (sum !== 0) {
            await this.actService.create({
              userId,
              sum,
              isSubscription: false,
              description: `Оплата заявки №${bid.seqNo} рекламодателем ${getFullName(bid.user)}`,
              transact,
            });
          }

          // Отправляем письмо продавцу
          if (insert.approved === BidApprove.NOTPROCESSED) {
            const sellerEmail = bid.seller.email;
            const language =
              bid.seller.preferredLanguage ?? user.preferredLanguage;
            this.mailMsvc.emit<unknown, MsvcMailBidMessage>(
              MsvcMailService.BidWarning,
              {
                email: sellerEmail,
                bidUrl: `${this.fileService.frontEndUrl}/bids`,
                language,
              },
            );
          } else if (insert.approved === BidApprove.ALLOWED) {
            // Оплата поступает на пользователя - владельца монитора
            if (sum !== 0) {
              const sumIncrement =
                -(sum * (100 - this.commissionPercent)) / 100;
              if (sumIncrement !== 0) {
                await this.actService.create({
                  userId: bid.sellerId,
                  sum: sumIncrement,
                  isSubscription: false,
                  description: `Оплата заявки №${bid.seqNo} рекламодателем ${getFullName(bid.user)}`,
                  transact,
                });
              }
            }

            await this.bidPostCreate({ bid, transact });
          } else if (insert.approved === BidApprove.DENIED) {
            await this.bidPreDelete({ bid, transact });
          }

          this.wsStatistics.onMetrics({
            userId: bid.seller.id,
            storageSpace: bid.seller.storageSpace,
          });
          if (bid.buyer && bid.buyerId) {
            this.wsStatistics.onMetrics({
              userId: bid.buyerId,
              storageSpace: bid.buyer.storageSpace,
            });
          }

          return bid;
        });

        return Promise.all(bidsPromise);
      },
    );
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
    user: UserExtView;
    playlistDuration: number;
    dateFrom: string;
    dateTo: string;
    monitorIds: string[];
  }): Promise<string> {
    const monitors = await this.monitorService.find({
      userId: user.id,
      where: { id: In(monitorIds) },
      relations: [],
      loadEagerRelations: false,
      select: ['id', 'price1s', 'minWarranty'],
    });
    if (!monitors.length) {
      throw new NotFoundError('Monitors not found');
    }
    if (monitorIds && monitors.length !== monitorIds.length) {
      throw new NotFoundError('Monitors not found');
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
    user: UserExtView;
    minWarranty: number;
    price1s: number;
    dateBefore: Date | null;
    dateWhen: Date;
    playlistId: string;
  }): Promise<number> {
    const playlist = await this.playlistRepository.findOne({
      where: { id: playlistId, userId: user.id },
      relations: ['files'],
      loadEagerRelations: false,
      select: ['id', 'files'],
    });
    if (!playlist) {
      throw new NotFoundError<I18nPath>('error.playlist.not_found');
    }

    // продолжительность плейлиста заявки в сек.
    const playlistDuration = playlist.files.reduce(
      (acc, f) => acc + f.duration,
      0,
    );

    // арендуемое время показа за весь период в секундах.
    const diffDays = dayjs(dateBefore ?? Date.now()).diff(dateWhen, 'days') + 1;
    const seconds = (minWarranty * diffDays * 24 * 60 * 60) / playlistDuration;

    // сумма списания
    const sum = parseFloat(Number(price1s * seconds).toFixed(2));

    return sum;
  }
}
