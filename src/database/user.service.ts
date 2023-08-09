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
import addDays from 'date-fns/addDays';

import { RegisterRequest, selectUserOptions } from '@/dto';
import {
  CRUDS,
  Controllers,
  UserPlanEnum,
  UserRoleEnum,
  UserStoreSpaceEnum,
} from '@/enums';
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
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => MailService))
    private readonly mailService: MailService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserExtEntity)
    private readonly userExtRepository: Repository<UserExtEntity>,
  ) {
    this.frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost',
    );
  }

  async verify(
    controllers: Controllers,
    ascrud: CRUDS,
    user: UserExtEntity,
  ): Promise<void> {
    const fullName = `${UserService.fullName(user)} <${user.email}>`;
    this.logger.debug(
      `User: "${fullName}" Controllers: "${controllers}" ASCRUD: "${ascrud}"`,
    );

    switch (user.role) {
      case UserRoleEnum.MonitorOwner: {
        switch (user.plan) {
          case UserPlanEnum.Demo: {
            if (controllers === Controllers.INVOICE) {
              break;
            }

            let demoDays = 28;
            if (controllers === Controllers.MONITOR) {
              demoDays = 14;
            }
            if (
              user.createdAt &&
              addDays(user.createdAt, demoDays) <= new Date()
            ) {
              throw new ForbiddenException(
                'You have a Demo User account. Time to pay.',
              );
            }

            if ((user.countMonitors ?? 0) > 5) {
              throw new ForbiddenException(
                'You have a Demo User account. Time to pay..',
              );
            }

            if ((user.countUsedSpace ?? 0) > UserStoreSpaceEnum.DEMO) {
              throw new ForbiddenException(
                'You have a Demo User account. Time to pay...',
              );
            }

            if (controllers === Controllers.APPLICATION) {
              throw new ForbiddenException(
                'You have a Demo User account. Time to pay...',
              );
            }

            break;
          }

          case UserPlanEnum.Full: {
            if (
              controllers === Controllers.FILE &&
              (user.countUsedSpace || 0) >= UserStoreSpaceEnum.FULL &&
              ascrud === CRUDS.CREATE
            ) {
              throw new ForbiddenException();
            }

            break;
          }

          default:
        }

        break;
      }

      case UserRoleEnum.Advertiser: {
        if (controllers === Controllers.MONITOR) {
          throw new ForbiddenException();
        }

        if (
          controllers === Controllers.FILE &&
          (user.countUsedSpace || 0) >= UserStoreSpaceEnum.FULL &&
          ascrud === CRUDS.CREATE
        ) {
          throw new ForbiddenException(
            `You have a limited User account to store space: ${user.countUsedSpace} / ${UserStoreSpaceEnum.FULL}`,
          );
        }

        break;
      }

      /**
        Сюда проваливаются все остальные роли:
          UserRoleEnum.Administrator
          UserRoleEnum.Accountant
          UserRoleEnum.Monitor
      */
      default:
    }
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
      throw new BadRequestException('email must be defined');
    }
    if (!password) {
      throw new BadRequestException('password must be defined');
    }
    if (!role) {
      throw new BadRequestException('role must be defined');
    }

    // TODO: verify email domain

    const existingUser = await this.userRepository.findOne({
      where: {
        email,
      },
    });
    if (existingUser) {
      throw new PreconditionFailedException(`User exists: ${create.email}`);
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

  static fullName(item: UserEntity): string {
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

  static validateCredentials = (
    user: UserEntity,
    password: string,
  ): boolean => {
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
