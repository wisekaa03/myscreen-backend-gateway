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
  FindOptionsWhere,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';

import { StatisticsMonitorsResponse } from '@/dto/response/statistics.response';
import { WSGateway } from '@/websocket/ws.gateway';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { ApplicationApproved, MonitorStatus, UserRoleEnum } from '@/enums';
import { MailService } from '@/mail/mail.service';
import { UserService } from './user.service';
import { ApplicationEntity } from './application.entity';
import { UserEntity } from './user.entity';
import { MonitorEntity } from './monitor.entity';

@Injectable()
export class ApplicationService {
  private logger = new Logger(ApplicationService.name);

  private frontendUrl: string;

  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
    @InjectRepository(MonitorEntity)
    private readonly monitorRepository: Repository<MonitorEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
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

  async monitorApplications(
    monitorId: string,
    date: string | Date = new Date(),
  ) {
    const monitorApplicatons = await this.find({
      where: [
        {
          monitorId,
          approved: ApplicationApproved.Allowed,
          dateWhen: LessThanOrEqual<Date>(new Date(date)),
          dateBefore: MoreThanOrEqual<Date>(new Date(date)),
        },
        {
          monitorId,
          approved: ApplicationApproved.Allowed,
          dateWhen: LessThanOrEqual<Date>(new Date(date)),
          dateBefore: IsNull(),
        },
      ],
      order: { updatedAt: 'DESC' },
    });

    const today = new Date(date);
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

          isExpect = date1 >= today;
        }

        if (playlistChange) {
          const date2 = new Date(dateWhen);
          date2.setSeconds(0, 0);

          if (today >= date2) {
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

      if (update.approved === ApplicationApproved.NotProcessed) {
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
      } else if (update.approved === ApplicationApproved.Allowed) {
        await this.wsGateway.application(application).catch((error: any) => {
          this.logger.error(error);
        });
      } else if (update.approved === ApplicationApproved.Denied) {
        await this.wsGateway
          .application(null, application.monitor)
          .catch((error: any) => {
            this.logger.error(error);
          });
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
    await this.wsGateway
      .application(null, application.monitor)
      .catch((error: any) => {
        this.logger.error(error);
      });

    const deleteResult = await this.applicationRepository.delete({
      id: application.id,
      userId,
    });

    return deleteResult;
  }

  async statistics(user: UserEntity): Promise<StatisticsMonitorsResponse> {
    const where: FindOptionsWhere<ApplicationEntity> = {};
    if (user.role !== UserRoleEnum.Advertiser) {
      where.sellerId = user.id;
    } else {
      where.buyerId = user.id;
    }

    const dateNow = new Date();
    const [online, offline, empty, emptyMonitor] = await Promise.all([
      this.applicationRepository.count({
        where: {
          ...where,
          monitor: { status: MonitorStatus.Online },
          approved: ApplicationApproved.Allowed,
          dateWhen: MoreThanOrEqual<Date>(dateNow),
          dateBefore: LessThanOrEqual<Date>(dateNow),
        },
      }),
      this.applicationRepository.count({
        where: {
          ...where,
          monitor: { status: MonitorStatus.Offline },
          dateWhen: MoreThanOrEqual<Date>(dateNow),
          dateBefore: LessThanOrEqual<Date>(dateNow),
        },
      }),
      this.monitorRepository.count({ where: { userId: user.id } }),
      this.applicationRepository.count({
        where: {
          ...where,
          approved: ApplicationApproved.Allowed,
          dateBefore: LessThanOrEqual<Date>(dateNow),
        },
        select: { monitorId: true },
        relations: [],
      }),
    ]);

    return {
      online,
      offline,
      empty: empty - emptyMonitor,
    };
  }
}
