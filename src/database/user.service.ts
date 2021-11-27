import { compare, hash } from 'bcrypt';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Transaction, TransactionRepository } from 'typeorm';

import { decodeMailToken, generateMailToken } from '@/shared/mail-token';
import { MailService } from '@/mail/mail.service';
import {
  BadRequestError,
  PreconditionFailedError,
  RegisterRequest,
} from '@/dto';
import { genKey } from '@/shared/genKey';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  private frontendUrl: string;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = configService.get<string>(
      'FRONTEND_URL',
      'http://localhost',
    );
  }

  @Transaction()
  async update(
    user: Partial<UserEntity>,
    @TransactionRepository(UserEntity)
    userRepository: Repository<UserEntity> = null,
  ): Promise<UserEntity> {
    return userRepository.save(user);
  }

  @Transaction()
  async create(
    create: RegisterRequest,
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
    const verifyToken = generateMailToken(user.email, user.emailConfirmKey);
    const confirmUrl = `${this.frontendUrl}/verify-email?key=${verifyToken}`;

    await Promise.all([
      this.mailService.sendWelcomeMessage(user),
      this.mailService.sendVerificationCode(user, confirmUrl),
    ]);

    return savedUser;
  }

  async forgotPasswordInvitation(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ email });

    if (!user) {
      this.logger.warn(`User with email "${email}" not exists`);
      throw new BadRequestError();
    }
    user.forgotConfirmKey = genKey();
    this.userRepository.save(user);

    const verifyToken = generateMailToken(user.email, user.forgotConfirmKey);
    const forgotPasswordUrl = `${this.frontendUrl}/reset-password-verify?key=${verifyToken}`;

    this.mailService.forgotPassword(user, forgotPasswordUrl);
  }

  @Transaction()
  async forgotPasswordVerify(
    forgotPasswordToken: string,
    password: string,
    @TransactionRepository(UserEntity)
    userRepository: Repository<UserEntity> = null,
  ): Promise<void> {
    const [email, forgotPassword] = decodeMailToken(forgotPasswordToken);

    const user = await userRepository.findOne({ email });
    if (!user) {
      this.logger.warn(`User with email "${email}" not exists`);
      throw new BadRequestError();
    }

    if (forgotPassword === user.forgotConfirmKey) {
      user.password = await hash(password, 7);
      user.forgotConfirmKey = null;
      await userRepository.save(user);

      return;
    }

    this.logger.warn(
      `Forgot password '${forgotPassword}' not equal to our records`,
    );
    throw new BadRequestError();
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
