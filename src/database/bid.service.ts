import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
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

import { BadRequestError, NotAcceptableError, NotFoundError } from '@/errors';
import { MailSendBidMessage } from '@/interfaces';
import { MAIL_SERVICE } from '@/constants';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { BidApprove, MonitorMultiple, UserRoleEnum } from '@/enums';
import { BidEntity } from './bid.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';
import { MonitorService } from '@/database/monitor.service';
import { EditorService } from '@/database/editor.service';
import { FileService } from '@/database/file.service';
import { ActService } from './act.service';
import { getFullName } from '@/utils/full-name';
import { UserResponse } from './user-response.entity';
import { WalletService } from './wallet.service';
import { WsStatistics } from './ws.statistics';

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
    @Inject(MAIL_SERVICE)
    private readonly mailService: ClientProxy,
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
    playlistDelete,
    bid,
    bidDelete,
  }: {
    playlist?: PlaylistEntity;
    playlistDelete?: PlaylistEntity;
    bid?: BidEntity;
    bidDelete?: BidEntity;
  }) {
    if (playlist) {
      const bids = await this.monitorPlaylistToBids({
        playlistId: playlist.id,
      });

      const wsPromise = bids.map(async (_bid) =>
        this.wsStatistics.onChange({ bid: _bid }),
      );

      await Promise.allSettled(wsPromise);
    }

    if (bid) {
      await this.wsStatistics.onChange({ bid });
    }

    if (bidDelete) {
      await this.wsStatistics.onChange({ bidDelete });
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
  async monitorPlaylistToBids({
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
    transact,
  }: {
    bid: BidEntity;
    transact?: EntityManager;
  }): Promise<void> {
    const { multiple } = bid.monitor;
    const { id, seqNo, createdAt, updatedAt, ...insert } = bid;
    if (multiple === MonitorMultiple.SINGLE) {
      await this.websocketChange({ bid });
    } else {
      const manager = transact ?? this.bidRepository.manager;
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
    transact,
    delete: deleteLocal = false,
  }: {
    bid: BidEntity;
    transact?: EntityManager;
    delete?: boolean;
  }): Promise<void> {
    const { multiple } = bid.monitor;
    if (multiple === MonitorMultiple.SINGLE) {
      await this.websocketChange({ bidDelete: bid });
    } else {
      const manager = transact ?? this.bidRepository.manager;
      await manager.transaction('REPEATABLE READ', async (transact) => {
        const groupApplication = await transact.find(BidEntity, {
          where: {
            parentRequestId: bid.id,
          },
          relations: { monitor: true, playlist: true },
        });
        const groupAppPromise = groupApplication.map(async (bidLocal) => {
          await this.websocketChange({ bidDelete: bidLocal });
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
    return this.bidRepository.manager.transaction(
      'REPEATABLE READ',
      async (transact) => {
        const updateResult = await transact.update(
          BidEntity,
          id,
          transact.create(BidEntity, update),
        );
        if (!updateResult.affected) {
          throw new NotFoundError('Application not found');
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
          throw new NotFoundError('BID_NOT_FOUND', { args: { id } });
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
              userId: bid.monitor.user.id,
              sum: sumIncrement,
              isSubscription: false,
              description: `Оплата заявки №${bid.seqNo} рекламодателем ${getFullName(bid.user)}`,
              transact,
            });
          }

          await this.bidPostCreate({ bid, transact });
        } else if (update.approved === BidApprove.DENIED) {
          // Снята оплата на пользователя - рекламодателя
          if (Number(bid.sum) !== 0) {
            await this.actService.create({
              userId: bid.seller.id,
              sum: bid.sum,
              isSubscription: false,
              description: `Возврат средств после отмены заявки №${bid.seqNo}}`,
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
    user: UserResponse;
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
      throw new NotFoundError('PLAYLIST_NOT_FOUND', {
        args: { id: playlistId },
      });
    }

    return this.bidRepository.manager.transaction(
      'REPEATABLE READ',
      async (transact) => {
        const bidsPromise = monitorIds.map(async (monitorId) => {
          // Проверяем наличие мониторов
          let monitor = await this.monitorService.findOne({
            find: {
              where: { id: monitorId },
              loadEagerRelations: false,
              relations: {},
              transact,
            },
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
              throw new NotAcceptableError('BALANCE', {
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
            throw new NotFoundError('BID_ERROR');
          }
          const { id } = insertResult.identifiers[0];

          let relations: FindOneOptions<BidEntity>['relations'];
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
            throw new NotFoundError('BID_NOT_FOUND', { args: { id } });
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
            if (sum !== 0) {
              const sumIncrement =
                -(sum * (100 - this.commissionPercent)) / 100;
              const actUserResponse = bid.buyer ? bid.buyer : monitor.user;
              if (sumIncrement !== 0) {
                await this.actService.create({
                  userId: actUserResponse.id,
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

          await Promise.all([
            this.wsStatistics.onMetrics(bid.seller),
            this.wsStatistics.onMetrics(bid.buyer ? bid.buyer : monitor.user),
          ]);

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
    user: UserResponse;
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
      throw new NotFoundError('Playlist not found');
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
