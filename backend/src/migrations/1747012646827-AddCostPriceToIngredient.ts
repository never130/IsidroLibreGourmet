import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCostPriceToIngredient1747012646827 implements MigrationInterface {
    name = 'AddCostPriceToIngredient1747012646827'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ya no se renombrará 'products.isAvailable' a 'manageStock' aquí.
        // Ya no se crearán tablas: unit_of_measures, ingredients, recipe_items, recipes aquí.
        // Ya no se crearán índices ni FKs aquí.

        // Solo añadir la columna costPrice a la tabla ingredients si no existe
        const ingredientsTable = await queryRunner.getTable("ingredients");
        if (ingredientsTable && !ingredientsTable.findColumnByName("costPrice")) {
            await queryRunner.query(`ALTER TABLE "ingredients" ADD "costPrice" numeric(10,2)`);
            console.log("Columna 'costPrice' agregada a la tabla 'ingredients' por la migración AddCostPriceToIngredient.");
        } else {
            console.log("Columna 'costPrice' ya existe en 'ingredients' o tabla no encontrada. Migración AddCostPriceToIngredient no realizó cambios en la columna.");
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Ya no se revertirá el renombrado de 'products.manageStock' a 'isAvailable' aquí.
        // Ya no se eliminarán tablas: unit_of_measures, ingredients, recipe_items, recipes aquí.
        // Ya no se eliminarán FKs ni índices aquí.

        // Solo eliminar la columna costPrice si existe
        const ingredientsTable = await queryRunner.getTable("ingredients");
        if (ingredientsTable && ingredientsTable.findColumnByName("costPrice")) {
            await queryRunner.query(`ALTER TABLE "ingredients" DROP COLUMN "costPrice"`);
            console.log("Columna 'costPrice' eliminada de la tabla 'ingredients' por la migración AddCostPriceToIngredient.");
        } else {
            console.log("Columna 'costPrice' no existe en 'ingredients' o tabla no encontrada. Migración AddCostPriceToIngredient no intentó eliminarla.");
        }
    }

}
