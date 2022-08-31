import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DeleteResult, FindManyOptions, Repository } from 'typeorm';

import { WSGateway } from '@/websocket/ws.gateway';
import { TypeOrmFind } from '@/shared/typeorm.find';
import { CooperationApproved } from '@/enums';
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
    private readonly cooperationRepository: Repository<ApplicationEntity>,
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
      ? TypeOrmFind.findCI(this.cooperationRepository, conditional)
      : this.cooperationRepository.find(conditional);
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
      ? TypeOrmFind.findAndCountCI(this.cooperationRepository, conditional)
      : this.cooperationRepository.findAndCount(conditional);
  }

  async findOne(
    find: FindManyOptions<ApplicationEntity>,
  ): Promise<ApplicationEntity | null> {
    return find.relations
      ? this.cooperationRepository.findOne(TypeOrmFind.Nullable(find))
      : this.cooperationRepository.findOne({
          relations: ['buyer', 'seller', 'monitor', 'playlist'],
          ...TypeOrmFind.Nullable(find),
        });
  }

  async update(
    id: string | undefined,
    update: Partial<ApplicationEntity>,
  ): Promise<ApplicationEntity | null> {
    await this.cooperationRepository.manager.transaction(
      async (cooperationRepository) => {
        const cooperation = await cooperationRepository.save(
          this.cooperationRepository.create(update),
        );

        if (update.approved === CooperationApproved.NotProcessed) {
          /* await */ this.mailService
            .sendApplicationWarningMessage(
              cooperation.seller.email,
              `${this.frontendUrl}/applications`,
            )
            .catch((error) => {
              this.logger.error(error);
            });
        }

        if (update.approved === CooperationApproved.Allowed) {
          /* await */ this.wsGateway
            .monitorPlaylist(cooperation.monitor, cooperation.playlist)
            .catch((error) => {
              this.logger.error(error);
            });
        }
      },
    );

    return id === undefined
      ? null
      : this.cooperationRepository.findOne({
          where: { id },
        });
  }

  async delete(
    userId: string,
    cooperation: ApplicationEntity,
  ): Promise<DeleteResult> {
    return this.cooperationRepository.delete({
      id: cooperation.id,
      userId,
    });
  }
}
