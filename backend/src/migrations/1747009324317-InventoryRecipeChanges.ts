import { MigrationInterface, QueryRunner } from "typeorm";

export class InventoryRecipeChanges1747009324317 implements MigrationInterface {
    name = 'InventoryRecipeChanges1747009324317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "isAvailable" TO "manageStock"`);
        await queryRunner.query(`CREATE TABLE "unit_of_measures" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, "symbol" character varying(10) NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e875eebb54ac0b74160345926d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1ad0970ca0247cec3c63a2c0dd" ON "unit_of_measures" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5e36e2ddd28f901cc0fe6a39a1" ON "unit_of_measures" ("symbol") `);
        await queryRunner.query(`CREATE TABLE "ingredients" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "stock" numeric(10,3) NOT NULL DEFAULT '0', "unitOfMeasureId" integer NOT NULL, "lowStockThreshold" numeric(10,3), "cost" numeric(10,4), "supplier" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9240185c8a5507251c9f15e0649" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a955029b22ff66ae9fef2e161f" ON "ingredients" ("name") `);
        await queryRunner.query(`CREATE TABLE "recipe_items" ("id" SERIAL NOT NULL, "recipeId" integer NOT NULL, "ingredientId" integer NOT NULL, "quantity" numeric(10,3) NOT NULL, "unitOfMeasureId" integer NOT NULL, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_daec78e42198e9c42e1fed60eec" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "recipes" ("id" SERIAL NOT NULL, "productId" integer NOT NULL, "name" character varying(255) DEFAULT 'Receta Estándar', "description" text, "estimatedCost" numeric(10,2), "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_67c6c6236c69cf0173a8908348" UNIQUE ("productId"), CONSTRAINT "PK_8f09680a51bf3669c1598a21682" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_67c6c6236c69cf0173a8908348" ON "recipes" ("productId") `);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "manageStock" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_904370c093ceea4369659a3c810"`);
        await queryRunner.query(`ALTER TABLE "order_item" ALTER COLUMN "productId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ingredients" ADD CONSTRAINT "FK_fd66734071788b24b5a0fe9b950" FOREIGN KEY ("unitOfMeasureId") REFERENCES "unit_of_measures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recipe_items" ADD CONSTRAINT "FK_2c44770a9565be7ea9327b1a2ab" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recipe_items" ADD CONSTRAINT "FK_7e1edd294cc3ea5a86baa9a6bfd" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recipe_items" ADD CONSTRAINT "FK_37e2058d486c4001deebef1649b" FOREIGN KEY ("unitOfMeasureId") REFERENCES "unit_of_measures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recipes" ADD CONSTRAINT "FK_67c6c6236c69cf0173a89083485" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_904370c093ceea4369659a3c810" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_904370c093ceea4369659a3c810"`);
        await queryRunner.query(`ALTER TABLE "recipes" DROP CONSTRAINT "FK_67c6c6236c69cf0173a89083485"`);
        await queryRunner.query(`ALTER TABLE "recipe_items" DROP CONSTRAINT "FK_37e2058d486c4001deebef1649b"`);
        await queryRunner.query(`ALTER TABLE "recipe_items" DROP CONSTRAINT "FK_7e1edd294cc3ea5a86baa9a6bfd"`);
        await queryRunner.query(`ALTER TABLE "recipe_items" DROP CONSTRAINT "FK_2c44770a9565be7ea9327b1a2ab"`);
        await queryRunner.query(`ALTER TABLE "ingredients" DROP CONSTRAINT "FK_fd66734071788b24b5a0fe9b950"`);
        await queryRunner.query(`ALTER TABLE "order_item" ALTER COLUMN "productId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_904370c093ceea4369659a3c810" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "manageStock" SET DEFAULT true`);
        await queryRunner.query(`DROP INDEX "public"."IDX_67c6c6236c69cf0173a8908348"`);
        await queryRunner.query(`DROP TABLE "recipes"`);
        await queryRunner.query(`DROP TABLE "recipe_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a955029b22ff66ae9fef2e161f"`);
        await queryRunner.query(`DROP TABLE "ingredients"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5e36e2ddd28f901cc0fe6a39a1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ad0970ca0247cec3c63a2c0dd"`);
        await queryRunner.query(`DROP TABLE "unit_of_measures"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "manageStock" TO "isAvailable"`);
    }

}
