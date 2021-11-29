import { compare, hash } from 'bcrypt';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  PreconditionFailedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Transaction,
  TransactionRepository,
  FindConditions,
  DeleteResult,
} from 'typeorm';

import { decodeMailToken, generateMailToken } from '@/shared/mail-token';
import { MailService } from '@/mail/mail.service';
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
  async delete(
    user: UserEntity,
    @TransactionRepository(UserEntity)
    userRepository: Repository<UserEntity> = null,
  ): Promise<DeleteResult> {
    return userRepository.delete(user.id);
  }

  @Transaction()
  async create(
    create: Partial<UserEntity>,
    @TransactionRepository(UserEntity)
    userRepository: Repository<UserEntity> = null,
  ): Promise<UserEntity> {
    const existingUser = await userRepository.findOne({
      email: create.email,
    });

    if (existingUser) {
      throw new PreconditionFailedException('User exists', create.email);
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
      throw new BadGatewayException('User not exists', email);
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
      throw new BadRequestException('User not exists', email);
    }

    if (forgotPassword === user.forgotConfirmKey) {
      user.password = await hash(password, 7);
      user.forgotConfirmKey = null;
      await userRepository.save(user);

      return;
    }

    throw new BadRequestException(
      'Forgot password not equal to our records',
      forgotPassword,
    );
  }

  async findAll(includeDisabled: boolean): Promise<UserEntity[]> {
    const where: FindConditions<UserEntity> = {};
    if (includeDisabled) {
      where.disabled = false;
    }
    return this.userRepository.find({ where }).then((users) =>
      users.map((user) => {
        const { password, ...data } = user;
        return data;
      }),
    );
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return this.userRepository.findOne({
      email,
      disabled: false,
    });
  }

  async findById(id: string): Promise<UserEntity> {
    return this.userRepository.findOne({
      id,
      disabled: false,
    });
  }

  async validateCredentials(
    user: UserEntity,
    password: string,
  ): Promise<boolean> {
    return compare(password, user.password);
  }
}
