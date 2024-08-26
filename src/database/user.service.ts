import { createHmac } from 'crypto';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type DeleteResult, type DeepPartial } from 'typeorm';
import dayjs from 'dayjs';
import { ClientProxy } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
} from '@/errors';
import {
  FindManyOptionsExt,
  FindOneOptionsExt,
  MsvcMailForgotPassword,
  MsvcMailVerificationCode,
  MsvcMailWelcomeMessage,
} from '@/interfaces';
import {
  CRUD,
  MICROSERVICE_MYSCREEN,
  MsvcMailService,
  UserPlanEnum,
  UserRoleEnum,
  UserStoreSpaceEnum,
} from '@/enums';
import { decodeMailToken, generateMailToken } from '@/utils/mail-token';
import { genKey } from '@/utils/genKey';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { RegisterRequest } from '@/dto/request/register.request';
import { UserEntity } from './user.entity';
import { UserExtView } from './user-ext.view';
import { FileEntity } from './file.entity';
import { FileService } from './file.service';
import { I18nPath } from '@/i18n';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  public frontendUrl: string;

  private languageDefault: string;

  constructor(
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
    @Inject(MICROSERVICE_MYSCREEN.MAIL)
    private readonly mailMsvc: ClientProxy,
    @InjectRepository(UserEntity)
    public readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserExtView)
    public readonly userExtRepository: Repository<UserExtView>,
    @InjectRepository(FileEntity)
    public readonly fileRepository: Repository<FileEntity>,
  ) {
    this.frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost',
    );
    this.languageDefault = this.configService.getOrThrow('LANGUAGE_DEFAULT');
  }

  async find({
    caseInsensitive = true,
    transact: _transact,
    ...find
  }: FindManyOptionsExt<UserEntity>): Promise<UserExtView[]> {
    const transact = _transact
      ? _transact.withRepository(this.userExtRepository)
      : this.userExtRepository;

    const users = !caseInsensitive
      ? await transact.find(
          TypeOrmFind.findParams<UserExtView>(UserEntity, find),
        )
      : await TypeOrmFind.findCI(
          transact,
          TypeOrmFind.findParams<UserExtView>(UserEntity, find),
        );

    return users;
  }

  async findOne({
    fromView = true,
    caseInsensitive = true,
    transact: _transact,
    ...find
  }: FindOneOptionsExt<UserEntity>): Promise<UserExtView | null> {
    const transact = _transact
      ? _transact.withRepository(this.userExtRepository)
      : this.userExtRepository;

    if (!fromView) {
      if (!caseInsensitive) {
        return transact.findOne(
          TypeOrmFind.findParams<UserExtView>(UserEntity, find),
        );
      }

      return TypeOrmFind.findOneCI(
        transact,
        TypeOrmFind.findParams<UserExtView>(UserEntity, find),
      );
    }

    if (!caseInsensitive) {
      return transact.findOne(
        TypeOrmFind.findParams<UserExtView>(UserEntity, find),
      );
    }

    return TypeOrmFind.findOneCI(
      transact,
      TypeOrmFind.findParams<UserExtView>(UserEntity, find),
    );
  }

  async findAndCount({
    caseInsensitive = true,
    transact: _transact,
    ...find
  }: FindManyOptionsExt<UserEntity>): Promise<[UserExtView[], number]> {
    const transact = _transact
      ? _transact.withRepository(this.userExtRepository)
      : this.userExtRepository;

    const userCount = !caseInsensitive
      ? await transact.findAndCount(
          TypeOrmFind.findParams<UserExtView>(UserEntity, find),
        )
      : await TypeOrmFind.findAndCountCI(
          transact,
          TypeOrmFind.findParams<UserExtView>(UserEntity, find),
        );

    return userCount;
  }

  async findByEmail(
    email: string,
    find?: FindManyOptionsExt<UserEntity>,
  ): Promise<UserExtView | null> {
    return this.userExtRepository.findOne({
      ...find,
      where: { email },
    });
  }

  async findById(
    id: string,
    find?: FindOneOptionsExt<UserEntity>,
  ): Promise<UserExtView | null> {
    let disabled = undefined;
    if (
      !find ||
      (Array.isArray(find.where) &&
        find.where.some((w) => w.disabled === undefined)) ||
      (!Array.isArray(find.where) && find.where?.disabled === undefined)
    ) {
      disabled = false;
    }
    if (find?.role === UserRoleEnum.Monitor) {
      return this.userExtRepository.create({
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

    return this.userExtRepository.findOne({
      where: { id, disabled },
      ...find,
    });
  }

  /**
   * Verify user permissions.
   *
   * @param {UserExtView} user User
   * @param {string} controllerName Controller name (monitor, bid, etc.)
   * @param {string} functionName Function name (create, read, update, delete, status)
   * @param {CRUDS} crud CRUDS (CREATE, READ, UPDATE, DELETE, STATUS)
   * @returns {boolean} true - access allowed
   * @throws {ForbiddenError} ForbiddenError
   * @memberof UserService
   */
  async verify(
    user: UserExtView,
    controllerName: string,
    functionName: string,
    crud: CRUD,
    fileUploaded?: Express.Multer.File[],
  ): Promise<boolean> {
    const name = user.fullNameEmail;
    this.logger.log(
      `User: "${name}" Controllers: "${controllerName}" CRUD: "${crud}"`,
    );
    const {
      id: userId,
      role = UserRoleEnum.Administrator,
      plan = UserPlanEnum.Full,
      metrics: {
        monitors: { user: countMonitors = 0 },
      },
      createdAt = new Date(),
    } = user;
    const countUsedSpace = await this.fileService.sum({ userId });

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
          throw new ForbiddenError<I18nPath>('error.demoTimeIsUp');
        }

        if (
          controllerName === 'monitor' &&
          crud !== CRUD.READ &&
          dayjs(createdAt)
            .add(14 + 1, 'days')
            .isBefore(dayjs())
        ) {
          throw new ForbiddenError<I18nPath>('error.demoTimeIsUp');
        }

        if (controllerName === 'file') {
          if (!(crud === CRUD.READ || crud === CRUD.DELETE)) {
            if (
              dayjs(createdAt)
                .add(28 + 1, 'days')
                .isBefore(dayjs())
            ) {
              throw new ForbiddenError<I18nPath>('error.demoTimeIsUp');
            }
          }
          if (crud === CRUD.CREATE && fileUploaded) {
            const uploadedSize = fileUploaded.reduce(
              (acc, { size }) => acc + size,
              0,
            );
            if (uploadedSize > countUsedSpace) {
              throw new ForbiddenError<I18nPath>('error.file.file_upload');
            }
          }
          return true;
        }

        if (countUsedSpace >= UserStoreSpaceEnum.DEMO) {
          throw new ForbiddenError<I18nPath>('error.LIMITED_STORE_SPACE', {
            args: { countUsedSpace, plan: UserStoreSpaceEnum.DEMO },
          });
        }
      } else if (plan === UserPlanEnum.Full) {
        if (
          controllerName === 'file' &&
          countUsedSpace >= UserStoreSpaceEnum.FULL &&
          crud === CRUD.CREATE
        ) {
          throw new ForbiddenError<I18nPath>('error.LIMITED_STORE_SPACE', {
            args: { countUsedSpace, plan: UserStoreSpaceEnum.FULL },
          });
        }
      }
    } else if (role === UserRoleEnum.Advertiser) {
      if (controllerName === 'monitor' && crud !== CRUD.READ) {
        if (functionName.search(/monitorFavorite|MonitorPlaylist/) === -1) {
          throw new ForbiddenError<I18nPath>('error.DENIED_ADVERTISER');
        }
      }

      if (
        controllerName === 'file' &&
        countUsedSpace >= UserStoreSpaceEnum.FULL &&
        crud === CRUD.CREATE
      ) {
        throw new ForbiddenError<I18nPath>('error.LIMITED_STORE_SPACE', {
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
  ): Promise<UserExtView | null> {
    const { id: userId } = user;
    if (update.email !== undefined && user.email !== update.email) {
      const emailConfirmKey = genKey();

      const verifyToken = generateMailToken(update.email, emailConfirmKey);
      const confirmUrl = `${this.frontendUrl}/verify-email?key=${verifyToken}`;
      const language = update.preferredLanguage ?? user.preferredLanguage;

      const [{ affected }] = await Promise.all([
        this.userRepository.update(userId, { ...update, emailConfirmKey }),
        this.mailMsvc.emit<unknown, MsvcMailVerificationCode>(
          MsvcMailService.SendVerificationCode,
          {
            email: update.email,
            confirmUrl,
            language,
          },
        ),
      ]);
      if (!affected) {
        throw new ForbiddenError();
      }

      return this.userExtRepository.findOneBy({
        id: userId,
      });
    }

    await this.userRepository.update(userId, update).then(({ affected }) => {
      if (!affected) {
        throw new ForbiddenError();
      }
    });

    return this.userExtRepository.findOneBy({
      id: userId,
    });
  }

  /**
   * Удаляет пользователя
   * @async
   * @param {UserEntity} user User
   * @returns {DeleteResult} {DeleteResult} Результат
   */
  async delete({ id: userId }: UserEntity): Promise<DeleteResult> {
    const files = await this.fileRepository.find({
      where: { userId },
      select: ['id'],
      loadEagerRelations: false,
      relations: {},
    });
    if (files.length > 0) {
      const fileIds = files.map(({ id }) => id);
      await this.fileService.delete(fileIds);
    }
    return this.userRepository.delete({ id: userId });
  }

  /**
   * Заводит нового пользователя
   * @async
   * @param {RegisterRequest} create
   * @returns {UserEntity} Пользователь
   */
  async register(create: RegisterRequest): Promise<UserExtView> {
    const { email, password, role, ...createUser } = create;
    if (!email) {
      throw new BadRequestError<I18nPath>('error.user.email');
    }
    if (!password) {
      throw new BadRequestError<I18nPath>('error.user.password');
    }
    if (!role) {
      throw new BadRequestError<I18nPath>('error.user.role');
    }

    // TODO: verify email domain

    const existingUser = await this.userRepository.findOne({
      where: {
        email,
      },
    });
    if (existingUser) {
      throw new PreconditionFailedError<I18nPath>('error.user.exists', {
        args: { email: create.email },
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

    const emailConfirmKey = genKey();
    const userPartial: DeepPartial<UserEntity> = {
      ...createUser,
      email,
      storageSpace,
      role,
      plan,
      password: createHmac('sha256', password.normalize()).digest('hex'),
      disabled: false,
      verified: false,
      emailConfirmKey,
    };
    const verifyToken = generateMailToken(email, emailConfirmKey);
    const confirmUrl = `${this.frontendUrl}/verify-email?key=${verifyToken}`;
    const language = createUser.preferredLanguage ?? this.languageDefault;

    const [{ id }] = await Promise.all([
      this.userRepository.save(this.userRepository.create(userPartial)),
      this.mailMsvc.emit<unknown, MsvcMailWelcomeMessage>(
        MsvcMailService.SendWelcome,
        {
          email,
          language,
        },
      ),
      this.mailMsvc.emit<unknown, MsvcMailVerificationCode>(
        MsvcMailService.SendVerificationCode,
        {
          email,
          confirmUrl,
          language,
        },
      ),
    ]);

    return this.userExtRepository.findOneBy({ id }).then((user) => {
      if (!user) {
        throw new NotFoundError<I18nPath>('error.user.not_exist', {
          args: { id },
        });
      }
      return user;
    });
  }

  /**
   * createTest
   * Используется в /test/app.e2e-spec.ts
   * @async
   * @param {Partial<UserEntity>} create
   * @returns {UserEntity} Пользователь
   */
  async createTest(create: Partial<UserExtView>): Promise<UserExtView> {
    const user: DeepPartial<UserExtView> = {
      ...create,
      disabled: false,
      password: createHmac('sha256', create.password?.normalize() ?? '').digest(
        'hex',
      ),

      emailConfirmKey: genKey(),
      verified: false,
      plan: UserPlanEnum.VIP,
    };

    return this.userExtRepository.save(this.userRepository.create(user));
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
      select: ['id', 'forgotConfirmKey', 'preferredLanguage'],
    });
    if (!user) {
      throw new ForbiddenError<I18nPath>('error.user.not_exist', {
        args: { email },
      });
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

    this.mailMsvc.emit<unknown, MsvcMailForgotPassword>(
      MsvcMailService.ForgotPassword,
      {
        email,
        forgotPasswordUrl,
        language: user.preferredLanguage,
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
  ): Promise<UserExtView> {
    const [email, forgotPassword] = decodeMailToken(forgotPasswordToken);

    const { id: userId, forgotConfirmKey } = await this.userRepository
      .findOne({
        where: { email },
        select: ['id', 'forgotConfirmKey'],
      })
      .then((user) => {
        if (!user) {
          throw new ForbiddenError<I18nPath>('error.user.not_exist', {
            args: { email },
          });
        }
        return user;
      });

    if (forgotPassword === forgotConfirmKey) {
      return this.userRepository
        .update(userId, {
          password: createHmac('sha256', password.normalize()).digest('hex'),
          forgotConfirmKey: null,
        })
        .then(() =>
          this.userExtRepository.findOne({
            where: { id: userId },
          }),
        )
        .then((user) => {
          if (!user) {
            throw new ForbiddenError<I18nPath>('error.user.not_exist', {
              args: { email },
            });
          }
          return user;
        });
    }

    throw new ForbiddenError('Forgot password not equal to our records', {
      args: { forgotPassword },
    });
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
