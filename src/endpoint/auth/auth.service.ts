import { Injectable } from '@nestjs/common';

import { AuthResponseDto } from '@/endpoint/dto/response/auth.response';
import { ForbiddenErrorResponse } from '@/endpoint/dto/response/forbidden.reponse';

@Injectable()
export class AuthService {
  async authentication(): Promise<AuthResponseDto> {
    throw new ForbiddenErrorResponse();
  }
}
