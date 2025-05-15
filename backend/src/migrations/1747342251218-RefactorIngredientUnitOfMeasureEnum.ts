import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class RefactorIngredientUnitOfMeasureEnum1747342251218 implements MigrationInterface {
    name = 'RefactorIngredientUnitOfMeasureEnum1747342251218'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- Para la tabla 'ingredients' ---

        // 1. Eliminar la FK y la columna unitOfMeasureId
        // Primero verificar si la FK existe antes de intentar eliminarla
        const ingredientsTable = await queryRunner.getTable("ingredients");
        const fkName = "FK_fd66734071788b24b5a0fe9b950";
        if (ingredientsTable?.foreignKeys.find(fk => fk.name === fkName)) {
            await queryRunner.query(`ALTER TABLE "ingredients" DROP CONSTRAINT "${fkName}"`);
        }
        
        const unitOfMeasureIdColumn = ingredientsTable?.findColumnByName("unitOfMeasureId");
        if (unitOfMeasureIdColumn) {
            await queryRunner.query(`ALTER TABLE "ingredients" DROP COLUMN "unitOfMeasureId"`);
        }

        // 2. Manejar la columna 'unitOfMeasure' existente o crearla como enum
        const enumName = "public.ingredients_unitofmeasure_enum"; // Nombre del tipo enum en PostgreSQL
        const enumValues = ['Gramos (gr)', 'Kilogramos (kg)', 'Mililitros (ml)', 'Litros (L)', 'Unidad(es)', 'Cucharadita(s)', 'Cucharada(s)', 'Taza(s)', 'Pizca(s)', 'Otro'];
        
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumName.split('.')[1]}') THEN
                    CREATE TYPE "${enumName}" AS ENUM(${enumValues.map(v => `'${v}'`).join(', ')});
                END IF;
            END $$;
        `);

        const unitOfMeasureColumnExists = ingredientsTable?.findColumnByName("unitOfMeasure");

        if (unitOfMeasureColumnExists) {
            // Si existe, intentamos alterar su tipo al enum y configurarla.
            // Es posible que necesitemos eliminar el default existente si es incompatible.
            try {
                await queryRunner.query(`ALTER TABLE "ingredients" ALTER COLUMN "unitOfMeasure" DROP DEFAULT`);
            } catch (e) {
                // Ignorar error si el default no existe
            }
            await queryRunner.query(`ALTER TABLE "ingredients" ALTER COLUMN "unitOfMeasure" TYPE ${enumName} USING "unitOfMeasure"::text::${enumName}`);
            await queryRunner.query(`ALTER TABLE "ingredients" ALTER COLUMN "unitOfMeasure" SET NOT NULL`);
            await queryRunner.query(`ALTER TABLE "ingredients" ALTER COLUMN "unitOfMeasure" SET DEFAULT 'Unidad(es)'`);
        } else {
            // Si no existe, la añadimos con el tipo enum correcto.
            await queryRunner.query(`ALTER TABLE "ingredients" ADD "unitOfMeasure" ${enumName} NOT NULL DEFAULT 'Unidad(es)'`);
        }
        
        // --- Operaciones originales para 'recipe_items' (se mantienen como estaban) ---
        const recipeItemsTable = await queryRunner.getTable("recipe_items");
        const recipeItemFkName = "FK_37e2058d486c4001deebef1649b";
        if (recipeItemsTable?.foreignKeys.find(fk => fk.name === recipeItemFkName)) {
            await queryRunner.query(`ALTER TABLE "recipe_items" DROP CONSTRAINT "${recipeItemFkName}"`);
        }
        const recipeItemUnitOfMeasureIdColumn = recipeItemsTable?.findColumnByName("unitOfMeasureId");
        if (recipeItemUnitOfMeasureIdColumn) {
            await queryRunner.query(`ALTER TABLE "recipe_items" DROP COLUMN "unitOfMeasureId"`);
        }

        // --- Cambio original en 'products' (se mantiene como estaba) ---
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "manageStock" SET DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir el cambio en 'products'
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "manageStock" SET DEFAULT false`);

        // Revertir 'recipe_items' (como estaba en el original)
        await queryRunner.query(`ALTER TABLE "recipe_items" ADD "unitOfMeasureId" integer`); // Asume NOT NULL implicitamente por la FK luego
        // Para hacerla NOT NULL explícitamente: await queryRunner.query(`ALTER TABLE "recipe_items" ALTER COLUMN "unitOfMeasureId" SET NOT NULL`);
        // Sin embargo, la FK la hará NOT NULL si la FK de la tabla referenciada es PK.
        // El original tenía NOT NULL en la columna de la FK.

        // Revertir 'ingredients'
        // Primero, la columna unitOfMeasureId
        await queryRunner.query(`ALTER TABLE "ingredients" ADD "unitOfMeasureId" integer`);
        // await queryRunner.query(`ALTER TABLE "ingredients" ALTER COLUMN "unitOfMeasureId" SET NOT NULL`);


        // Re-crear FKs (como estaba en el original, asumiendo que la tabla unit_of_measures y su pk 'id' existen)
        // Es importante que la tabla 'unit_of_measures' exista para que esto funcione.
        // También, las columnas 'unitOfMeasureId' deben existir antes de añadir las FKs.
        
        // Solo añadir FK si la tabla unit_of_measures existe
        const unitOfMeasuresTable = await queryRunner.getTable("unit_of_measures");
        if (unitOfMeasuresTable) {
             await queryRunner.query(`ALTER TABLE "recipe_items" ADD CONSTRAINT "FK_37e2058d486c4001deebef1649b" FOREIGN KEY ("unitOfMeasureId") REFERENCES "unit_of_measures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
             await queryRunner.query(`ALTER TABLE "ingredients" ADD CONSTRAINT "FK_fd66734071788b24b5a0fe9b950" FOREIGN KEY ("unitOfMeasureId") REFERENCES "unit_of_measures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        } else {
            console.warn("Tabla 'unit_of_measures' no encontrada, no se pueden recrear las FKs en el método down.");
        }


        // Revertir la columna 'unitOfMeasure' en 'ingredients' a un tipo genérico (ej. varchar)
        // y eliminar el tipo enum si ya no se necesita (con cuidado, podría ser usado por otras tablas)
        await queryRunner.query(`ALTER TABLE "ingredients" ALTER COLUMN "unitOfMeasure" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ingredients" ALTER COLUMN "unitOfMeasure" TYPE character varying(255)`); // O el tipo que era antes
        // Opcionalmente, eliminar el tipo enum (SOLO SI ESTÁS SEGURO QUE NO SE USA EN NINGÚN OTRO LADO)
        // await queryRunner.query(`DROP TYPE IF EXISTS "public.ingredients_unitofmeasure_enum"`);


        // El down original también hacía recipe_items.unitOfMeasureId NOT NULL explícitamente.
        // Si unit_of_measures.id es PK, la FK podría ya implicar NOT NULL.
        // Por seguridad, si el original lo tenía, lo ponemos:
        const recipeItemsTable = await queryRunner.getTable("recipe_items");
        if (recipeItemsTable?.findColumnByName("unitOfMeasureId")){ //Solo si la columna existe
             await queryRunner.query(`ALTER TABLE "recipe_items" ALTER COLUMN "unitOfMeasureId" SET NOT NULL`);
        }
        const ingredientsTable = await queryRunner.getTable("ingredients");
        if (ingredientsTable?.findColumnByName("unitOfMeasureId")){ //Solo si la columna existe
             await queryRunner.query(`ALTER TABLE "ingredients" ALTER COLUMN "unitOfMeasureId" SET NOT NULL`);
        }
    }
}
