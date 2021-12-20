import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe(JwtAuthGuard.name, () => {
  it('should be defined', () => {
    expect(new JwtAuthGuard(new Reflector())).toBeDefined();
  });
});
