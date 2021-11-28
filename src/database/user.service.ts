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
  FindManyOptions,
  Repository,
  Transaction,
  TransactionRepository,
} from 'typeorm';

import { decodeMailToken, generateMailToken } from '@/shared/mail-token';
import { MailService } from '@/mail/mail.service';
import {
  RegisterRequest,
  UserUpdateRequest,
  AuthResponse,
  Status,
  User,
  userEntityToUser,
  SuccessResponse,
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

  async updateFromRequest(
    user: UserEntity,
    body: UserUpdateRequest,
  ): Promise<AuthResponse> {
    const userToBeSaved = Object.assign(user, body);
    const data = await this.update(userToBeSaved);
    return {
      status: Status.Success,
      data: userEntityToUser(data),
    };
  }

  async selectFromRequest(
    user: UserEntity,
    body: UserUpdateRequest,
  ): Promise<AuthResponse> {
    const userToBeSaved = Object.assign(user, body);
    const data = await this.update(userToBeSaved);
    return {
      status: Status.Success,
      data: userEntityToUser(data),
    };
  }

  @Transaction()
  async deleteUser(
    user: UserEntity,
    @TransactionRepository(UserEntity)
    userRepository: Repository<UserEntity> = null,
  ): Promise<SuccessResponse> {
    await userRepository.delete(user.id);

    return {
      status: Status.Success,
    };
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
      throw new PreconditionFailedException(`User '${create.email}' exists`);
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
      throw new BadGatewayException(`User with email '${email}' not exists`);
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
      throw new BadRequestException(`User with email '${email}' not exists`);
    }

    if (forgotPassword === user.forgotConfirmKey) {
      user.password = await hash(password, 7);
      user.forgotConfirmKey = null;
      await userRepository.save(user);

      return;
    }

    throw new BadRequestException(
      `Forgot password '${forgotPassword}' not equal to our records`,
    );
  }

  async findAll(includeDisabled: boolean): Promise<UserEntity[]> {
    const findMany: FindManyOptions<UserEntity> = {
      where: {
        ...(includeDisabled ? { disabled: false } : undefined),
      },
    };
    return this.userRepository.find(findMany).then((users) =>
      users.map((user) => {
        /* eslint-disable-next-line no-param-reassign */
        user.password = undefined;
        return user;
      }),
    );
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return this.userRepository.findOne({ email, disabled: false });
  }

  async findById(userId: string): Promise<UserEntity> {
    return this.userRepository.findOne({ id: userId, disabled: false });
  }

  async validateCredentials(
    user: UserEntity,
    password: string,
  ): Promise<boolean> {
    return compare(password, user.password);
  }
}
