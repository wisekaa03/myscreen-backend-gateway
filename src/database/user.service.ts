import { createHmac } from 'crypto';
import {
  Injectable,
  Logger,
  PreconditionFailedException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
  UnauthorizedException,
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
import subDays from 'date-fns/subDays';
import intervalToDuration from 'date-fns/intervalToDuration';

import { RegisterRequest } from '@/dto/request/register.request';
import { CRUD, UserPlanEnum, UserRoleEnum, UserStoreSpaceEnum } from '@/enums';
import { decodeMailToken, generateMailToken } from '@/utils/mail-token';
import { genKey } from '@/utils/genKey';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { MailService } from '@/mail/mail.service';
import { UserEntity } from './user.entity';
import { UserExtEntity, selectUserOptions } from './user-ext.entity';

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

  /**
   * Return full name of user.
   * @param {UserEntity} u user - UserEntity
   * @param {boolean} e email (default: true) - add email
   * @returns string
   * @memberof UserService
   */
  static fullName = (u: UserEntity, e = true) =>
    [u.surname, u.name, u.middleName].join(' ') + (e ? ` <${u.email}>` : '');

  /**
   * Verify user permissions.
   *
   * @param {string} controllers Controller name (monitor, application, etc.)
   * @param {CRUDS} crud CRUDS (CREATE, READ, UPDATE, DELETE, STATUS)
   * @param {UserExtEntity} user User
   * @returns {boolean} true - access allowed
   * @throws {ForbiddenException} ForbiddenException
   * @memberof UserService
   */
  verify(
    user: UserExtEntity,
    controllerName: string,
    functionName: string,
    crud: CRUD,
  ): boolean {
    const fullName = UserService.fullName(user);
    this.logger.log(
      `User: "${fullName}" Controllers: "${controllerName}" CRUD: "${crud}"`,
    );
    const {
      role = UserRoleEnum.Administrator,
      plan = UserPlanEnum.Full,
      metrics: {
        monitors: { user: countMonitors = 0 },
        storageSpace: { storage: countUsedSpace = 0 },
      },
      createdAt = new Date(),
    } = user;

    if (role === UserRoleEnum.MonitorOwner) {
      if (plan === UserPlanEnum.Demo) {
        if (controllerName === 'auth' || controllerName === 'invoice') {
          return true;
        }

        if (
          (countMonitors ?? 0) > 5 ||
          (controllerName === 'monitor' &&
            crud === CRUD.CREATE &&
            1 + countMonitors > 5)
        ) {
          throw new ForbiddenException(
            'You have a Demo User account. Time to pay.',
          );
        }

        if (
          controllerName === 'monitor' &&
          crud !== CRUD.READ &&
          addDays(createdAt, 14 + 1) < new Date()
        ) {
          throw new ForbiddenException(
            'You have a Demo User account. Time to pay.',
          );
        }

        if (
          controllerName === 'file' &&
          crud !== CRUD.READ &&
          addDays(createdAt, 28 + 1) < new Date()
        ) {
          throw new ForbiddenException(
            'You have a Demo User account. Time to pay.',
          );
        }

        if (countUsedSpace > UserStoreSpaceEnum.DEMO) {
          throw new ForbiddenException(
            'You have a Demo User account. Time to pay.',
          );
        }

        if (controllerName === 'application' || controllerName === 'request') {
          throw new ForbiddenException(
            'You have a Demo User account. Time to pay.',
          );
        }
      } else if (plan === UserPlanEnum.Full) {
        if (
          controllerName === 'file' &&
          countUsedSpace >= UserStoreSpaceEnum.FULL &&
          crud === CRUD.CREATE
        ) {
          throw new ForbiddenException(
            `You have a limited User account to store space: ${countUsedSpace} / ${UserStoreSpaceEnum.FULL}`,
          );
        }
      }
    } else if (role === UserRoleEnum.Advertiser) {
      if (controllerName === 'monitor' && crud !== CRUD.READ) {
        if (functionName.search(/^monitorFavorite/) === -1) {
          throw new ForbiddenException(
            'You have a Advertiser account, denied.',
          );
        }
      }

      if (
        controllerName === 'file' &&
        countUsedSpace >= UserStoreSpaceEnum.FULL &&
        crud === CRUD.CREATE
      ) {
        throw new ForbiddenException(
          `You have a limited User account to store space: ${countUsedSpace} / ${UserStoreSpaceEnum.FULL}`,
        );
      }
    }

    /**
      Не трогаем все остальные роли:
        UserRoleEnum.Administrator
        UserRoleEnum.Accountant
        UserRoleEnum.Monitor
    */

    return true;
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
    const user = await this.userRepository.findOneBy({ id: userId });
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
      ]).then(([{ id }]) => this.userExtRepository.findOneBy({ id }));
    }

    const { id } = await this.userRepository.save(
      this.userRepository.create(Object.assign(user, update)),
    );

    return this.userExtRepository.findOneBy({ id });
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
  async register(create: RegisterRequest): Promise<UserExtEntity> {
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

    let id: string;
    if (process.env.NODE_ENV === 'production') {
      [{ id }] = await Promise.all([
        this.userRepository.save(this.userRepository.create(user)),
        this.mailService.sendWelcomeMessage(email),
        this.mailService.sendVerificationCode(email, confirmUrl),
      ]);
    } else {
      ({ id } = await this.userRepository.save(
        this.userRepository.create(user),
      ));
    }

    const userExt = await this.userExtRepository.findOneBy({ id });
    if (!userExt) {
      throw new UnauthorizedException('User not exits ?');
    }

    return UserService.userEntityToUser(userExt);
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
    options: FindManyOptions<UserExtEntity>,
    caseInsensitive = true,
  ): Promise<[UserExtEntity[], number]> {
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(
          this.userExtRepository,
          TypeOrmFind.Nullable(options),
        )
      : this.userExtRepository.findAndCount(TypeOrmFind.Nullable(options));
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
    role?: UserRoleEnum,
    disabled = false,
  ): Promise<UserExtEntity | null> {
    if (role === UserRoleEnum.Monitor) {
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
        planValidityPeriod: Number.NEGATIVE_INFINITY,
        wallet: {
          total: 0,
        },
        metrics: {
          monitors: {
            online: 0,
            offline: 0,
            empty: 0,
            user: 0,
          },
          storageSpace: {
            storage: 0,
            total: 0,
          },
          playlists: {
            added: 0,
            played: 0,
          },
        },
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
    return passwordSha256 === user.password;
  };

  static userEntityToUser({
    forgotConfirmKey,
    emailConfirmKey,
    password,
    monitors,
    monthlyPayment,
    walletSum,
    storageSpace,
    countUsedSpace,
    countMonitors,
    playlistAdded,
    playlistMonitorPlayed,
    onlineMonitors,
    offlineMonitors,
    emptyMonitors,
    wallet,
    ...data
  }: UserExtEntity): UserExtEntity {
    return {
      ...data,
      metrics: {
        monitors: {
          online: parseInt(`${onlineMonitors ?? 0}`, 10),
          offline: parseInt(`${offlineMonitors ?? 0}`, 10),
          empty: parseInt(`${emptyMonitors ?? 0}`, 10),
          user: parseInt(`${countMonitors ?? 0}`, 10),
        },
        playlists: {
          added: parseInt(`${playlistAdded ?? 0}`, 10),
          played: parseInt(`${playlistMonitorPlayed ?? 0}`, 10),
        },
        storageSpace: {
          storage: parseFloat(`${countUsedSpace ?? 0}`),
          total: parseFloat(`${storageSpace ?? 0}`),
        },
      },
      planValidityPeriod: monthlyPayment
        ? intervalToDuration({
            start: monthlyPayment,
            end: subDays(Date.now(), 28),
          }).days ?? Number.NEGATIVE_INFINITY
        : Number.POSITIVE_INFINITY,
      wallet: {
        total: wallet ? wallet.total : parseFloat(walletSum ?? '0'),
      },
    };
  }
}
