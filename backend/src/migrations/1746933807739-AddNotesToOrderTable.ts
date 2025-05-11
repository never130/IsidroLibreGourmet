import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotesToOrderTable1746933807739 implements MigrationInterface {
    name = 'AddNotesToOrderTable1746933807739'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "order" ADD "createdById" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customerPhone"`);
        await queryRunner.query(`ALTER TABLE "order" ADD "customerPhone" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "order" ADD "address" text`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_de6fa8b07fd7e0a8bf9edb5eb38" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_de6fa8b07fd7e0a8bf9edb5eb38"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "order" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customerPhone"`);
        await queryRunner.query(`ALTER TABLE "order" ADD "customerPhone" character varying`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "notes"`);
    }

}
