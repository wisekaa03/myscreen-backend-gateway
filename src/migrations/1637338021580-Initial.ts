/* eslint max-len:0, no-multi-str:0, @typescript-eslint/naming-convention:0, class-methods-use-this:0, @typescript-eslint/no-empty-function:0, @typescript-eslint/no-unused-vars:0 */

import { Injectable, Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

@Injectable()
export class Initial1637338021580 implements MigrationInterface {
  private logger = new Logger(Initial1637338021580.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.debug(`UP ${queryRunner.connection.options.type}`);

    // set_updated_at()
    await queryRunner.query(
      '\n\
      CREATE OR REPLACE FUNCTION public.set_updated_at()\n\
        RETURNS trigger\n\
      LANGUAGE \'plpgsql\'\n\
      COST 100\n\
      VOLATILE NOT LEAKPROOF\n\
      AS $BODY$\n\
      DECLARE\n\
        _new record;\n\
      BEGIN\n\
        _new := NEW;\n\
        _new."updatedAt" = NOW();\n\
        RETURN _new;\n\
      END;\n\
      $BODY$;\n\
      ALTER FUNCTION public.set_updated_at() OWNER TO postgres;\n\
    ',
    );

    // files_type_enum
    await queryRunner.query(
      "DO $$ BEGIN \
      PERFORM 'public.files_type_enum'::regtype; \
      EXCEPTION \
        WHEN undefined_object THEN \
          CREATE TYPE \"public\".\"files_type_enum\" AS ENUM('monitor-ownership-doc', 'monitor-photo'); \
      END $$;",
    );

    // users_role_enum
    await queryRunner.query(
      "DO $$ BEGIN \
      PERFORM 'public.users_role_enum'::regtype; \
      EXCEPTION \
        WHEN undefined_object THEN \
        CREATE TYPE \"public\".\"users_role_enum\" AS ENUM('administrator', 'monitor-owner', 'advertiser'); \
      END $$;",
    );

    // monitors_orientation_enum
    await queryRunner.query(
      "DO $$ BEGIN \
      PERFORM 'public.monitors_orientation_enum'::regtype; \
      EXCEPTION \
        WHEN undefined_object THEN \
        CREATE TYPE \"public\".\"monitors_orientation_enum\" AS ENUM('Horizontal', 'Vertical'); \
      END $$;",
    );

    // files
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS \
                  "files"  ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), \
                            "originalFilename" character varying NOT NULL, \
                            "hash" character varying NOT NULL, \
                            "extension" character varying NOT NULL, \
                            "type" "public"."files_type_enum" NOT NULL, \
                            "uploading" boolean NOT NULL DEFAULT true, \
                            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), \
                            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), \
                            CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))',
    );

    // users
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS \
                  "users"  ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), \
                            "email" character varying NOT NULL, \
                            "surname" character varying, \
                            "name" character varying, \
                            "middleName" character varying, \
                            "password" character varying NOT NULL, \
                            "phoneNumber" character varying, \
                            "country" character varying DEFAULT \'RU\', \
                            "city" character varying, \
                            "company" character varying, \
                            "role" "public"."users_role_enum" NOT NULL, \
                            "forgot_confirm_key" character varying, \
                            "email_confirm_key" character varying, \
                            "verified" boolean NOT NULL DEFAULT false, \
                            "isDemoUser" boolean NOT NULL DEFAULT false, \
                            "countUsedSpace" double precision NOT NULL DEFAULT \'0\', \
                            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), \
                            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), \
                            CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))',
    );

    // monitors
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS \
                  "monitors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), \
                              "name" character varying NOT NULL, \
                              "address" json NOT NULL, \
                              "category" numeric NOT NULL, \
                              "price" json NOT NULL, \
                              "orientation" "public"."monitors_orientation_enum" NOT NULL, \
                              "monitor" json NOT NULL, \
                              "attached" boolean NOT NULL DEFAULT false, \
                              "code" character varying NOT NULL, \
                              "media" text array NOT NULL DEFAULT \'{}\', \
                              "status" character varying NOT NULL DEFAULT \'offline\', \
                              "last_seen" character varying, \
                              "currentPlaylistId" uuid, \
                              "latitude" double precision, \
                              "longitude" double precision, \
                              "createdAt" TIMESTAMP NOT NULL DEFAULT now(), \
                              "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), \
                              CONSTRAINT "UQ_32f18d6269ed22b34668835c3ae" UNIQUE ("name"), \
                              CONSTRAINT "PK_193902e2013887310490284cdbe" PRIMARY KEY ("id"))',
    );

    // accounts
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS \
                  "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), \
                              "userId" uuid, \
                              "amount" character varying NOT NULL, \
                              "createdAt" TIMESTAMP NOT NULL DEFAULT now(), \
                              "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), \
                              CONSTRAINT "accounts_pkey" PRIMARY KEY ("id"), \
                              CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") \
                                ON DELETE NO ACTION \
                                ON UPDATE CASCADE \
                            )',
    );
    await queryRunner.query(
      ' \
      DROP TRIGGER IF EXISTS set_updated_at_accounts on accounts; \
      CREATE TRIGGER set_updated_at_accounts BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE PROCEDURE set_updated_at(); \
      ',
    );
    // await queryRunner.query(
    //   'ALTER TABLE "accounts" ADD CONSTRAINT "FK_3aa23c0a6d107393e8b40e3e2a6" FOREIGN KEY ("userId") REFERENCES "users"("id") \
    //               ON DELETE NO ACTION \
    //               ON UPDATE NO ACTION',
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    this.logger.debug(`DOWN ${queryRunner.connection.options.type}`);

    await queryRunner.query('DROP TABLE IF EXISTS "accounts"');
    await queryRunner.query('DROP TABLE IF EXISTS "files"');
    await queryRunner.query('DROP TABLE IF EXISTS "monitors"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');

    await queryRunner.query('DROP TYPE IF EXISTS "files_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "monitors_orientation_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "users_role_enum"');
  }
}
