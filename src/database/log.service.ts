import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LogEntity } from './log.entity';

// TODO: сделать чтобы сюда скидывались c editor, mail, и ещё какие-нибудь логи
@Injectable()
export class LogService {
  private logger = new Logger(LogService.name);

  constructor(
    @InjectRepository(LogEntity)
    private readonly logEntity: Repository<LogEntity>
  ) {}
}
