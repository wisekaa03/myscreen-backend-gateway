import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DeleteResult, FindManyOptions, Repository } from 'typeorm';

import { WSGateway } from '../websocket/ws.gateway';
import { TypeOrmFind } from '../shared/typeorm.find';
import { ApplicationApproved } from '../enums/index';
import { MailService } from '../mail/mail.service';
import { UserService } from './user.service';
import { ApplicationEntity } from './application.entity';

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
    await this.applicationRepository.manager.transaction(
      async (applicationRepository) => {
        let application: ApplicationEntity | null =
          await applicationRepository.save<ApplicationEntity>(
            applicationRepository.create<ApplicationEntity>(
              ApplicationEntity,
              update,
            ),
          );
        application = await applicationRepository.findOne(ApplicationEntity, {
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
      },
    );

    return id === undefined
      ? null
      : this.applicationRepository.findOne({
          where: { id },
        });
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
}
