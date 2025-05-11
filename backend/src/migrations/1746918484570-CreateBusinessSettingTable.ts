import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBusinessSettingTable1746918484570 implements MigrationInterface {
    name = 'CreateBusinessSettingTable1746918484570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."business_settings_currency_enum" AS ENUM('MXN', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TABLE "business_settings" ("id" SERIAL NOT NULL, "name" character varying(255), "address" text, "phone" character varying(50), "currency" "public"."business_settings_currency_enum" NOT NULL DEFAULT 'MXN', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_be550d64549bda4778cf6f9e0df" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "business_settings"`);
        await queryRunner.query(`DROP TYPE "public"."business_settings_currency_enum"`);
    }

}
