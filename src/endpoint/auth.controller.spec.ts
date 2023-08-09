import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '@/guards';
import { AuthService } from '@/auth/auth.service';
import { UserService } from '@/database/user.service';
import { MonitorService } from '@/database/monitor.service';
import { AuthController } from './auth.controller';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(AuthController.name, () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: UserService, useClass: mockRepository },
        { provide: AuthService, useClass: mockRepository },
        { provide: MonitorService, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should ensure the JwtAuthGuard is applied to the AuthController.authorization', async () => {
    const guards = Reflect.getMetadata(
      '__guards__',
      AuthController.prototype.authorization,
    );
    const guard = new guards[0]();

    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should ensure the JwtAuthGuard is applied to the AuthController.update', async () => {
    const guards = Reflect.getMetadata(
      '__guards__',
      AuthController.prototype.update,
    );
    const guard = new guards[0]();

    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should ensure the JwtAuthGuard is applied to the AuthController.disable', async () => {
    const guards = Reflect.getMetadata(
      '__guards__',
      AuthController.prototype.disable,
    );
    const guard = new guards[0]();

    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  // TODO: should inspect:
  // TODO: - authorization, update, login, register, refresh, verifyEmail
  // TODO: - resetPasswordInvitation, resetPasswordVerify, disableUser
});
