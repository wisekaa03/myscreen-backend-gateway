import { createHmac } from 'crypto';
import { isString, length } from 'class-validator';
import {
  Injectable,
  Logger,
  PreconditionFailedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindConditions,
  type DeleteResult,
  type DeepPartial,
} from 'typeorm';

import { decodeMailToken, generateMailToken } from '@/shared/mail-token';
import { UserRoleEnum } from '@/enums';
import { MailService } from '@/mail/mail.service';
import { genKey } from '@/shared/genKey';
import { UserEntity } from './user.entity';
import { UserSizeEntity } from './user.view.entity';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  private frontendUrl: string;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserSizeEntity)
    private readonly userSizeRepository: Repository<UserSizeEntity>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = configService.get<string>(
      'FRONTEND_URL',
      'http://localhost',
    );
  }

  /**
   * Изменяет пользователя
   * @async
   * @param {UserEntity} user Пользователь
   * @param {Partial<UserEntity>} update Изменения
   * @returns {UserEntity} Результат
   */
  async update(
    userId: string,
    update: Partial<UserEntity>,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      throw new ForbiddenException();
    }

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

  /**
   * Удаляет пользователя
   * @async
   * @param {UserEntity} create
   * @returns {DeleteResult} Результат
   */
  async delete(user: UserEntity): Promise<DeleteResult> {
    return this.userRepository.delete(user.id);
  }

  /**
   * Заводит нового пользователя
   * @async
   * @param {Partial<UserEntity>} create
   * @returns {UserEntity} Пользователь
   */
  async create(create: Partial<UserEntity>): Promise<UserEntity> {
    const { email, password, role } = create;
    if (!email) {
      throw new BadRequestException();
    }
    if (!password) {
      throw new BadRequestException();
    }
    if (!role) {
      throw new BadRequestException();
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
    };
    const verifyToken = generateMailToken(email, user.emailConfirmKey ?? '-');
    const confirmUrl = `${this.frontendUrl}/verify-email?key=${verifyToken}`;

    if (process.env.NODE_ENV !== 'production') {
      return this.userRepository.save(this.userRepository.create(user));
    }

    const [saved] = await Promise.all([
      this.userRepository.save(this.userRepository.create(user)),
      this.mailService.sendWelcomeMessage(email).catch((error) => {
        this.logger.error(error);
      }),
      this.mailService
        .sendVerificationCode(email, confirmUrl)
        .catch((error) => {
          this.logger.error(error);
        }),
    ]);

    return saved;
  }

  /**
   * createTest
   * Используется в /test/app.e2e-spec.ts
   * @async
   * @param {Partial<UserEntity>} create
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
    };

    return this.userRepository.save(this.userRepository.create(user));
  }

  /**
   * Выдает на почту пользователю ссылку на смену пароля
   * @async
   * @param {string} email
   * @returns {any} Результат
   */
  async forgotPasswordInvitation(email: string): Promise<any> {
    const user = await this.userRepository.findOne({ email, disabled: false });
    if (!user) {
      throw new ForbiddenException('User not exists', email);
    }

    user.forgotConfirmKey = genKey();
    this.userRepository.save(this.userRepository.create(user));

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
      throw new ForbiddenException('User not exists', email);
    }

    if (forgotPassword === user.forgotConfirmKey) {
      user.password = createHmac('sha256', password.normalize()).digest('hex');
      user.forgotConfirmKey = null;

      return this.userRepository.save(this.userRepository.create(user));
    }

    throw new ForbiddenException(
      'Forgot password not equal to our records',
      forgotPassword,
    );
  }

  async findAll(includeDisabled = true): Promise<UserEntity[]> {
    const where: FindConditions<UserEntity> = {};
    if (includeDisabled) {
      where.disabled = false;
    }
    return this.userSizeRepository.find({ where });
  }

  async findByEmail(
    email: string,
    disabled = false,
  ): Promise<(UserEntity & Partial<UserSizeEntity>) | undefined> {
    return this.userSizeRepository.findOne({
      email,
      disabled,
    });
  }

  async findById(
    id: string,
    role?: UserRoleEnum[],
    disabled = false,
  ): Promise<(UserEntity & Partial<UserSizeEntity>) | undefined> {
    if (role?.includes(UserRoleEnum.Monitor)) {
      return {
        id,
        role: UserRoleEnum.Monitor,
        email: '',
        disabled: false,
        verified: true,
        isDemoUser: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return this.userSizeRepository.findOne({
      id,
      disabled,
    });
  }

  validateCredentials = (user: UserEntity, password: string): boolean =>
    createHmac('sha256', password.normalize()).digest('hex') === user.password;
}
