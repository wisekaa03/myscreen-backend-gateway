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
  DeepPartial,
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
import { ApplicationApproved, MonitorMultiple } from '@/enums';
import { MailService } from '@/mail/mail.service';
import { ApplicationEntity } from './application.entity';
import { FileEntity } from './file.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';
import { UserExtEntity } from './user-ext.entity';
// eslint-disable-next-line import/no-cycle
import { MonitorService } from './monitor.service';
// eslint-disable-next-line import/no-cycle
import { EditorService } from './editor.service';

@Injectable()
export class ApplicationService {
  private logger = new Logger(ApplicationService.name);

  private frontendUrl: string;

  constructor(
    private readonly mailService: MailService,
    @Inject(forwardRef(() => EditorService))
    private readonly editorService: EditorService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
    @Inject(forwardRef(() => MonitorService))
    private readonly monitorService: MonitorService,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    configService: ConfigService,
  ) {
    this.frontendUrl = configService.get<string>(
      'FRONTEND_URL',
      'http://localhost',
    );
  }

  async find(
    find: FindManyOptions<ApplicationEntity>,
    caseInsensitive = true,
  ): Promise<Array<ApplicationEntity>> {
    const conditional = TypeOrmFind.Nullable(find);
    if (!find.relations) {
      conditional.relations = ['buyer', 'seller', 'monitor', 'playlist'];
    }
    return caseInsensitive
      ? TypeOrmFind.findCI(this.applicationRepository, conditional)
      : this.applicationRepository.find(conditional);
  }

  async findAndCount(
    find: FindManyOptions<ApplicationEntity>,
    caseInsensitive = true,
  ): Promise<[Array<ApplicationEntity>, number]> {
    const conditional = TypeOrmFind.Nullable(find);
    let result: [Array<ApplicationEntity>, number];
    if (!find.relations) {
      conditional.relations = ['buyer', 'seller', 'monitor', 'playlist'];
    }
    if (caseInsensitive) {
      result = await TypeOrmFind.findAndCountCI(
        this.applicationRepository,
        conditional,
      );
    } else {
      result = await this.applicationRepository.findAndCount(conditional);
    }
    return result;
  }

