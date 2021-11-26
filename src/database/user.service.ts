import { compare, hash } from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PreconditionFailedErrorResponse } from '@/dto/errors/precondition.response';
import { RegisterRequestDto } from '@/dto/request/register.request';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(create: RegisterRequestDto): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOne({
      email: create.email,
    });

    if (existingUser) {
      throw new PreconditionFailedErrorResponse();
    }

    const user: UserEntity = {
      email: create.email,
      password: await hash(create.password, 7),
      disabled: false,
      name: create.name,
      surname: create.surname,
      middleName: create.middleName,
      role: create.role,
      verified: false,
      isDemoUser: false,
      countUsedSpace: 0,
    };

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return this.userRepository.findOne({ email });
  }

  async findById(userId: string): Promise<UserEntity> {
    return this.userRepository.findOne(userId);
  }

  async validateCredentials(
    user: UserEntity,
    password: string,
  ): Promise<boolean> {
    return compare(password, user.password);
  }
}
