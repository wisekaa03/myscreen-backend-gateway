import { compare, hash } from 'bcrypt';
import {
  BadGatewayException,
  BadRequestException,
  PreconditionFailedException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindConditions, DeleteResult, DeepPartial } from 'typeorm';

import { decodeMailToken, generateMailToken } from '@/shared/mail-token';
import { MailService } from '@/mail/mail.service';
import { genKey } from '@/shared/genKey';
import { UserEntity } from './user.entity';
import { UserRoleEnum } from './enums/role.enum';

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
          Object.assign(user, update, { emailConfirmKey }),
        ),
        this.mailService.sendVerificationCode(update.email, confirmUrl),
      ]).then(([saved]) => saved);
    }

    return this.userRepository.save(Object.assign(user, update));
  }

  async delete(user: UserEntity): Promise<DeleteResult> {
    return this.userRepository.delete(user.id);
  }

  async create(create: DeepPartial<UserEntity>): Promise<UserEntity> {
    const { email, password } = create;
    if (!email) {
      throw new BadRequestException();
    }
    if (!password) {
      throw new BadRequestException();
    }

    const existingUser = await this.userRepository.findOne({
      email,
    });

    if (existingUser) {
      throw new PreconditionFailedException('User exists', create.email);
    }

    const user: DeepPartial<UserEntity> = {
      email,
      password: await hash(password, 7),
      disabled: false,
      name: create.name,
      surname: create.surname,
      middleName: create.middleName,
      emailConfirmKey: genKey(),
      role: create.role ?? UserRoleEnum.Advertiser,
      verified: false,
      isDemoUser: false,
      countUsedSpace: 0,
    };
    const verifyToken = generateMailToken(email, user.emailConfirmKey ?? '-');
    const confirmUrl = `${this.frontendUrl}/verify-email?key=${verifyToken}`;

    const savedUser =
      process.env.NODE_END !== 'production'
        ? await Promise.all([this.userRepository.save(user)]).then(
            ([saved]) => saved,
          )
        : await Promise.all([
            this.userRepository.save(user),
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
      email: create.email,
      password: await hash(create.password ?? '', 7),
      disabled: false,
      name: create.name,
      surname: create.surname,
      middleName: create.middleName,
      emailConfirmKey: genKey(),
      role: create.role ?? UserRoleEnum.Advertiser,
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
    const user = await this.userRepository.findOne({ email });

    if (!user) {
      throw new BadGatewayException('User not exists', email);
    }
    user.forgotConfirmKey = genKey();
    this.userRepository.save(user);

    const verifyToken = generateMailToken(email, user.forgotConfirmKey);
    const forgotPasswordUrl = `${this.frontendUrl}/reset-password-verify?key=${verifyToken}`;

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
      throw new BadRequestException('User not exists', email);
    }

    if (forgotPassword === user.forgotConfirmKey) {
      user.password = await hash(password, 7);
      user.forgotConfirmKey = null;

      return this.userRepository.save(user);
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
    return this.userRepository
      .find({ where })
      .then((users) => users.map(({ password, ...data }) => data));
  }

  async findByEmail(
    email: string,
    disabled = false,
    includePassword = false,
  ): Promise<UserEntity | undefined> {
    if (includePassword) {
      return this.userRepository.findOne({
        email,
        disabled,
      });
    }

    return this.userRepository.findOne({
      email,
      disabled,
    });
  }

  async findById(
    id: string,
    disabled = false,
    includePassword = false,
  ): Promise<UserEntity | undefined> {
    if (includePassword) {
      return this.userRepository.findOne({
        id,
        disabled,
      });
    }

    return this.userRepository.findOne({
      id,
      disabled,
    });
  }

  async validateCredentials(
    user: UserEntity,
    password: string,
  ): Promise<boolean> {
    return compare(password, user.password ?? '');
  }
}
