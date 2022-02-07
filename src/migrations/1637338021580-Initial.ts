/* eslint max-len:0, no-multi-str:0, @typescript-eslint/naming-convention:0, class-methods-use-this:0, @typescript-eslint/no-empty-function:0, @typescript-eslint/no-unused-vars:0 */

import { Injectable, Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

@Injectable()
export class Initial1637338021580 implements MigrationInterface {
  private logger = new Logger(Initial1637338021580.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.debug(`UP ${queryRunner.connection.options.type}`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    this.logger.debug(`DOWN ${queryRunner.connection.options.type}`);
  }
}
