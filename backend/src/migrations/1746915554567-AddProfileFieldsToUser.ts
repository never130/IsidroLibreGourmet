import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddProfileFieldsToUser1746915554567 implements MigrationInterface {
    name = 'AddProfileFieldsToUser1746915554567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- User Profile Fields ---
        let userTable = await queryRunner.getTable("user");

        if (userTable && !userTable.findColumnByName("firstName")) {
            await queryRunner.addColumn("user", new TableColumn({
                name: "firstName",
                type: "character varying",
                isNullable: true,
            }));
            console.log("Columna 'firstName' agregada a la tabla 'user'.");
        } else {
            console.log("Columna 'firstName' ya existe en la tabla 'user' o la tabla 'user' no fue encontrada.");
        }

        userTable = await queryRunner.getTable("user"); // Re-fetch table schema
        if (userTable && !userTable.findColumnByName("lastName")) {
            await queryRunner.addColumn("user", new TableColumn({
                name: "lastName",
                type: "character varying",
                isNullable: true,
            }));
            console.log("Columna 'lastName' agregada a la tabla 'user'.");
        } else {
            console.log("Columna 'lastName' ya existe en la tabla 'user' o la tabla 'user' no fue encontrada.");
        }

        userTable = await queryRunner.getTable("user"); // Re-fetch table schema
        if (userTable && !userTable.findColumnByName("email")) {
            await queryRunner.addColumn("user", new TableColumn({
                name: "email",
                type: "character varying",
                isNullable: true, 
            }));
            console.log("Columna 'email' agregada a la tabla 'user'.");
        } else {
            console.log("Columna 'email' ya existe en la tabla 'user' o la tabla 'user' no fue encontrada.");
        }

        userTable = await queryRunner.getTable("user"); // Re-fetch table schema
        if (userTable && userTable.findColumnByName("email")) {
            const emailColumnIsUnique = userTable.uniques.some(uq => uq.columnNames.includes("email"));
            if (!emailColumnIsUnique) {
                await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")`);
                console.log("Restricción UNIQUE 'UQ_e12875dfb3b1d92d7d7c5377e22' agregada a la columna 'email'.");
            } else {
                console.log("Ya existe una restricción UNIQUE en la columna 'email'.");
            }
        } else {
            console.log("No se pudo agregar la restricción UNIQUE porque la columna 'email' no existe o la tabla 'user' no fue encontrada.");
        }

        // --- Order Payment Method Enum and Column ---
        const paymentEnumExistsResult = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_paymentmethod_enum')`);
        if (!paymentEnumExistsResult[0].exists) {
            await queryRunner.query(`CREATE TYPE "public"."order_paymentmethod_enum" AS ENUM('cash', 'credit_card', 'debit_card', 'transfer', 'other')`);
            console.log("Tipo Enum 'order_paymentmethod_enum' creado.");
        } else {
            console.log("Tipo Enum 'order_paymentmethod_enum' ya existe.");
        }

        const orderTable = await queryRunner.getTable("order");
        if (orderTable && !orderTable.findColumnByName("paymentMethod")) {
            // Asegurarse de que el tipo enum existe antes de agregar la columna
            const currentPaymentEnumExistsResult = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_paymentmethod_enum')`);
            if (currentPaymentEnumExistsResult[0].exists) {
                await queryRunner.query(`ALTER TABLE "order" ADD "paymentMethod" "public"."order_paymentmethod_enum" NOT NULL DEFAULT 'cash'`);
                console.log("Columna 'paymentMethod' agregada a la tabla 'order'.");
            } else {
                console.error("No se pudo agregar la columna 'paymentMethod' a 'order' porque el tipo 'order_paymentmethod_enum' no existe.");
            }
        } else {
            console.log("Columna 'paymentMethod' ya existe en la tabla 'order' o la tabla 'order' no fue encontrada.");
        }
        
        // --- User Role Enum Update ---
        // El objetivo es tener el enum: ('owner', 'admin', 'cashier', 'developer')
        const targetEnumValues = "{owner,admin,cashier,developer}";
        let currentEnumValuesQuery = await queryRunner.query(`SELECT enum_range(NULL::public.user_role_enum)::text AS values FROM pg_type WHERE typname = 'user_role_enum'`).catch(() => []);
        let currentEnumValues = currentEnumValuesQuery.length > 0 ? currentEnumValuesQuery[0].values : null;

        if (currentEnumValues === targetEnumValues) {
            console.log("'user_role_enum' ya está en el estado deseado.");
        } else {
            console.log(`'user_role_enum' actual: ${currentEnumValues}. Objetivo: ${targetEnumValues}. Procediendo con la actualización.`);
            
            const oldEnumExistsResult = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum_old')`);
            if (oldEnumExistsResult[0].exists) {
                console.warn("'user_role_enum_old' ya existe. Esto podría indicar una ejecución anterior fallida. Intentando limpiar y reintentar la secuencia de actualización del enum 'user_role_enum'.");
                // Intento de limpieza: si user_role_enum es el nuevo, y user_role_enum_old existe, dropear user_role_enum_old.
                // Si user_role_enum es el viejo (o no existe), y user_role_enum_old existe, renombrar user_role_enum_old a user_role_enum.
                // Esta lógica de recuperación puede ser compleja. Por ahora, se intentará la secuencia principal si el estado actual no es el objetivo.
                // Una opción más segura sería dropear 'user_role_enum_old' si el enum principal 'user_role_enum' ya tiene los valores correctos.
                // O si 'user_role_enum' no existe pero 'user_role_enum_old' sí, y 'user_role_enum_old' es el que queremos mantener temporalmente.
                // Simplificamos: si 'user_role_enum_old' existe y el enum principal no es el objetivo, se asume que podemos intentar dropearlo y recrear.
                 try {
                    await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);
                    console.log("Se eliminó 'user_role_enum_old' existente.");
                } catch (e) {
                    console.error("No se pudo eliminar 'user_role_enum_old':", (e instanceof Error ? e.message : String(e)));
                }
            }
            
            // Secuencia de actualización del enum (renombrar, crear nuevo, alterar columna, eliminar antiguo)
            try {
                const originalUserRoleEnumExists = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum')`);
                if(originalUserRoleEnumExists[0].exists){
                    await queryRunner.query(`ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"`);
                }
                await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('owner', 'admin', 'cashier', 'developer')`);
                
                const userTableForRole = await queryRunner.getTable("user");
                const roleColumn = userTableForRole?.findColumnByName("role");
                if (roleColumn) {
                    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
                    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum" USING "role"::"text"::"public"."user_role_enum"`);
                    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'cashier'`);
                }
                
                const oldEnumStillExistsResult = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum_old')`);
                if(oldEnumStillExistsResult[0].exists){
                    await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);
                }
                console.log("'user_role_enum' actualizado/creado exitosamente.");
            } catch (error) {
                console.error("Error durante la actualización de 'user_role_enum':", (error instanceof Error ? error.message : String(error)));
                console.error("El estado de 'user_role_enum' puede ser inconsistente. Se recomienda revisión manual.");
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // --- Reversing User Role Enum Update ---
        // El objetivo es volver a ENUM('owner', 'cashier', 'developer')
        console.log("Iniciando reversión de 'user_role_enum' (si es necesario).");
        const targetDownEnumValues = "{owner,cashier,developer}";
        let currentEnumValuesQuery = await queryRunner.query(`SELECT enum_range(NULL::public.user_role_enum)::text AS values FROM pg_type WHERE typname = 'user_role_enum'`).catch(() => []);
        let currentEnumValues = currentEnumValuesQuery.length > 0 ? currentEnumValuesQuery[0].values : null;

        if (currentEnumValues !== targetDownEnumValues && currentEnumValues !== null) {
            console.log(`'user_role_enum' actual: ${currentEnumValues}. Objetivo para down: ${targetDownEnumValues}. Procediendo con la reversión.`);
            try {
                const tempEnumNameForDown = "user_role_enum_temp_for_down_revert";
                const tempEnumExists = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${tempEnumNameForDown}')`);
                if (tempEnumExists[0].exists) await queryRunner.query(`DROP TYPE "public"."${tempEnumNameForDown}"`);

                await queryRunner.query(`ALTER TYPE "public"."user_role_enum" RENAME TO "${tempEnumNameForDown}"`);
                await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('owner', 'cashier', 'developer')`);
                
                const userTableForRole = await queryRunner.getTable("user");
                const roleColumn = userTableForRole?.findColumnByName("role");
                if (roleColumn) {
                    // Antes de cambiar el tipo, es crucial manejar los roles 'admin' existentes.
                    // Por ejemplo, actualizarlos a 'cashier' o NULL si la nueva definición no los incluye.
                    console.log("Actualizando roles 'admin' existentes a 'cashier' antes de revertir el tipo enum.");
                    await queryRunner.query(`UPDATE "user" SET "role" = 'cashier' WHERE "role"::"text" = 'admin'`);

                    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
                    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum" USING "role"::"text"::"public"."user_role_enum"`);
                    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'cashier'`); // Asumiendo que este era el default anterior
                }
                await queryRunner.query(`DROP TYPE "public"."${tempEnumNameForDown}"`);
                console.log("'user_role_enum' revertido exitosamente.");
            } catch (error) {
                 console.error("Error durante la reversión de 'user_role_enum':", (error instanceof Error ? error.message : String(error)));
                 console.error("El estado de 'user_role_enum' puede ser inconsistente tras el error en down. Se recomienda revisión manual.");
            }
        } else {
            console.log("'user_role_enum' ya está en el estado esperado para down o no existe. No se realizan cambios en el enum.");
        }

        // --- Reversing Order Payment Method ---
        console.log("Iniciando reversión de 'paymentMethod' y 'order_paymentmethod_enum'.");
        const orderTable = await queryRunner.getTable("order");
        if (orderTable && orderTable.findColumnByName("paymentMethod")) {
            await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "paymentMethod"`);
            console.log("Columna 'paymentMethod' eliminada de la tabla 'order'.");
        } else {
            console.log("Columna 'paymentMethod' no existe en 'order' o tabla no encontrada.");
        }

        const paymentEnumExistsResult = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_paymentmethod_enum')`);
        if (paymentEnumExistsResult[0].exists) {
            await queryRunner.query(`DROP TYPE "public"."order_paymentmethod_enum"`);
            console.log("Tipo Enum 'order_paymentmethod_enum' eliminado.");
        } else {
            console.log("Tipo Enum 'order_paymentmethod_enum' no existe.");
        }

        // --- Reversing User Profile Fields ---
        console.log("Iniciando reversión de campos de perfil de usuario y restricciones.");
        let userTable = await queryRunner.getTable("user");
        if (userTable) {
            const uniqueConstraintOnEmail = userTable.uniques.find(uq => uq.columnNames.includes("email"));
            if (uniqueConstraintOnEmail) {
                 // Intentar eliminar por el nombre conocido primero, luego por cualquier restricción en la columna
                try {
                    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"`);
                    console.log("Restricción UNIQUE 'UQ_e12875dfb3b1d92d7d7c5377e22' eliminada.");
                } catch (e) {
                    // Si falla por nombre (puede haber sido renombrada o no ser ese nombre exacto)
                    // E TypeORM getTable().uniques no siempre tiene el nombre correcto o puede ser null
                    console.warn("No se pudo eliminar la restricción UNIQUE por nombre 'UQ_e12875dfb3b1d92d7d7c5377e22'. Verificando si existe otra en 'email'.");
                    if (uniqueConstraintOnEmail.name) {
                         await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "${uniqueConstraintOnEmail.name}"`);
                         console.log(`Restricción UNIQUE '${uniqueConstraintOnEmail.name}' en 'email' eliminada.`);
                    } else {
                        // Si no hay nombre, es más difícil. Este caso es menos probable con constraints creados explícitamente con nombre.
                        console.warn("No se pudo determinar el nombre de la restricción UNIQUE en 'email' para eliminarla.");
                    }
                }
            } else {
                console.log("No se encontró restricción UNIQUE en la columna 'email'.");
            }

            if (userTable.findColumnByName("email")) {
                await queryRunner.dropColumn("user", "email");
                console.log("Columna 'email' eliminada de 'user'.");
            } else {
                console.log("Columna 'email' no existe en 'user'.");
            }

            userTable = await queryRunner.getTable("user"); // Re-fetch
            if (userTable && userTable.findColumnByName("lastName")) {
                await queryRunner.dropColumn("user", "lastName");
                console.log("Columna 'lastName' eliminada de 'user'.");
            } else {
                console.log("Columna 'lastName' no existe en 'user'.");
            }
            
            userTable = await queryRunner.getTable("user"); // Re-fetch
            if (userTable && userTable.findColumnByName("firstName")) {
                await queryRunner.dropColumn("user", "firstName");
                console.log("Columna 'firstName' eliminada de 'user'.");
            } else {
                console.log("Columna 'firstName' no existe en 'user'.");
            }
        } else {
            console.log("Tabla 'user' no encontrada, no se realizan operaciones de eliminación de columnas/restricciones.");
        }
    }
}
