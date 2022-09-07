import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DeleteResult, FindManyOptions, Repository } from 'typeorm';

import { WSGateway } from '@/websocket/ws.gateway';
import { TypeOrmFind } from '@/shared/typeorm.find';
import { ApplicationApproved } from '@/enums';
import { MailService } from '@/mail/mail.service';
import { ApplicationEntity } from './application.entity';

@Injectable()
export class ApplicationService {
  private logger = new Logger(ApplicationService.name);

  private frontendUrl: string;

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
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

  async update(
    id: string | undefined,
    update: Partial<ApplicationEntity>,
  ): Promise<ApplicationEntity | null> {
    await this.applicationRepository.manager.transaction(
      async (applicationRepository) => {
        const application = await applicationRepository.save(
          this.applicationRepository.create(update),
        );

        if (update.approved === ApplicationApproved.NotProcessed) {
          /* await */ this.mailService
            .sendApplicationWarningMessage(
              application.seller?.email,
              `${this.frontendUrl}/applications`,
            )
            .catch((error: any) => {
              this.logger.error(
                `ApplicationService seller=${application.seller}, buyer=${application.buyer}: ${error}`,
                error,
              );
            });
        }

        if (update.approved === ApplicationApproved.Allowed) {
          /* await */ this.wsGateway
            .monitorPlaylist(application.monitor, application.playlist)
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
    cooperation: ApplicationEntity,
  ): Promise<DeleteResult> {
    return this.applicationRepository.delete({
      id: cooperation.id,
      userId,
    });
  }
}
