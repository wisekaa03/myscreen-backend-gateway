/* eslint max-len:0, no-multi-str:0, @typescript-eslint/naming-convention:0, class-methods-use-this:0, @typescript-eslint/no-empty-function:0, @typescript-eslint/no-unused-vars:0 */

import { Injectable, Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

@Injectable()
export class Initial1637338021580 implements MigrationInterface {
  private logger = new Logger(Initial1637338021580.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.debug(`UP ${queryRunner.connection.options.type}`);

    // // *** FUNCTIONS ***
    // // set_updated_at()
    // await queryRunner.query(
    //   '\n\
    //   CREATE OR REPLACE FUNCTION set_updated_at()\n\
    //     RETURNS trigger\n\
    //   LANGUAGE \'plpgsql\'\n\
    //   COST 100\n\
    //   VOLATILE NOT LEAKPROOF\n\
    //   AS $BODY$\n\
    //   DECLARE\n\
    //     _new record;\n\
    //   BEGIN\n\
    //     _new := NEW;\n\
    //     _new."updatedAt" = NOW();\n\
    //     RETURN _new;\n\
    //   END;\n\
    //   $BODY$;\n\
    //   ALTER FUNCTION set_updated_at() OWNER TO postgres;\n\
    // ',
    // );

    // // *** ENUM ***
    // // files_type_enum
    // await queryRunner.query(
    //   "DO $$ BEGIN\n\
    //   PERFORM 'files_type_enum'::regtype;\n\
    //   EXCEPTION\n\
    //     WHEN undefined_object THEN\n\
    //       CREATE TYPE \"files_type_enum\" AS ENUM('monitor-ownership-doc', 'monitor-photo');\n\
    //   END $$;",
    // );

    // // users_role_enum
    // await queryRunner.query(
    //   "DO $$ BEGIN\n\
    //   PERFORM 'users_role_enum'::regtype;\n\
    //   EXCEPTION\n\
    //     WHEN undefined_object THEN\n\
    //     CREATE TYPE \"users_role_enum\" AS ENUM('administrator', 'monitor-owner', 'advertiser');\n\
    //   END $$;",
    // );

    // // monitors_orientation_enum
    // await queryRunner.query(
    //   "DO $$ BEGIN\n\
    //   PERFORM 'monitors_orientation_enum'::regtype;\n\
    //   EXCEPTION\n\
    //     WHEN undefined_object THEN\n\
    //     CREATE TYPE \"monitors_orientation_enum\" AS ENUM('Horizontal', 'Vertical');\n\
    //   END $$;",
    // );

    // // editors_renderingstatus_enum
    // await queryRunner.query(
    //   "DO $$ BEGIN\n\
    //   PERFORM 'editors_renderingstatus_enum'::regtype;\n\
    //   EXCEPTION\n\
    //     WHEN undefined_object THEN\n\
    //     CREATE TYPE \"editors_renderingstatus_enum\" AS ENUM('initial', 'ready', 'pending', 'error');\n\
    //   END $$;",
    // );

    // // media_type_enum
    // await queryRunner.query(
    //   "DO $$ BEGIN\n\
    //   PERFORM 'media_type_enum'::regtype;\n\
    //   EXCEPTION\n\
    //     WHEN undefined_object THEN\n\
    //     CREATE TYPE \"media_type_enum\" AS ENUM('video', 'image', 'audio');\n\
    //   END $$;",
    // );

    // // payments_paymentservice_enum
    // await queryRunner.query(
    //   "DO $$ BEGIN\n\
    //   PERFORM 'payments_paymentservice_enum'::regtype;\n\
    //   EXCEPTION\n\
    //     WHEN undefined_object THEN\n\
    //     CREATE TYPE \"payments_paymentservice_enum\" AS ENUM('youkassa', 'invoice');\n\
    //   END $$;",
    // );

    // // payments_status_enum
    // await queryRunner.query(
    //   "DO $$ BEGIN\n\
    //   PERFORM 'payments_status_enum'::regtype;\n\
    //   EXCEPTION\n\
    //     WHEN undefined_object THEN\n\
    //     CREATE TYPE \"payments_status_enum\" AS ENUM('pending', 'succeeded', 'cancelled', 'waiting_for_capture');\n\
    //   END $$;",
    // );

    // // payments_receiptstatus_enum
    // await queryRunner.query(
    //   "DO $$ BEGIN\n\
    //   PERFORM 'payments_receiptstatus_enum'::regtype;\n\
    //   EXCEPTION\n\
    //     WHEN undefined_object THEN\n\
    //     CREATE TYPE \"payments_receiptstatus_enum\" AS ENUM('pending', 'succeeded', 'cancelled');\n\
    //   END $$;",
    // );

    // // payments_cancellationparty_enum
    // await queryRunner.query(
    //   "DO $$ BEGIN\n\
    //   PERFORM 'payments_cancellationparty_enum'::regtype;\n\
    //   EXCEPTION\n\
    //     WHEN undefined_object THEN\n\
    //     CREATE TYPE \"payments_cancellationparty_enum\" AS ENUM('yandex_checkout', 'yoo_money', 'payment_network', 'merchant');\n\
    //   END $$;",
    // );

    // // payments_cancellationreason_enum
    // await queryRunner.query(
    //   "DO $$ BEGIN\n\
    //   PERFORM 'payments_cancellationreason_enum'::regtype;\n\
    //   EXCEPTION\n\
    //     WHEN undefined_object THEN\n\
    //     CREATE TYPE \"payments_cancellationreason_enum\" AS ENUM(\n\
    //       '3d_secure_failed', 'call_issuer', 'canceled_by_merchant', 'card_expired',\n\
    //       'country_forbidden', 'expired_on_capture', 'fraud_suspected', 'general_decline',\n\
    //       'identification_required', 'insufficient_funds', 'internal_timeout', 'invalid_card_number',\n\
    //       'invalid_csc', 'issuer_unavailable', 'payment_method_limit_exceeded', 'payment_method_restricted',\n\
    //       'permission_revoked', 'unsupported_mobile_operator'\n\
    //     );\n\
    //   END $$;",
    // );

    // // *** TABLES ***
    // // users
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "users"            ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                         "email" character varying NOT NULL,\n\
    //                         "surname" character varying,\n\
    //                         "name" character varying,\n\
    //                         "middleName" character varying,\n\
    //                         "password" character varying NOT NULL,\n\
    //                         "phoneNumber" character varying,\n\
    //                         "country" character varying DEFAULT \'RU\',\n\
    //                         "city" character varying,\n\
    //                         "company" character varying,\n\
    //                         "role" "users_role_enum" NOT NULL,\n\
    //                         "forgot_confirm_key" character varying,\n\
    //                         "email_confirm_key" character varying,\n\
    //                         "verified" boolean NOT NULL DEFAULT false,\n\
    //                         "isDemoUser" boolean NOT NULL DEFAULT false,\n\
    //                         "countUsedSpace" double precision NOT NULL DEFAULT \'0\',\n\
    //                         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                         "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                         CONSTRAINT "users_pkey" PRIMARY KEY ("id")\n\
    //                       )\
    //   ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_users\n\
    //     BEFORE UPDATE\n\
    //     ON users\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    // ',
    // );

    // // folders
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "folders"        ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                       "name" character varying NOT NULL,\n\
    //                       "parentFolderId" uuid,\n\
    //                       "userId" uuid,\n\
    //                       "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                       "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                       CONSTRAINT "folders_pkey" PRIMARY KEY ("id"),\n\
    //                       CONSTRAINT "folders_userId_fkey" FOREIGN KEY ("userId")\n\
    //                         REFERENCES public.users (id) MATCH SIMPLE\n\
    //                           ON UPDATE CASCADE\n\
    //                           ON DELETE NO ACTION\n\
    //                     )\
    //   ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_folders\n\
    //     BEFORE UPDATE\n\
    //     ON folders\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    //   ',
    // );

    // // media
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "media"          ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                       "original_name" character varying NOT NULL,\n\
    //                       "name" character varying NOT NULL,\n\
    //                       "hash" character varying,\n\
    //                       "type" "media_type_enum" NOT NULL,\n\
    //                       "meta" json,\n\
    //                       "folderId" uuid NOT NULL,\n\
    //                       "ownerId" uuid,\n\
    //                       "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                       "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                       CONSTRAINT "media_pkey" PRIMARY KEY ("id"),\n\
    //                       CONSTRAINT "media_ownerId_fkey" FOREIGN KEY ("ownerId")\n\
    //                         REFERENCES users (id) MATCH SIMPLE\n\
    //                           ON UPDATE CASCADE\n\
    //                           ON DELETE NO ACTION\n\
    //                     )\
    //   ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_media\n\
    //     BEFORE UPDATE\n\
    //     ON media\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    //   ',
    // );

    // // playlists
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "playlists"      ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                       "name" character varying NOT NULL,\n\
    //                       "description" character varying,\n\
    //                       "video_ids" uuid array,\n\
    //                       "ownerId" uuid,\n\
    //                       "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                       "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                       CONSTRAINT "playlists_pkey" PRIMARY KEY ("id"),\n\
    //                       CONSTRAINT "playlists_ownerId_fkey" FOREIGN KEY ("ownerId")\n\
    //                         REFERENCES users (id) MATCH SIMPLE\n\
    //                           ON UPDATE CASCADE\n\
    //                           ON DELETE NO ACTION\n\
    //                     )\
    //   ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_playlists\n\
    //       BEFORE UPDATE\n\
    //       ON playlists\n\
    //       FOR EACH ROW\n\
    //       EXECUTE FUNCTION set_updated_at();\
    // ',
    // );

    // // monitors
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "monitors"       ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                       "name" character varying NOT NULL,\n\
    //                       "address" json NOT NULL,\n\
    //                       "category" integer NOT NULL,\n\
    //                       "price" json NOT NULL,\n\
    //                       "orientation" "monitors_orientation_enum" NOT NULL,\n\
    //                       "monitor" json NOT NULL,\n\
    //                       "attached" boolean NOT NULL DEFAULT false,\n\
    //                       "code" character varying NOT NULL,\n\
    //                       "media" character varying array NOT NULL DEFAULT \'{}\',\n\
    //                       "status" character varying NOT NULL DEFAULT \'offline\',\n\
    //                       "last_seen" character varying,\n\
    //                       "currentPlaylistId" uuid,\n\
    //                       "latitude" double precision,\n\
    //                       "longitude" double precision,\n\
    //                       "ownerId" uuid,\n\
    //                       "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                       "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                       CONSTRAINT "monitors_name_key" UNIQUE ("name"),\n\
    //                       CONSTRAINT "monitors_pkey" PRIMARY KEY ("id"),\n\
    //                       CONSTRAINT "monitors_ownerId_fkey" FOREIGN KEY ("ownerId")\n\
    //                         REFERENCES "users" (id) MATCH SIMPLE\n\
    //                           ON UPDATE CASCADE\n\
    //                           ON DELETE CASCADE\n\
    //                     )\
    //   ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_monitors\n\
    //       BEFORE UPDATE\n\
    //       ON monitors\n\
    //       FOR EACH ROW\n\
    //       EXECUTE FUNCTION set_updated_at();\
    // ',
    // );

    // // accounts
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "accounts"           ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                           "userId" uuid,\n\
    //                           "amount" character varying NOT NULL,\n\
    //                           "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                           "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                           CONSTRAINT "accounts_pkey" PRIMARY KEY ("id"),\n\
    //                           CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")\n\
    //                             REFERENCES "users"("id") MATCH SIMPLE\n\
    //                               ON UPDATE CASCADE\n\
    //                               ON DELETE NO ACTION\n\
    //                         )\
    //   ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_accounts\n\
    //     BEFORE UPDATE\n\
    //     ON accounts\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    //   ',
    // );

    // // media_playlist_map
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "media_playlist_map" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                           "mediaId" uuid,\n\
    //                           "playlistId" uuid,\n\
    //                           "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                           "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                           CONSTRAINT media_playlist_map_pkey PRIMARY KEY (id),\n\
    //                           CONSTRAINT "media_playlist_map_mediaId_fkey" FOREIGN KEY ("mediaId")\n\
    //                               REFERENCES media (id) MATCH SIMPLE\n\
    //                               ON UPDATE CASCADE\n\
    //                               ON DELETE CASCADE,\n\
    //                           CONSTRAINT "media_playlist_map_playlistId_fkey" FOREIGN KEY ("playlistId")\n\
    //                               REFERENCES playlists (id) MATCH SIMPLE\n\
    //                               ON UPDATE CASCADE\n\
    //                               ON DELETE CASCADE\n\
    //                         )\
    //   ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_media_playlist_map\n\
    //     BEFORE UPDATE\n\
    //     ON media_playlist_map\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\n\
    //   ',
    // );

    // // editors
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "editors"  ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                 "width" integer NOT NULL,\n\
    //                 "height" integer NOT NULL,\n\
    //                 "fps" integer DEFAULT 24,\n\
    //                 "renderingStatus" "editors_renderingstatus_enum" DEFAULT \'initial\'::"editors_renderingstatus_enum",\n\
    //                 "fileId" character varying(255) COLLATE pg_catalog."default",\n\
    //                 "keep_source_audio" boolean DEFAULT true,\n\
    //                 "layers" json array DEFAULT \'{}\',\n\
    //                 "total_duration" integer,\n\
    //                 "audio_tracks" json array NOT NULL DEFAULT \'{}\',\n\
    //                 "ownerId" uuid,\n\
    //                 "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\
    //                 "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\
    //                 CONSTRAINT "editors_pkey" PRIMARY KEY (id),\n\
    //                 CONSTRAINT "editors_ownerId_fkey" FOREIGN KEY ("ownerId")\n\
    //                   REFERENCES users (id) MATCH SIMPLE\n\
    //                     ON UPDATE CASCADE\n\
    //                     ON DELETE NO ACTION\n\
    //               )\
    //   ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_editors\n\
    //     BEFORE UPDATE\n\
    //     ON editors\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    // ',
    // );

    // // video
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "videos"     ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                   "name" character varying NOT NULL,\n\
    //                   "description" character varying,\n\
    //                   "hash" boolean NOT NULL,\n\
    //                   "original_name" character varying,\n\
    //                   "duration" integer NOT NULL,\n\
    //                   "filesize" integer NOT NULL,\n\
    //                   "preview" character varying,\n\
    //                   "extension" character varying NOT NULL,\n\
    //                   "width" integer NOT NULL,\n\
    //                   "height" integer NOT NULL,\n\
    //                   "ownerId" uuid,\n\
    //                   "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                   "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                   CONSTRAINT "videos_pkey" PRIMARY KEY ("id"),\n\
    //                   CONSTRAINT "videos_ownerId_fkey" FOREIGN KEY ("ownerId")\n\
    //                     REFERENCES users (id) MATCH SIMPLE\n\
    //                       ON UPDATE CASCADE\n\
    //                       ON DELETE NO ACTION\n\
    //                 )\
    // ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_videos\n\
    //     BEFORE UPDATE\n\
    //     ON videos\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    // ',
    // );

    // // video_playlist_map
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "video_playlist_map"   ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                             "videoId" uuid,\n\
    //                             "playlistId" uuid,\n\
    //                             "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                             "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                             CONSTRAINT "video_playlist_map_pkey" PRIMARY KEY (id),\n\
    //                             CONSTRAINT "video_playlist_map_playlistId_fkey" FOREIGN KEY ("playlistId")\n\
    //                               REFERENCES playlists (id) MATCH SIMPLE\n\
    //                                 ON UPDATE CASCADE\n\
    //                                 ON DELETE CASCADE,\n\
    //                             CONSTRAINT "video_playlist_map_videoId_fkey" FOREIGN KEY ("videoId")\n\
    //                               REFERENCES videos (id) MATCH SIMPLE\n\
    //                                 ON UPDATE CASCADE\n\
    //                                 ON DELETE CASCADE\n\
    //                           )\
    // ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_video_playlist_map\n\
    //     BEFORE UPDATE\n\
    //     ON video_playlist_map\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    // ',
    // );

    // // media_editor_map
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "media_editor_map"      ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                             "mediaId" uuid,\n\
    //                             "editorId" uuid,\n\
    //                             "createdAt" timestamp without time zone NOT NULL DEFAULT now(),\n\
    //                             "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),\n\
    //                             CONSTRAINT media_editor_map_pkey PRIMARY KEY (id),\n\
    //                             CONSTRAINT "media_editor_map_editorId_fkey" FOREIGN KEY ("editorId")\n\
    //                               REFERENCES editors (id) MATCH SIMPLE\n\
    //                                 ON UPDATE CASCADE\n\
    //                                 ON DELETE CASCADE,\n\
    //                             CONSTRAINT "media_editor_map_mediaId_fkey" FOREIGN KEY ("mediaId")\n\
    //                               REFERENCES media (id) MATCH SIMPLE\n\
    //                                 ON UPDATE CASCADE\n\
    //                                 ON DELETE CASCADE\n\
    //                           )\
    // ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_media_editor_map\n\
    //     BEFORE UPDATE\n\
    //     ON media_editor_map\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    //   ',
    // );

    // // monitor_playlist_map
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "monitor_playlist_map" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                             "monitorId" uuid,\n\
    //                             "playlistId" uuid,\n\
    //                             "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\
    //                             "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\
    //                             CONSTRAINT monitor_playlist_map_pkey PRIMARY KEY (id),\n\
    //                             CONSTRAINT "monitor_playlist_map_monitorId_fkey" FOREIGN KEY ("monitorId")\n\
    //                               REFERENCES public.monitors (id) MATCH SIMPLE\n\
    //                                 ON UPDATE CASCADE\n\
    //                                 ON DELETE CASCADE,\n\
    //                             CONSTRAINT "monitor_playlist_map_playlistId_fkey" FOREIGN KEY ("playlistId")\n\
    //                               REFERENCES public.playlists (id) MATCH SIMPLE\n\
    //                                 ON UPDATE CASCADE\n\
    //                                 ON DELETE CASCADE\n\
    //                           )\
    // ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_monitor_playlist_map\n\
    //     BEFORE UPDATE\n\
    //     ON monitor_playlist_map\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    //   ',
    // );

    // // files
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "files"            ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                         "originalFilename" character varying NOT NULL,\n\
    //                         "hash" character varying NOT NULL,\n\
    //                         "extension" character varying NOT NULL,\n\
    //                         "type" "files_type_enum" NOT NULL,\n\
    //                         "uploading" boolean NOT NULL DEFAULT true,\n\
    //                         "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                         "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                         "folderId" uuid,\n\
    //                         "targetId" uuid,\n\
    //                         "ownerId" uuid,\n\
    //                         CONSTRAINT files_pkey PRIMARY KEY (id),\n\
    //                         CONSTRAINT "files_folderId_fkey" FOREIGN KEY ("folderId")\n\
    //                             REFERENCES folders (id) MATCH SIMPLE\n\
    //                             ON UPDATE CASCADE\n\
    //                             ON DELETE SET NULL,\n\
    //                         CONSTRAINT "files_ownerId_fkey" FOREIGN KEY ("ownerId")\n\
    //                             REFERENCES users (id) MATCH SIMPLE\n\
    //                             ON UPDATE CASCADE\n\
    //                             ON DELETE SET NULL,\n\
    //                         CONSTRAINT "files_targetId_fkey" FOREIGN KEY ("targetId")\n\
    //                             REFERENCES monitors (id) MATCH SIMPLE\n\
    //                             ON UPDATE CASCADE\n\
    //                             ON DELETE SET NULL\n\
    //                       )\
    //   ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_files\n\
    //     BEFORE UPDATE\n\
    //     ON files\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    //   ',
    // );

    // // orders
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "orders"   ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                 "seqNo" SERIAL NOT NULL,\n\
    //                 "description" numeric NOT NULL,\n\
    //                 "userId" uuid,\n\
    //                 "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                 "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                 CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),\n\
    //                 CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId")\n\
    //                 REFERENCES "users" (id) MATCH SIMPLE\n\
    //                 ON UPDATE CASCADE\n\
    //                 ON DELETE NO ACTION\n\
    //               )\
    //   ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_orders\n\
    //     BEFORE UPDATE\n\
    //     ON orders\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    //   ',
    // );

    // // payments
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "payments"      ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                     "externalPayment" character varying,\n\
    //                     "paid" boolean NOT NULL,\n\
    //                     "refunded" boolean NOT NULL DEFAULT false,\n\
    //                     "refundId" character varying NOT NULL,\n\
    //                     "test" boolean,\n\
    //                     "userId" uuid,\n\
    //                     "orderId" uuid,\n\
    //                     "paymentService" "payments_paymentservice_enum" NOT NULL,\n\
    //                     "amount" character varying NOT NULL,\n\
    //                     "incomeAmount" character varying,\n\
    //                     "description" character varying,\n\
    //                     "status" "payments_status_enum" NOT NULL,\n\
    //                     "capturedAt" timestamp,\n\
    //                     "expiresAt" timestamp,\n\
    //                     "receiptStatus" "payments_receiptstatus_enum",\n\
    //                     "cancellationParty" "payments_cancellationparty_enum",\n\
    //                     "cancellationReason" "payments_cancellationreason_enum",\n\
    //                     "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                     "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                     CONSTRAINT payments_pkey PRIMARY KEY (id),\n\
    //                     CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId")\n\
    //                         REFERENCES orders (id) MATCH SIMPLE\n\
    //                         ON UPDATE CASCADE\n\
    //                         ON DELETE NO ACTION,\n\
    //                     CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId")\n\
    //                         REFERENCES users (id) MATCH SIMPLE\n\
    //                         ON UPDATE CASCADE\n\
    //                         ON DELETE NO ACTION\n\
    //                   )\
    // ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_payments\n\
    //     BEFORE UPDATE\n\
    //     ON payments\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    // ',
    // );

    // // payment_logs
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "payment_logs"  ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                     "userId" uuid,\n\
    //                     "orderId" uuid,\n\
    //                     "paymentId" uuid,\n\
    //                     "log" jsonb,\n\
    //                     "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                     "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                     CONSTRAINT payment_logs_pkey PRIMARY KEY (id),\n\
    //                     CONSTRAINT "payment_logs_orderId_fkey" FOREIGN KEY ("orderId")\n\
    //                         REFERENCES orders (id) MATCH SIMPLE\n\
    //                         ON UPDATE CASCADE\n\
    //                         ON DELETE NO ACTION,\n\
    //                     CONSTRAINT "payment_logs_paymentId_fkey" FOREIGN KEY ("paymentId")\n\
    //                         REFERENCES payments (id) MATCH SIMPLE\n\
    //                         ON UPDATE CASCADE\n\
    //                         ON DELETE NO ACTION,\n\
    //                     CONSTRAINT "payment_logs_userId_fkey" FOREIGN KEY ("userId")\n\
    //                         REFERENCES users (id) MATCH SIMPLE\n\
    //                         ON UPDATE CASCADE\n\
    //                         ON DELETE NO ACTION\n\
    //                     )\
    //   ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_payment_logs\n\
    //     BEFORE UPDATE\n\
    //     ON payment_logs\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    //   ',
    // );

    // // uptime_monitoring
    // await queryRunner.query(
    //   'CREATE TABLE IF NOT EXISTS\n\
    //     "uptime_monitoring"   ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),\n\
    //                           "processing_hour" integer NOT NULL,\n\
    //                           "monitor_id" uuid NOT NULL,\n\
    //                           "count" integer DEFAULT \'0\',\n\
    //                           "createdAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                           "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),\n\
    //                           CONSTRAINT uptime_monitoring_pkey PRIMARY KEY (id),\n\
    //                           CONSTRAINT uptime_monitoring_monitor_id_fkey FOREIGN KEY (monitor_id)\n\
    //                               REFERENCES monitors (id) MATCH SIMPLE\n\
    //                               ON UPDATE CASCADE\n\
    //                               ON DELETE NO ACTION\n\
    //                         )\
    // ',
    // );
    // await queryRunner.query(
    //   'CREATE TRIGGER set_updated_at_uptime_monitoring\n\
    //     BEFORE UPDATE\n\
    //     ON uptime_monitoring\n\
    //     FOR EACH ROW\n\
    //     EXECUTE FUNCTION set_updated_at();\
    //   ',
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    this.logger.debug(`DOWN ${queryRunner.connection.options.type}`);

    // await queryRunner.query('DROP TABLE IF EXISTS "accounts"');
    // await queryRunner.query('DROP TABLE IF EXISTS "files"');
    // await queryRunner.query('DROP TABLE IF EXISTS "monitors"');
    // await queryRunner.query('DROP TABLE IF EXISTS "users"');

    // await queryRunner.query('DROP TYPE IF EXISTS "files_type_enum"');
    // await queryRunner.query('DROP TYPE IF EXISTS "monitors_orientation_enum"');
    // await queryRunner.query('DROP TYPE IF EXISTS "users_role_enum"');
  }
}
