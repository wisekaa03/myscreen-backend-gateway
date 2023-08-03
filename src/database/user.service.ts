import { createHmac } from 'crypto';
import {
  Injectable,
  Logger,
  PreconditionFailedException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  type DeleteResult,
  type DeepPartial,
  FindManyOptions,
} from 'typeorm';

import { RegisterRequest, selectUserOptions } from '@/dto';
import { UserPlanEnum, UserRoleEnum, UserStoreSpaceEnum } from '@/enums';
import { decodeMailToken, generateMailToken } from '@/utils/mail-token';
import { genKey } from '@/utils/genKey';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { MailService } from '@/mail/mail.service';
import { UserEntity } from './user.entity';
import { UserExtEntity } from './user-ext.entity';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  private frontendUrl: string;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserExtEntity)
    private readonly userExtRepository: Repository<UserExtEntity>,
    @Inject(forwardRef(() => MailService))
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
   * @param {string} userId User ID
   * @param {Partial<UserEntity>} {Partial<UserEntity>} update Изменения
   * @returns {UserEntity} Результат
   */
  async update(
    userId: string,
    update: Partial<UserEntity>,
  ): Promise<UserExtEntity | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException();
    }

    if (update.email !== undefined && user.email !== update.email) {
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

    const userSaved = await this.userRepository.save(
      this.userRepository.create(Object.assign(user, update)),
    );

    return this.userExtRepository.findOne({ where: { id: userSaved.id } });
  }

  /**
   * Удаляет пользователя
   * @async
   * @param {UserEntity} user User entity
   * @returns {DeleteResult} {DeleteResult} Результат
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
  async register(create: RegisterRequest): Promise<UserExtEntity | null> {
    const { email, password, role, ...createUser } = create;
    if (!email) {
      throw new BadRequestException();
    }
    if (!password) {
      throw new BadRequestException();
    }
    if (!role) {
      throw new BadRequestException();
    }

    // TODO: verify email domain

    const existingUser = await this.userRepository.findOne({
      where: {
        email,
      },
    });
    if (existingUser) {
      throw new PreconditionFailedException('User exists', create.email);
    }

    const plan =
      role === UserRoleEnum.MonitorOwner
        ? UserPlanEnum.Demo
        : UserPlanEnum.Full;

    let { storageSpace } = createUser;
    if (plan === UserPlanEnum.Demo) {
      storageSpace = UserStoreSpaceEnum.DEMO;
    } else if (storageSpace === undefined) {
      storageSpace = UserStoreSpaceEnum.FULL;
    }

    const user: DeepPartial<UserEntity> = {
      ...createUser,
      email,
      storageSpace,
      role,
      plan,
      password: createHmac('sha256', password.normalize()).digest('hex'),
      disabled: false,
      verified: false,
      emailConfirmKey: genKey(),
    };
    const verifyToken = generateMailToken(email, user.emailConfirmKey ?? '-');
    const confirmUrl = `${this.frontendUrl}/verify-email?key=${verifyToken}`;

    if (process.env.NODE_ENV !== 'production') {
      const { id } = await this.userRepository.save(
        this.userRepository.create(user),
      );
      return this.userExtRepository.findOne({ where: { id } });
    }

    const [{ id }] = await Promise.all([
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

    return this.userExtRepository.findOneBy({ id });
  }

  fullName(item: UserEntity): string {
    return [item.surname, item.name, item.middleName].join(' ');
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
      plan: UserPlanEnum.VIP,
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
    const user = await this.userRepository.findOne({
      where: { email, disabled: false },
    });
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
   * @returns {UserEntity} {UserEntity} Результат
   */
  async forgotPasswordVerify(
    forgotPasswordToken: string,
    password: string,
  ): Promise<UserEntity> {
    const [email, forgotPassword] = decodeMailToken(forgotPasswordToken);

    const user = await this.userRepository.findOne({
      where: { email },
      select: { ...selectUserOptions, forgotConfirmKey: true },
    });
    if (!user) {
      throw new ForbiddenException('User not exists', email);
    }

    if (forgotPassword === user.forgotConfirmKey) {
      await this.userRepository.update(user.id, {
        password: createHmac('sha256', password.normalize()).digest('hex'),
        forgotConfirmKey: null,
      });
      const userUpdated = await this.userRepository.findOne({
        where: { id: user.id },
      });
      if (!userUpdated) {
        throw new ForbiddenException('User not exists', email);
      }
      // this.logger.debug(
      //   JSON.stringify({
      //     userId: userUpdated.id,
      //     userPassword: userUpdated.password,
      //     passwordSha256,
      //     password,
      //   }),
      // );
      return userUpdated;
    }

    throw new ForbiddenException(
      'Forgot password not equal to our records',
      forgotPassword,
    );
  }

  async find(
    find: FindManyOptions<UserEntity>,
    caseInsensitive = true,
  ): Promise<UserEntity[]> {
    return caseInsensitive
      ? TypeOrmFind.findCI(this.userRepository, TypeOrmFind.Nullable(find))
      : this.userRepository.find(TypeOrmFind.Nullable(find));
  }

  async findAndCount(
    options: FindManyOptions<UserEntity>,
    caseInsensitive = true,
  ): Promise<[UserEntity[], number]> {
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(
          this.userRepository,
          TypeOrmFind.Nullable(options),
        )
      : this.userRepository.findAndCount(TypeOrmFind.Nullable(options));
  }

  async findByEmail(
    email: string,
    options?: FindManyOptions<UserEntity>,
  ): Promise<UserExtEntity | null> {
    return this.userExtRepository.findOne({
      ...options,
      where: { email },
    });
  }

  async findById(
    id: string,
    role?: UserRoleEnum[],
    disabled = false,
  ): Promise<UserExtEntity | null> {
    if (role?.includes(UserRoleEnum.Monitor)) {
      return {
        id,
        role: UserRoleEnum.Monitor,
        plan: UserPlanEnum.Full,
        name: null,
        surname: null,
        middleName: null,
        email: '',
        disabled: false,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const conditions: FindManyOptions<UserEntity> = disabled
      ? { where: { id } }
      : { where: { id, disabled } };
    return this.userExtRepository.findOne(conditions);
  }

  validateCredentials = (user: UserEntity, password: string): boolean => {
    const passwordSha256 = createHmac('sha256', password.normalize()).digest(
      'hex',
    );
    // this.logger.debug(
    //   JSON.stringify({
    //     id: user.id,
    //     email: user.email,
    //     userPassword: user.password,
    //     passwordSha256,
    //     password,
    //   }),
    // );
    return passwordSha256 === user.password;
  };
}
