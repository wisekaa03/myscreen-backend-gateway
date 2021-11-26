import { compare, hash } from 'bcrypt';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Transaction, TransactionRepository } from 'typeorm';

import { MailGunService } from '@/mailgun/mailgun.service';
import { PreconditionFailedError } from '@/dto/errors/precondition.response';
import { RegisterRequestDto } from '@/dto/request/register.request';
import { generateMailToken } from '@/shared/mail-token';
import { genKey } from '@/shared/genKey';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly mailgunService: MailGunService,
  ) {}

  @Transaction()
  async create(
    create: RegisterRequestDto,
    @TransactionRepository(UserEntity)
    userRepository: Repository<UserEntity> = null,
  ): Promise<UserEntity> {
    const existingUser = await userRepository.findOne({
      email: create.email,
    });

    if (existingUser) {
      this.logger.warn(`User "${create.email}" exists`);
      throw new PreconditionFailedError();
    }

    const user: UserEntity = {
      email: create.email,
      password: await hash(create.password, 7),
      disabled: false,
      name: create.name,
      surname: create.surname,
      middleName: create.middleName,
      emailConfirmKey: genKey(),
      role: create.role,
      verified: false,
      isDemoUser: false,
      countUsedSpace: 0,
    };
    const savedUser = await userRepository.save(user);

    const verifyToken = generateMailToken(user, user.emailConfirmKey);
    await Promise.all([
      this.mailgunService.sendWelcomeMessage(user),
      this.mailgunService.sendVerificationCode(user, verifyToken),
    ]);

    return savedUser;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return this.userRepository.findOne({ email });
  }

  async findById(userId: string): Promise<UserEntity> {
    return this.userRepository.findOne(userId);
  }

  async validateCredentials(
    user: UserEntity,
    password: string,
  ): Promise<boolean> {
    return compare(password, user.password);
  }
}