  async findOne(
    find: FindManyOptions<ApplicationEntity>,
  ): Promise<ApplicationEntity | null> {
    return find.relations
      ? this.applicationRepository.findOne(TypeOrmFind.Nullable(find))
      : this.applicationRepository.findOne({
          relations: ['buyer', 'seller', 'monitor', 'playlist'],
          ...TypeOrmFind.Nullable(find),
        });
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
    application,
    applicationDelete = false,
  }: {
    playlist?: PlaylistEntity;
    playlistDelete?: boolean;
    files?: FileEntity[];
    filesDelete?: boolean;
    monitor?: MonitorEntity;
    monitorDelete?: boolean;
    application?: ApplicationEntity;
    applicationDelete?: boolean;
  }) {
    if (playlist) {
      const applications = await this.monitorApplications({
        playlistId: playlist.id,
      });

      const wsPromise = applications.map(async (applicationLocal) =>
        this.wsGateway.application({ application: applicationLocal }),
      );

      await Promise.allSettled(wsPromise);
      // } else if (files) {
      // } else if (monitor) {
    } else if (application) {
      if (applicationDelete) {
        await this.wsGateway.application({ monitor: application.monitor });
      } else {
        await this.wsGateway.application({ application });
      }
    }
  }

  /**
   * Get the applications for the monitor
   *
   * @param {string} monitorId Монитор ID
   * @param {string} playlistId Плэйлист ID
   * @param {(string | Date)} [dateLocal=new Date()] Локальная для пользователя дата
   * @return {*}
   * @memberof ApplicationService
   */
  async monitorApplications({
    monitorId,
    playlistId,
    dateLocal = new Date(),
  }: {
    monitorId?: string;
    playlistId?: string;
    dateLocal?: Date;
  }) {
    const monitorApplicatons = await this.find({
      where: [
        {
          monitorId,
          playlistId,
          approved: ApplicationApproved.ALLOWED,
          dateWhen: LessThanOrEqual<Date>(dateLocal),
          dateBefore: MoreThanOrEqual<Date>(dateLocal),
        },
        {
          monitorId,
          playlistId,
          approved: ApplicationApproved.ALLOWED,
          dateWhen: LessThanOrEqual<Date>(dateLocal),
          dateBefore: IsNull(),
        },
      ],
      relations: ['playlist', 'playlist.files'],
      loadEagerRelations: false,
      order: { updatedAt: 'DESC' },
    });

    let forceReplace = false;

    const expected = monitorApplicatons.filter(
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

  private async applicationCreatePost({
    application,
  }: {
    application: ApplicationEntity;
  }): Promise<void> {
    const { playlist, multiple } = application.monitor;
    if (multiple === MonitorMultiple.SINGLE) {
      await this.websocketChange({ application });
    } else {
      await this.applicationRepository.manager.transaction(async (transact) => {
        const [multipleMonitors, playlists] =
          await this.editorService.partitionMonitors({
            application,
          });
        if (!(Array.isArray(multipleMonitors) && Array.isArray(playlists))) {
          throw new NotAcceptableException('Monitors or Playlists not found');
        }

        const groupMonitorPromise = multipleMonitors.map(async (subMonitor) => {
          const subPlaylist =
            multiple === MonitorMultiple.SCALING
              ? playlists.find(
                  ({ monitors }) =>
                    monitors?.find(({ id }) => id === subMonitor.id),
                )
              : undefined;
          const app = await transact.save(
            ApplicationEntity,
            transact.create(ApplicationEntity, {
              ...application,
              id: undefined,
              hide: true,
              parentApplicationId: application.id,
              monitorId: subMonitor.id,
              playlistId:
                multiple === MonitorMultiple.SCALING
                  ? subPlaylist?.id ?? playlist?.id
                  : playlist?.id,
            }),
          );

          await this.websocketChange({ application: app });

          return app;
        });

        await Promise.all(groupMonitorPromise);
      });
    }
  }

  private async applicationDeletePre({
    application,
    delete: deleteLocal = false,
  }: {
    application: ApplicationEntity;
    delete?: boolean;
  }): Promise<void> {
    const { multiple } = application.monitor;
    if (multiple === MonitorMultiple.SINGLE) {
      await this.websocketChange({ application, applicationDelete: true });
    } else {
      await this.applicationRepository.manager.transaction(async (transact) => {
        const subApplication = await transact.find(ApplicationEntity, {
          where: {
            parentApplicationId: application.id,
          },
          relations: ['monitor', 'playlist'],
        });
        const subAppPromise = subApplication.map(async (app) => {
          await this.websocketChange({
            application: app,
            applicationDelete: true,
          });
          if (deleteLocal) {
            if (multiple === MonitorMultiple.SCALING) {
              await transact.delete(PlaylistEntity, { id: app.playlistId });
            }
            await transact.delete(ApplicationEntity, { id: app.id });
          }
        });

        await Promise.all(subAppPromise);
      });
    }
  }

  /**
   * Create or update the application
   *
   * @param update Partial<ApplicationEntity>
   * @returns
   */
  async update({
    id,
    ...update
  }: DeepPartial<ApplicationEntity>): Promise<ApplicationEntity | null> {
    await this.applicationRepository.manager.transaction(async (transact) => {
      let application: ApplicationEntity | null = await transact.save(
        ApplicationEntity,
        transact.create(ApplicationEntity, { id, ...update }),
      );

      let relations: FindOneOptions<ApplicationEntity>['relations'];
      if (update.approved !== ApplicationApproved.NOTPROCESSED) {
        relations = [
          'buyer',
          'seller',
          'monitor',
          'monitor.multipleMonitors',
          'playlist',
          'playlist.files',
          'user',
        ];
      } else {
        relations = ['seller'];
      }
      application = await transact.findOne(ApplicationEntity, {
        where: {
          id: application.id,
        },
        relations,
      });
      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (update.approved === ApplicationApproved.NOTPROCESSED) {
        const sellerEmail = application.seller?.email;
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
      } else if (update.approved === ApplicationApproved.ALLOWED) {
        await this.applicationCreatePost({ application });
      } else if (update.approved === ApplicationApproved.DENIED) {
        await this.applicationDeletePre({ application });
      }
    });

    return id === undefined
      ? null
      : this.applicationRepository.findOne({ where: { id } });
  }

  async delete(application: ApplicationEntity): Promise<DeleteResult> {
    await this.applicationDeletePre({
      application,
      delete: true,
    });

    const deleteResult = await this.applicationRepository.delete({
      id: application.id,
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
