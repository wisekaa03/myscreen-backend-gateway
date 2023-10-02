import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  DeleteResult,
  FindManyOptions,
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
import { ApplicationApproved } from '@/enums';
import { MailService } from '@/mail/mail.service';
import { ApplicationEntity } from './application.entity';
import { FileEntity } from './file.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';
import { UserExtEntity } from './user-ext.entity';
// eslint-disable-next-line import/no-cycle
import { MonitorService } from './monitor.service';

@Injectable()
export class ApplicationService {
  private logger = new Logger(ApplicationService.name);

  private frontendUrl: string;

  constructor(
    private readonly mailService: MailService,
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
    if (!find.relations) {
      conditional.relations = ['buyer', 'seller', 'monitor', 'playlist'];
    }
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(this.applicationRepository, conditional)
      : this.applicationRepository.findAndCount(conditional);
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
        playlistId: playlist?.id,
      });

      const wsPromise = applications.map(async (applicationLocal) =>
        this.wsGateway.application(applicationLocal),
      );

      await Promise.allSettled(wsPromise);
      // } else if (files) {
      // } else if (monitor) {
    } else if (application) {
      if (applicationDelete) {
        await this.wsGateway
          .application(null, application.monitor)
          .catch((error: any) => {
            this.logger.error(error);
          });
      } else {
        await this.wsGateway
          .application(application)
          .catch((error: unknown) => {
            this.logger.error(error);
          });
      }
    }
  }

  /**
   * Get the applications for the monitor
   *
   * @param {string} monitorId Монитор ID
   * @param {(string | Date)} [date=new Date()] Локальная для пользователя дата
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

  /**
   * Update the application
   *
   * @param id Application.id
   * @param update Partial<ApplicationEntity>
   * @returns
   */
  async update(
    id: string | undefined,
    update: Partial<ApplicationEntity>,
  ): Promise<ApplicationEntity | null> {
    await this.applicationRepository.manager.transaction(async (transact) => {
      let application: ApplicationEntity | null = await transact.save(
        ApplicationEntity,
        transact.create(ApplicationEntity, update),
      );
      application = await transact.findOne(ApplicationEntity, {
        where: {
          id: application.id,
        },
      });
      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (update.approved === ApplicationApproved.NOTPROCESSED) {
        if (application.seller) {
          await this.mailService
            .sendApplicationWarningMessage(
              application.seller.email,
              `${this.frontendUrl}/applications`,
            )
            .catch((error: any) => {
              this.logger.error(
                `ApplicationService seller email=${application?.seller.email}: ${error}`,
                error,
              );
            });
        } else {
          this.logger.error('ApplicationService seller email=undefined');
        }
      } else if (update.approved === ApplicationApproved.ALLOWED) {
        await this.websocketChange({ application });
      } else if (update.approved === ApplicationApproved.DENIED) {
        await this.websocketChange({ application, applicationDelete: true });
      }
    });

    return id === undefined
      ? null
      : this.applicationRepository.findOne({ where: { id } });
  }

  async delete(
    userId: string,
    application: ApplicationEntity,
  ): Promise<DeleteResult> {
    await this.websocketChange({
      application,
      applicationDelete: true,
    });

    const deleteResult = await this.applicationRepository.delete({
      id: application.id,
      userId,
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
    const monitors = await this.monitorService.find(user.id, {
      where: { id: In(monitorIds) },
      relations: [],
      select: ['id', 'price1s', 'minWarranty'],
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
