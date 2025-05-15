import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from "typeorm";

export class InventoryRecipeChanges1747009324317 implements MigrationInterface {
    name = 'InventoryRecipeChanges1747009324317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Comentado: La entidad Product.ts ya define 'manageStock'. Renombrar 'isAvailable' no es necesario o causará error si no existe.
        // await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "isAvailable" TO "manageStock"`); 

        // --- unit_of_measures ---
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "unit_of_measures" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, "symbol" character varying(10) NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e875eebb54ac0b74160345926d3" PRIMARY KEY ("id"))`);
        
        let idxExists = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'IDX_1ad0970ca0247cec3c63a2c0dd' AND n.nspname = 'public') as "exists";`);
        if (!idxExists[0].exists) {
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1ad0970ca0247cec3c63a2c0dd" ON "unit_of_measures" ("name") `);
        }

        idxExists = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'IDX_5e36e2ddd28f901cc0fe6a39a1' AND n.nspname = 'public') as "exists";`);
        if (!idxExists[0].exists) {
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5e36e2ddd28f901cc0fe6a39a1" ON "unit_of_measures" ("symbol") `);
        }

        // --- ingredients ---
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "ingredients" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "stock" numeric(10,3) NOT NULL DEFAULT '0', "unitOfMeasureId" integer NOT NULL, "lowStockThreshold" numeric(10,3), "cost" numeric(10,4), "supplier" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9240185c8a5507251c9f15e0649" PRIMARY KEY ("id"))`);
        
        idxExists = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'IDX_a955029b22ff66ae9fef2e161f' AND n.nspname = 'public') as "exists";`);
        if (!idxExists[0].exists) {
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a955029b22ff66ae9fef2e161f" ON "ingredients" ("name") `);
        }

        // --- recipe_items ---
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "recipe_items" ("id" SERIAL NOT NULL, "recipeId" integer NOT NULL, "ingredientId" integer NOT NULL, "quantity" numeric(10,3) NOT NULL, "unitOfMeasureId" integer NOT NULL, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_daec78e42198e9c42e1fed60eec" PRIMARY KEY ("id"))`);
        
        // --- recipes ---
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "recipes" ("id" SERIAL NOT NULL, "productId" integer NOT NULL, "name" character varying(255) DEFAULT 'Receta Estándar', "description" text, "estimatedCost" numeric(10,2), "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_67c6c6236c69cf0173a8908348" UNIQUE ("productId"), CONSTRAINT "PK_8f09680a51bf3669c1598a21682" PRIMARY KEY ("id"))`);

        idxExists = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'IDX_67c6c6236c69cf0173a8908348' AND n.nspname = 'public') as "exists";`);
        if (!idxExists[0].exists) {
            // Este índice se crea para la restricción UNIQUE "REL_67c6c6236c69cf0173a8908348" en productId
            // Si la restricción ya existe (lo que implica que el índice existe), no necesitamos crearlo explícitamente.
            // La creación de la tabla con CONSTRAINT ... UNIQUE ya maneja esto.
            // Sin embargo, si la tabla se creó sin la constraint y luego queremos añadirla, el índice es necesario.
            // Por seguridad, y dado que la constraint unique en la tabla ya debería crearlo, esta línea puede ser redundante
            // si CREATE TABLE IF NOT EXISTS no ejecuta la parte de la constraint si la tabla ya existía.
            // Si la tabla existía PERO SIN la constraint unique, entonces sí necesitaríamos crear el índice y la constraint.
            // TypeORM usualmente maneja esto bien, pero en migraciones manuales es más complejo.
            // Dejamos la creación explícita del índice por si la constraint unique no se aplicó en un CREATE TABLE IF NOT EXISTS anterior.
            await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_67c6c6236c69cf0173a8908348" ON "recipes" ("productId") `);
        }
        
        // --- Modificaciones y FKs ---
        // Para estas operaciones, asumimos que las tablas base ya existen (o fueron creadas arriba)
        // Hacer que ALTER TABLE sea idempotente es más complejo (requiere verificar el estado actual de la columna/constraint)
        // Por ahora, se mantienen como están, pero si fallan, sabremos que es porque la operación ya se aplicó.

        const productsTable = await queryRunner.getTable('products');
        if (productsTable) {
            const manageStockColumn = productsTable.findColumnByName('manageStock');
            // Solo alterar si la columna existe y su default no es ya false
            if (manageStockColumn && manageStockColumn.default !== false && manageStockColumn.default !== 'false') {
                 await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "manageStock" SET DEFAULT false`);
                 console.log("Columna 'manageStock' en 'products' default establecido a false.");
            } else if (manageStockColumn) {
                console.log("Columna 'manageStock' en 'products' ya tiene default false o no tiene default modificable aquí.");
            }
        }
        
        // Idempotencia para DROP y ADD de FK en order_item
        const orderItemTable = await queryRunner.getTable('order_item');
        if (orderItemTable) {
            const fkOrderItemProductExists = await queryRunner.query(`
                SELECT constraint_name FROM information_schema.table_constraints 
                WHERE table_name = 'order_item' AND constraint_name = 'FK_904370c093ceea4369659a3c810' 
                AND constraint_type = 'FOREIGN KEY' AND table_schema = current_schema();`);

            if (fkOrderItemProductExists.length > 0) {
                await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_904370c093ceea4369659a3c810"`);
                console.log("FK 'FK_904370c093ceea4369659a3c810' en 'order_item' eliminada para recreación.");
            }
            
            const productIdColumn = orderItemTable.findColumnByName('productId');
            if (productIdColumn && productIdColumn.isNullable) {
                await queryRunner.query(`ALTER TABLE "order_item" ALTER COLUMN "productId" SET NOT NULL`);
                console.log("Columna 'productId' en 'order_item' establecida como NOT NULL.");
            }
            
            const newFkExistsCheck = await queryRunner.query(`
                SELECT constraint_name FROM information_schema.table_constraints 
                WHERE table_name = 'order_item' AND constraint_name = 'FK_904370c093ceea4369659a3c810' 
                AND constraint_type = 'FOREIGN KEY' AND table_schema = current_schema();`);

            if (newFkExistsCheck.length === 0) {
                await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_904370c093ceea4369659a3c810" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
                console.log("FK 'FK_904370c093ceea4369659a3c810' en 'order_item' añadida/recreada.");
            } else {
                 console.log("FK 'FK_904370c093ceea4369659a3c810' en 'order_item' ya existía tras el intento de drop.");
            }
        }


        // Ingredients FKs
        const ingredientsTable = await queryRunner.getTable('ingredients');
        if (ingredientsTable) {
            // Asegurar una unidad de medida por defecto
            await queryRunner.query(`
                INSERT INTO "unit_of_measures" ("name", "symbol", "description") 
                VALUES ('Unidad', 'u', 'Unidad estándar para items sin otra especificación') 
                ON CONFLICT ("name") DO NOTHING;
            `);
            await queryRunner.query(`
                INSERT INTO "unit_of_measures" ("name", "symbol", "description") 
                VALUES ('Gramo', 'g', 'Unidad de peso estándar') 
                ON CONFLICT ("name") DO NOTHING;
            `);
            // Obtener el ID de la unidad de medida 'Unidad' (o la primera si 'Unidad' no existe por alguna razón)
            let defaultUOMResult = await queryRunner.query(`SELECT id FROM "unit_of_measures" WHERE name = 'Unidad' LIMIT 1;`);
            if (defaultUOMResult.length === 0) { // Fallback si 'Unidad' no se insertó o encontró
                defaultUOMResult = await queryRunner.query(`SELECT id FROM "unit_of_measures" LIMIT 1;`);
            }
            
            if (defaultUOMResult.length === 0) {
                console.error("ERROR CRÍTICO: No se pudo encontrar/insertar una unidad de medida por defecto. No se puede continuar con la FK de ingredients.");
                // Considerar lanzar un error aquí para detener la migración si esto es crítico.
            } else {
                const defaultUOMId = defaultUOMResult[0].id;
                console.log(`Usando default UOM ID: ${defaultUOMId}`);

                let unitOfMeasureIdCol = ingredientsTable.findColumnByName('unitOfMeasureId');
                if (!unitOfMeasureIdCol) {
                    console.log("Columna 'unitOfMeasureId' no encontrada en 'ingredients', intentando añadirla.");
                    await queryRunner.query(`ALTER TABLE "ingredients" ADD COLUMN "unitOfMeasureId" integer`);
                    console.log("Columna 'unitOfMeasureId' añadida a 'ingredients'.");
                    // Recargar la tabla para obtener la nueva columna
                    const updatedIngredientsTable = await queryRunner.getTable('ingredients');
                    if (updatedIngredientsTable) {
                        unitOfMeasureIdCol = updatedIngredientsTable.findColumnByName('unitOfMeasureId');
                    }
                }

                // Actualizar NULLs ANTES de intentar SET NOT NULL
                if (unitOfMeasureIdCol) { // Si la columna existe (recién añadida o ya existente)
                    console.log(`Actualizando NULLs en ingredients.unitOfMeasureId a ${defaultUOMId}...`);
                    await queryRunner.query(`UPDATE "ingredients" SET "unitOfMeasureId" = ${defaultUOMId} WHERE "unitOfMeasureId" IS NULL`);
                    console.log("Actualización de NULLs completada.");
                }


                if (unitOfMeasureIdCol && unitOfMeasureIdCol.isNullable) {
                    try {
                        await queryRunner.query(`ALTER TABLE "ingredients" ALTER COLUMN "unitOfMeasureId" SET NOT NULL`);
                        console.log("Columna 'unitOfMeasureId' en 'ingredients' establecida como NOT NULL.");
                    } catch (e) {
                        console.error(`ERROR al intentar SET NOT NULL en ingredients.unitOfMeasureId: ${(e as Error).message}.`);
                        // Si esto falla incluso después de la actualización, es un problema inesperado.
                    }
                } else if (unitOfMeasureIdCol && !unitOfMeasureIdCol.isNullable) {
                    console.log("Columna 'unitOfMeasureId' en 'ingredients' ya es NOT NULL o no existe para modificar.");
                } else if (!unitOfMeasureIdCol) {
                     console.error("ERROR CRÍTICO: La columna 'unitOfMeasureId' no se pudo añadir o encontrar en 'ingredients' después del intento de ADD COLUMN.");
                }
                
                const fkIngredientsUomExists = await queryRunner.query(`
                    SELECT constraint_name FROM information_schema.table_constraints 
                    WHERE table_name = 'ingredients' AND constraint_name = 'FK_fd66734071788b24b5a0fe9b950' 
                    AND constraint_type = 'FOREIGN KEY' AND table_schema = current_schema();`);

                // Solo intentar añadir si la columna existe y no es nullable (o el SET NOT NULL tuvo éxito)
                const finalIngredientsTable = await queryRunner.getTable('ingredients');
                const finalUnitOfMeasureIdCol = finalIngredientsTable?.findColumnByName('unitOfMeasureId');

                if (fkIngredientsUomExists.length === 0 && finalUnitOfMeasureIdCol && !finalUnitOfMeasureIdCol.isNullable) { 
                     await queryRunner.query(`ALTER TABLE "ingredients" ADD CONSTRAINT "FK_fd66734071788b24b5a0fe9b950" FOREIGN KEY ("unitOfMeasureId") REFERENCES "unit_of_measures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
                     console.log("FK 'FK_fd66734071788b24b5a0fe9b950' (ingredients -> unit_of_measures) añadida.");
                } else if (fkIngredientsUomExists.length > 0) {
                    console.log("FK 'FK_fd66734071788b24b5a0fe9b950' (ingredients -> unit_of_measures) ya existe.");
                } else {
                    console.warn("No se añadió FK para ingredients.unitOfMeasureId porque la columna no está presente o es nullable.");
                }
            }
        } else {
            console.warn("Tabla 'ingredients' no encontrada, no se pudo añadir FK para unitOfMeasureId.");
        }

        // RecipeItems FKs
        const recipeItemsTable = await queryRunner.getTable('recipe_items');
        if (recipeItemsTable) {
            // FK recipe_items -> recipes
            const fkRecipeItemsToRecipes = await queryRunner.query(`
                SELECT constraint_name FROM information_schema.table_constraints 
                WHERE table_name = 'recipe_items' AND constraint_name = 'FK_2c44770a9565be7ea9327b1a2ab' 
                AND constraint_type = 'FOREIGN KEY' AND table_schema = current_schema();`);
            if (fkRecipeItemsToRecipes.length === 0) {
                await queryRunner.query(`ALTER TABLE "recipe_items" ADD CONSTRAINT "FK_2c44770a9565be7ea9327b1a2ab" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
                console.log("FK 'FK_2c44770a9565be7ea9327b1a2ab' (recipe_items -> recipes) añadida.");
            } else {
                console.log("FK 'FK_2c44770a9565be7ea9327b1a2ab' (recipe_items -> recipes) ya existe.");
            }

            // FK recipe_items -> ingredients
            const fkRecipeItemsToIngredients = await queryRunner.query(`
                SELECT constraint_name FROM information_schema.table_constraints 
                WHERE table_name = 'recipe_items' AND constraint_name = 'FK_7e1edd294cc3ea5a86baa9a6bfd' 
                AND constraint_type = 'FOREIGN KEY' AND table_schema = current_schema();`);
            if (fkRecipeItemsToIngredients.length === 0) {
                await queryRunner.query(`ALTER TABLE "recipe_items" ADD CONSTRAINT "FK_7e1edd294cc3ea5a86baa9a6bfd" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
                console.log("FK 'FK_7e1edd294cc3ea5a86baa9a6bfd' (recipe_items -> ingredients) añadida.");
            } else {
                console.log("FK 'FK_7e1edd294cc3ea5a86baa9a6bfd' (recipe_items -> ingredients) ya existe.");
            }

            // FK recipe_items -> unit_of_measures
            // Primero, asegurar que la columna unitOfMeasureId exista y tenga valores válidos.
            // Reutilizamos la lógica de defaultUOMId de la sección de ingredients.
            let defaultUOMRecipeItemResult = await queryRunner.query(`SELECT id FROM "unit_of_measures" WHERE name = 'Unidad' LIMIT 1;`);
            if (defaultUOMRecipeItemResult.length === 0) {
                defaultUOMRecipeItemResult = await queryRunner.query(`SELECT id FROM "unit_of_measures" LIMIT 1;`);
            }

            if (defaultUOMRecipeItemResult.length === 0) {
                console.error("ERROR CRÍTICO: No se pudo encontrar/insertar una unidad de medida por defecto. No se puede continuar con la FK de recipe_items.unitOfMeasureId.");
            } else {
                const defaultUOMIdForRecipeItem = defaultUOMRecipeItemResult[0].id;
                console.log(`Usando default UOM ID para recipe_items: ${defaultUOMIdForRecipeItem}`);

                let recipeItemUnitOfMeasureIdCol = recipeItemsTable.findColumnByName('unitOfMeasureId');
                if (!recipeItemUnitOfMeasureIdCol) {
                    console.log("Columna 'unitOfMeasureId' no encontrada en 'recipe_items', intentando añadirla.");
                    await queryRunner.query(`ALTER TABLE "recipe_items" ADD COLUMN "unitOfMeasureId" integer`);
                    console.log("Columna 'unitOfMeasureId' añadida a 'recipe_items'.");
                    // Recargar la tabla para obtener la nueva columna
                    const updatedRecipeItemsTable = await queryRunner.getTable('recipe_items');
                    if (updatedRecipeItemsTable) {
                        recipeItemUnitOfMeasureIdCol = updatedRecipeItemsTable.findColumnByName('unitOfMeasureId');
                    }
                }

                if (recipeItemUnitOfMeasureIdCol) {
                    console.log(`Actualizando NULLs en recipe_items.unitOfMeasureId a ${defaultUOMIdForRecipeItem}...`);
                    await queryRunner.query(`UPDATE "recipe_items" SET "unitOfMeasureId" = ${defaultUOMIdForRecipeItem} WHERE "unitOfMeasureId" IS NULL`);
                    console.log("Actualización de NULLs en recipe_items.unitOfMeasureId completada.");
                }

                if (recipeItemUnitOfMeasureIdCol && recipeItemUnitOfMeasureIdCol.isNullable) {
                    try {
                        await queryRunner.query(`ALTER TABLE "recipe_items" ALTER COLUMN "unitOfMeasureId" SET NOT NULL`);
                        console.log("Columna 'unitOfMeasureId' en 'recipe_items' establecida como NOT NULL.");
                    } catch (e) {
                        console.error(`ERROR al intentar SET NOT NULL en recipe_items.unitOfMeasureId: ${(e as Error).message}.`);
                    }
                } else if (recipeItemUnitOfMeasureIdCol && !recipeItemUnitOfMeasureIdCol.isNullable) {
                    console.log("Columna 'unitOfMeasureId' en 'recipe_items' ya es NOT NULL o no existe para modificar.");
                } else if (!recipeItemUnitOfMeasureIdCol) {
                    console.error("ERROR CRÍTICO: La columna 'unitOfMeasureId' no se pudo añadir o encontrar en 'recipe_items' después del intento de ADD COLUMN.");
                }
                
                const fkRecipeItemsToUomExists = await queryRunner.query(`
                    SELECT constraint_name FROM information_schema.table_constraints 
                    WHERE table_name = 'recipe_items' AND constraint_name = 'FK_37e2058d486c4001deebef1649b' 
                    AND constraint_type = 'FOREIGN KEY' AND table_schema = current_schema();`);

                const finalRecipeItemsTable = await queryRunner.getTable('recipe_items'); // Re-fetch table info
                const finalRecipeItemUnitOfMeasureIdCol = finalRecipeItemsTable?.findColumnByName('unitOfMeasureId');

                if (fkRecipeItemsToUomExists.length === 0 && finalRecipeItemUnitOfMeasureIdCol && !finalRecipeItemUnitOfMeasureIdCol.isNullable) {
                    await queryRunner.query(`ALTER TABLE "recipe_items" ADD CONSTRAINT "FK_37e2058d486c4001deebef1649b" FOREIGN KEY ("unitOfMeasureId") REFERENCES "unit_of_measures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
                    console.log("FK 'FK_37e2058d486c4001deebef1649b' (recipe_items -> unit_of_measures) añadida.");
                } else if (fkRecipeItemsToUomExists.length > 0) {
                    console.log("FK 'FK_37e2058d486c4001deebef1649b' (recipe_items -> unit_of_measures) ya existe.");
                } else {
                    console.warn("No se añadió FK para recipe_items.unitOfMeasureId porque la columna no está presente, es nullable o la FK ya existe.");
                }
            }
        } else {
            console.warn("Tabla 'recipe_items' no encontrada, no se pudieron procesar sus FKs para unitOfMeasureId.");
        }
        
        // Recipes FK
        const recipesTable = await queryRunner.getTable('recipes');
        if (recipesTable) {
            const fkRecipesToProducts = await queryRunner.query(`
                SELECT constraint_name FROM information_schema.table_constraints 
                WHERE table_name = 'recipes' AND constraint_name = 'FK_67c6c6236c69cf0173a89083485' 
                AND constraint_type = 'FOREIGN KEY' AND table_schema = current_schema();`);
            if (fkRecipesToProducts.length === 0) {
                await queryRunner.query(`ALTER TABLE "recipes" ADD CONSTRAINT "FK_67c6c6236c69cf0173a89083485" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
                console.log("FK 'FK_67c6c6236c69cf0173a89083485' (recipes -> products) añadida.");
            } else {
                 console.log("FK 'FK_67c6c6236c69cf0173a89083485' (recipes -> products) ya existe.");
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // El método down es más complejo de hacer completamente idempotente si las operaciones de 'up' fueron parciales.
        // Se asume que si 'up' se ejecutó, estas estructuras existen.
        // Por simplicidad, se mantienen los drops directos, pero con try-catch para evitar errores si algo ya no existe.

        const dropForeignKeyIfExists = async (tableName: string, constraintName: string) => {
            const fkExists = await queryRunner.query(`SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = '${tableName}' AND constraint_name = '${constraintName}' AND constraint_type = 'FOREIGN KEY';`);
            if (fkExists.length > 0) {
                await queryRunner.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT "${constraintName}"`);
            }
        };

        await dropForeignKeyIfExists("order_item", "FK_904370c093ceea4369659a3c810");
        await dropForeignKeyIfExists("recipes", "FK_67c6c6236c69cf0173a89083485");
        await dropForeignKeyIfExists("recipe_items", "FK_37e2058d486c4001deebef1649b");
        await dropForeignKeyIfExists("recipe_items", "FK_7e1edd294cc3ea5a86baa9a6bfd");
        await dropForeignKeyIfExists("recipe_items", "FK_2c44770a9565be7ea9327b1a2ab");
        await dropForeignKeyIfExists("ingredients", "FK_fd66734071788b24b5a0fe9b950");

        const orderItemTable = await queryRunner.getTable('order_item');
        if (orderItemTable) {
            const productIdColumn = orderItemTable.findColumnByName('productId');
            if (productIdColumn && !productIdColumn.isNullable) { // Si no es nullable (es decir, es NOT NULL)
                 await queryRunner.query(`ALTER TABLE "order_item" ALTER COLUMN "productId" DROP NOT NULL`);
            }
            // Re-añadir la FK original si fue eliminada y la columna ahora es nullable.
            // Esto es parte de la lógica original del down y puede ser redundante si la FK ya fue dropeada arriba.
            // Considerar si esta FK específica debe ser recreada o si dropForeignKeyIfExists es suficiente.
            // await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_904370c093ceea4369659a3c810" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
        
        const productsTable = await queryRunner.getTable('products');
        if (productsTable) {
            const manageStockColumn = productsTable.findColumnByName('manageStock');
            if (manageStockColumn && manageStockColumn.default !== 'true') {
                await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "manageStock" SET DEFAULT true`);
            }
        }

        const dropIndexIfExists = async (indexName: string, tableName?: string) => {
            // El nombre del índice puede o no estar cualificado con el esquema en pg_class.nspname
            // Por simplicidad, intentamos dropearlo si existe en el esquema public
            const idxExistsResult = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = '${indexName}' AND n.nspname = 'public') as "exists";`);
            if (idxExistsResult[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."${indexName}"`);
            }
        };
        
        await dropIndexIfExists("IDX_67c6c6236c69cf0173a8908348", "recipes"); // Index for recipes.productId UNIQUE
        await queryRunner.query(`DROP TABLE IF EXISTS "recipes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "recipe_items"`);
        await dropIndexIfExists("IDX_a955029b22ff66ae9fef2e161f", "ingredients"); // Index for ingredients.name UNIQUE
        await queryRunner.query(`DROP TABLE IF EXISTS "ingredients"`);
        await dropIndexIfExists("IDX_5e36e2ddd28f901cc0fe6a39a1", "unit_of_measures"); // Index for unit_of_measures.symbol UNIQUE
        await dropIndexIfExists("IDX_1ad0970ca0247cec3c63a2c0dd", "unit_of_measures"); // Index for unit_of_measures.name UNIQUE
        await queryRunner.query(`DROP TABLE IF EXISTS "unit_of_measures"`);
        
        // await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "manageStock" TO "isAvailable"`);
    }

}
