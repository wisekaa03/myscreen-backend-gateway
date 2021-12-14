import { createHmac } from 'crypto';
import {
  BadGatewayException,
  PreconditionFailedException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindConditions, DeleteResult, DeepPartial } from 'typeorm';

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

  async update(
    user: UserEntity,
    update: Partial<UserEntity>,
  ): Promise<UserEntity> {
    if (typeof update.email !== 'undefined' && user.email !== update.email) {
      const emailConfirmKey = genKey();

      const verifyToken = generateMailToken(update.email, emailConfirmKey);
      const confirmUrl = `${this.frontendUrl}/verify-email?key=${verifyToken}`;

      return Promise.all([
        this.userRepository.save(
          this.userRepository.create(
            Object.assign(user, update, { emailConfirmKey }),
          ),
        ),
        this.mailService.sendVerificationCode(update.email, confirmUrl),
      ]).then(([saved]) => saved);
    }

    return this.userRepository.save(
      this.userRepository.create(Object.assign(user, update)),
    );
  }

  async delete(user: UserEntity): Promise<DeleteResult> {
    return this.userRepository.delete(user.id);
  }

  async create(create: Partial<UserEntity>): Promise<UserEntity> {
    const { email, password, role } = create;
    if (!email) {
      throw new UnauthorizedException();
    }
    if (!password) {
      throw new UnauthorizedException();
    }
    if (!role) {
      throw new UnauthorizedException();
    }

    const existingUser = await this.userRepository.findOne({
      email,
    });
    if (existingUser) {
      throw new PreconditionFailedException('User exists', create.email);
    }

    const user: DeepPartial<UserEntity> = {
      ...create,
      disabled: false,
      password: createHmac('sha256', password.normalize()).digest('hex'),
      emailConfirmKey: genKey(),
      verified: false,
      isDemoUser: false,
      countUsedSpace: 0,
    };
    const verifyToken = generateMailToken(email, user.emailConfirmKey ?? '-');
    const confirmUrl = `${this.frontendUrl}/verify-email?key=${verifyToken}`;

    if (process.env.NODE_END !== 'production') {
      return this.userRepository.save(this.userRepository.create(user));
    }

    const savedUser = await Promise.all([
      this.userRepository.save(this.userRepository.create(user)),
      this.mailService.sendWelcomeMessage(email),
      this.mailService.sendVerificationCode(email, confirmUrl),
    ]).then(([saved]) => saved);

    return savedUser;
  }

  /**
   * createTest
   * Используется в /test/app.e2e-spec.ts
   *
   * @param create
   * @param userRepository
   * @returns {UserEntity} Пользователь
   */
  async createTest(create: Partial<UserEntity>): Promise<UserEntity> {
    const user: DeepPartial<UserEntity> = {
      ...create,
      disabled: false,
      password: createHmac('sha256', create.password?.normalize() ?? '').digest(
        'hex',
      ),

      emailConfirmKey: genKey(),
      verified: false,
      isDemoUser: false,
      countUsedSpace: 0,
    };

    return this.userRepository.save(this.userRepository.create(user));
  }

  /**
   * Выдает ссылку на email пользователя
   * @async
   * @param {string} email
   * @returns {any} Результат
   */
  async forgotPasswordInvitation(email: string): Promise<any> {
    const user = await this.userRepository.findOne({ email, disabled: false });

    if (!user) {
      throw new BadGatewayException('User not exists', email);
    }
    user.forgotConfirmKey = genKey();
    this.userRepository.save(user);

    const verifyToken = generateMailToken(email, user.forgotConfirmKey);
    const forgotPasswordUrl = `${this.frontendUrl}/reset-password-verify?key=${verifyToken}`;

    if (process.env.NODE_ENV !== 'production') {
      return Promise.resolve();
    }

    return this.mailService.forgotPassword(email, forgotPasswordUrl);
  }

  /**
   * Меняет пароль пользователя
   * @async
   * @param {string} forgotPasswordToken
   * @param {string} password
   * @returns {SuccessResponse} Результат
   */
  async forgotPasswordVerify(
    forgotPasswordToken: string,
    password: string,
  ): Promise<UserEntity> {
    const [email, forgotPassword] = decodeMailToken(forgotPasswordToken);

    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User not exists', email);
    }

    if (forgotPassword === user.forgotConfirmKey) {
      user.password = password;
      user.forgotConfirmKey = null;

      return this.userRepository.save(this.userRepository.create(user));
    }

    throw new UnauthorizedException(
      'Forgot password not equal to our records',
      forgotPassword,
    );
  }

  async findAll(includeDisabled = true): Promise<UserEntity[]> {
    const where: FindConditions<UserEntity> = {};
    if (includeDisabled) {
      where.disabled = false;
    }
    return this.userRepository.find({ where });
  }

  async findByEmail(
    email: string,
    disabled = false,
  ): Promise<UserEntity | undefined> {
    return this.userRepository.findOne({
      email,
      disabled,
    });
  }

  async findById(
    id: string,
    disabled = false,
  ): Promise<UserEntity | undefined> {
    return this.userRepository.findOne({
      id,
      disabled,
    });
  }

  validateCredentials = (user: UserEntity, password: string): boolean =>
    createHmac('sha256', password.normalize()).digest('hex') === user.password;
}
