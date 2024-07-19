import { createHmac } from 'crypto';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  type DeleteResult,
  type DeepPartial,
  FindManyOptions,
} from 'typeorm';
import dayjs from 'dayjs';
import { ClientProxy } from '@nestjs/microservices';
import { I18nContext, I18nService } from 'nestjs-i18n';

import {
  BadRequestError,
  ConflictData,
  ConflictError,
  ForbiddenError,
  PreconditionFailedError,
  UnauthorizedError,
} from '@/errors';
import {
  FindManyOptionsCaseInsensitive,
  FindOneOptionsCaseInsensitive,
  MailForgotPassword,
  MailSendVerificationCode,
  MailWelcomeMessage,
} from '@/interfaces';
import { MAIL_SERVICE } from '@/constants';
import { RegisterRequest } from '@/dto/request/register.request';
import { CRUD, UserPlanEnum, UserRoleEnum, UserStoreSpaceEnum } from '@/enums';
import { decodeMailToken, generateMailToken } from '@/utils/mail-token';
import { genKey } from '@/utils/genKey';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserEntity } from './user.entity';
import { UserResponse } from './user-response.entity';
import { FileEntity } from './file.entity';
import { FileService } from './file.service';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  public frontendUrl: string;

  constructor(
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
    @Inject(MAIL_SERVICE)
    private readonly mailService: ClientProxy,
    @InjectRepository(UserEntity)
    public readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserResponse)
    public readonly userResponseRepository: Repository<UserResponse>,
    @InjectRepository(FileEntity)
    public readonly fileRepository: Repository<FileEntity>,
  ) {
    this.frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost',
    );
  }

  /**
   * Verify user permissions.
   *
   * @param {UserResponse} user User
   * @param {string} controllerName Controller name (monitor, bid, etc.)
   * @param {string} functionName Function name (create, read, update, delete, status)
   * @param {CRUDS} crud CRUDS (CREATE, READ, UPDATE, DELETE, STATUS)
   * @returns {boolean} true - access allowed
   * @throws {ForbiddenError} ForbiddenError
   * @memberof UserService
   */
  async verify(
    user: UserResponse,
    controllerName: string,
    functionName: string,
    crud: CRUD,
  ): Promise<boolean> {
    const name = user.fullNameEmail;
    this.logger.log(
      `User: "${name}" Controllers: "${controllerName}" CRUD: "${crud}"`,
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
          controllerName === 'monitor' &&
          crud === CRUD.CREATE &&
          1 + Number(countMonitors) > 5
        ) {
          throw new ForbiddenError('demoTimeIsUp', {
            lang: I18nContext.current()?.lang,
          });
        }

        if (
          controllerName === 'monitor' &&
          crud !== CRUD.READ &&
          dayjs(createdAt)
            .add(14 + 1, 'days')
            .isBefore(dayjs())
        ) {
          throw new ForbiddenError('demoTimeIsUp', {
            lang: I18nContext.current()?.lang,
          });
        }

        if (
          controllerName === 'file' &&
          !(crud === CRUD.READ || crud === CRUD.DELETE) &&
          dayjs(createdAt)
            .add(28 + 1, 'days')
            .isBefore(dayjs())
        ) {
          throw new ForbiddenError('demoTimeIsUp', {
            lang: I18nContext.current()?.lang,
          });
        }

        if (countUsedSpace >= UserStoreSpaceEnum.DEMO) {
          throw new ForbiddenError('demoTimeIsUp', {
            lang: I18nContext.current()?.lang,
          });
        }
      } else if (plan === UserPlanEnum.Full) {
        if (
          controllerName === 'file' &&
          countUsedSpace >= UserStoreSpaceEnum.FULL &&
          crud === CRUD.CREATE
        ) {
          throw new ForbiddenError('LIMITED_STORE_SPACE', {
            lang: I18nContext.current()?.lang,
            args: { countUsedSpace, plan: UserStoreSpaceEnum.FULL },
          });
        }
      }
    } else if (role === UserRoleEnum.Advertiser) {
      if (controllerName === 'monitor' && crud !== CRUD.READ) {
        if (functionName.search(/monitorFavorite|MonitorPlaylist/) === -1) {
          throw new ForbiddenError('DENIED_ADVERTISER', {
            lang: I18nContext.current()?.lang,
          });
        }
      }

      if (
        controllerName === 'file' &&
        countUsedSpace >= UserStoreSpaceEnum.FULL &&
        crud === CRUD.CREATE
      ) {
        throw new ForbiddenError('LIMITED_STORE_SPACE', {
          lang: I18nContext.current()?.lang,
          args: { countUsedSpace, plan: UserStoreSpaceEnum.FULL },
        });
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
    user: UserEntity,
    update: Partial<UserEntity>,
  ): Promise<UserResponse | null> {
    const { id: userId } = user;
    if (update.email !== undefined && user.email !== update.email) {
      const emailConfirmKey = genKey();

      const verifyToken = generateMailToken(update.email, emailConfirmKey);
      const confirmUrl = `${this.frontendUrl}/verify-email?key=${verifyToken}`;
      const language = update.preferredLanguage ?? user.preferredLanguage;

      const [{ affected }] = await Promise.all([
        this.userRepository.update(userId, { ...update, emailConfirmKey }),
        this.mailService.emit('sendWelcomeMessage', {
          email: update.email,
          confirmUrl,
          language,
        }),
      ]);
      if (!affected) {
        throw new ForbiddenError();
      }

      const userUpdated = await this.userResponseRepository.findOneBy({
        id: userId,
      });
      return userUpdated;
    }

    const { affected } = await this.userRepository.update(userId, update);
    if (!affected) {
      throw new ForbiddenError();
    }

    const userUpdated = await this.userResponseRepository.findOneBy({
      id: user.id,
    });
    return userUpdated;
  }

  /**
   * Удаляет пользователя
   * @async
   * @param {UserEntity} user User
   * @returns {DeleteResult} {DeleteResult} Результат
   */
  async delete(user: UserEntity): Promise<DeleteResult> {
    const files = await this.fileRepository.find({
      where: { userId: user.id },
      select: ['id'],
      loadEagerRelations: false,
      relations: {},
    });
    if (files.length > 0) {
      const fileIds = files.map(({ id }) => id);
      await this.fileService.delete(fileIds);
    }
    return this.userRepository.delete({ id: user.id });
  }

  /**
   * Заводит нового пользователя
   * @async
   * @param {RegisterRequest} create
   * @returns {UserEntity} Пользователь
   */
  async register(create: RegisterRequest): Promise<UserResponse> {
    const { email, password, role, ...createUser } = create;
    if (!email) {
      throw new BadRequestError('USER_EMAIL', {
        lang: I18nContext.current()?.lang,
      });
    }
    if (!password) {
      throw new BadRequestError('USER_PASSWORD', {
        lang: I18nContext.current()?.lang,
      });
    }
    if (!role) {
      throw new BadRequestError('USER_ROLE', {
        lang: I18nContext.current()?.lang,
      });
    }

    // TODO: verify email domain

    const existingUser = await this.userRepository.findOne({
      where: {
        email,
      },
    });
    if (existingUser) {
      throw new PreconditionFailedError('USER_EXISTS', {
        args: { email: create.email },
        lang: I18nContext.current()?.lang,
      });
    }

    const plan =
      role === UserRoleEnum.MonitorOwner
        ? UserPlanEnum.Demo
        : UserPlanEnum.Full;

    let storageSpace: number;
    if (plan === UserPlanEnum.Demo) {
      storageSpace = UserStoreSpaceEnum.DEMO;
    } else {
      storageSpace = UserStoreSpaceEnum.FULL;
    }

    const userPartial: DeepPartial<UserEntity> = {
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
    const verifyToken = generateMailToken(
      email,
      userPartial.emailConfirmKey ?? '-',
    );
    const confirmUrl = `${this.frontendUrl}/verify-email?key=${verifyToken}`;
    const language =
      createUser.preferredLanguage ??
      this.configService.getOrThrow('LANGUAGE_DEFAULT');

    const [{ id }] = await Promise.all([
      this.userRepository.save(this.userRepository.create(userPartial)),
      this.mailService.emit<unknown, MailWelcomeMessage>('sendWelcomeMessage', {
        email,
        language,
      }),
      this.mailService.emit<unknown, MailSendVerificationCode>(
        'sendVerificationCode',
        {
          email,
          confirmUrl,
          language,
        },
      ),
    ]);

    const user = await this.userResponseRepository.findOneBy({ id });
    if (!user) {
      throw new UnauthorizedError('USER_NOT_EXISTS');
    }
    return user;
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
      select: ['id', 'forgotConfirmKey'],
    });
    if (!user) {
      throw new ForbiddenError('USER_NOT_EXISTS', { args: { email } });
    }

    user.forgotConfirmKey = genKey();
    await this.userRepository.update(user.id, {
      forgotConfirmKey: user.forgotConfirmKey,
    });

    const verifyToken = generateMailToken(email, user.forgotConfirmKey);
    const forgotPasswordUrl = `${this.frontendUrl}/reset-password-verify?key=${verifyToken}`;

    if (process.env.NODE_ENV !== 'production') {
      return true;
    }

    const language = user.preferredLanguage;
    return this.mailService.emit<unknown, MailForgotPassword>(
      'forgotPassword',
      {
        email,
        forgotPasswordUrl,
        language,
      },
    );
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
  ): Promise<UserResponse> {
    const [email, forgotPassword] = decodeMailToken(forgotPasswordToken);

    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new ForbiddenError('USER_NOT_EXISTS', { args: { email } });
    }

    if (forgotPassword === user.forgotConfirmKey) {
      await this.userRepository.update(user.id, {
        password: createHmac('sha256', password.normalize()).digest('hex'),
        forgotConfirmKey: null,
        emailConfirmKey: null,
      });
      const userUpdated = await this.userResponseRepository.findOne({
        where: { id: user.id },
      });
      if (!userUpdated) {
        throw new ForbiddenError('USER_NOT_EXISTS', { args: { email } });
      }
      return userUpdated;
    }

    throw new ForbiddenError('Forgot password not equal to our records', {
      args: { forgotPassword },
    });
  }

  async find(
    find: FindManyOptionsCaseInsensitive<UserResponse>,
  ): Promise<UserResponse[]> {
    const users = !find.caseInsensitive
      ? await this.userResponseRepository.find(
          TypeOrmFind.findParams(UserResponse, find),
        )
      : await TypeOrmFind.findCI(
          this.userResponseRepository,
          TypeOrmFind.findParams(UserResponse, find),
        );

    return users;
  }

  async findOne(
    find: FindOneOptionsCaseInsensitive<UserResponse | UserEntity>,
  ): Promise<UserResponse | UserEntity | null> {
    if (!find.fromView) {
      if (!find.caseInsensitive) {
        return this.userRepository.findOne(
          TypeOrmFind.findParams(UserEntity, find),
        );
      }

      return TypeOrmFind.findOneCI(
        this.userRepository,
        TypeOrmFind.findParams(UserEntity, find),
      );
    }

    if (!find.caseInsensitive) {
      return this.userResponseRepository.findOne(
        TypeOrmFind.findParams(UserResponse, find),
      );
    }

    return TypeOrmFind.findOneCI(
      this.userResponseRepository,
      TypeOrmFind.findParams(UserResponse, find),
    );
  }

  async findAndCount(
    find: FindManyOptionsCaseInsensitive<UserResponse>,
  ): Promise<[UserResponse[], number]> {
    const userCount = !find.caseInsensitive
      ? await this.userResponseRepository.findAndCount(
          TypeOrmFind.findParams(UserResponse, find),
        )
      : await TypeOrmFind.findAndCountCI(
          this.userResponseRepository,
          TypeOrmFind.findParams(UserResponse, find),
        );
    return userCount;
  }

  async findByEmail(
    email: string,
    find?: FindManyOptions<UserResponse>,
  ): Promise<UserResponse | null> {
    return this.userResponseRepository.findOne({
      ...find,
      where: { email },
    });
  }

  async findById(
    id: string,
    role?: UserRoleEnum,
    disabled = false,
  ): Promise<UserResponse | null> {
    if (role === UserRoleEnum.Monitor) {
      return this.userResponseRepository.create({
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
      });
    }

    const find: FindManyOptions<UserEntity> = disabled
      ? { where: { id } }
      : { where: { id, disabled } };

    return this.userResponseRepository.findOne(find);
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
}
