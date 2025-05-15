import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotesToOrderTable1746933807739 implements MigrationInterface {
    name = 'AddNotesToOrderTable1746933807739'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const orderTable = await queryRunner.getTable("order");

        if (orderTable && !orderTable.findColumnByName("notes")) {
            await queryRunner.query(`ALTER TABLE "order" ADD "notes" text`);
            console.log("Columna 'notes' agregada a la tabla 'order'.");
        } else {
            console.log("Columna 'notes' ya existe en 'order' o tabla no encontrada. No se realizaron cambios.");
        }

        let currentOrderTableState = await queryRunner.getTable("order");
        if (currentOrderTableState && !currentOrderTableState.findColumnByName("createdById")) {
            await queryRunner.query(`ALTER TABLE "order" ADD "createdById" integer NOT NULL`); // Asumimos NOT NULL basado en FK
            console.log("Columna 'createdById' agregada a la tabla 'order'.");
        } else {
            console.log("Columna 'createdById' ya existe en 'order' o tabla no encontrada. No se realizaron cambios.");
        }
        
        // Idempotencia para customerPhone
        currentOrderTableState = await queryRunner.getTable("order"); // Refrescar estado
        if (currentOrderTableState && currentOrderTableState.findColumnByName("customerPhone")) {
            await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customerPhone"`);
            console.log("Columna 'customerPhone' eliminada de la tabla 'order' (preparando para recrear).");
        }
        await queryRunner.query(`ALTER TABLE "order" ADD "customerPhone" character varying(255)`);
        console.log("Columna 'customerPhone' (character varying(255)) agregada/recreada en la tabla 'order'.");

        // Idempotencia para address
        currentOrderTableState = await queryRunner.getTable("order"); // Refrescar estado
        if (currentOrderTableState && currentOrderTableState.findColumnByName("address")) {
            await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "address"`);
            console.log("Columna 'address' eliminada de la tabla 'order' (preparando para recrear).");
        }
        await queryRunner.query(`ALTER TABLE "order" ADD "address" text`);
        console.log("Columna 'address' (text) agregada/recreada en la tabla 'order'.");
        
        // Idempotencia para la FK
        const constraintName = "FK_de6fa8b07fd7e0a8bf9edb5eb38";
        const foreignKeyExists = await queryRunner.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'order' AND constraint_name = '${constraintName}' AND constraint_type = 'FOREIGN KEY';
        `);

        if (foreignKeyExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
            console.log(`Restricción FK '${constraintName}' agregada a la tabla 'order'.`);
        } else {
            console.log(`Restricción FK '${constraintName}' ya existe en 'order'. No se realizaron cambios.`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const constraintName = "FK_de6fa8b07fd7e0a8bf9edb5eb38";
        // Verificar si la FK existe antes de intentar eliminarla
        const foreignKeyExists = await queryRunner.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'order' AND constraint_name = '${constraintName}' AND constraint_type = 'FOREIGN KEY';
        `);

        if (foreignKeyExists.length > 0) {
            await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "${constraintName}"`);
            console.log(`Restricción FK '${constraintName}' eliminada de la tabla 'order'.`);
        } else {
            console.warn(`Advertencia: No se intentó eliminar la restricción FK '${constraintName}' porque no se encontró.`);
        }

        const orderTable = await queryRunner.getTable("order");

        if (orderTable && orderTable.findColumnByName("address")) {
            await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "address"`);
            console.log("Columna 'address' eliminada de la tabla 'order'.");
        } else {
            console.log("Columna 'address' no existe en 'order' o tabla no encontrada. No se intentó eliminar.");
        }
        // Revertir address al tipo original si es necesario (asumiendo que era character varying)
        // Por simplicidad del down original:
        await queryRunner.query(`ALTER TABLE "order" ADD "address" character varying`);
        console.log("Columna 'address' (character varying) agregada/recreada en la tabla 'order' (reversión).");


        if (orderTable && orderTable.findColumnByName("customerPhone")) {
            await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customerPhone"`);
            console.log("Columna 'customerPhone' eliminada de la tabla 'order'.");
        } else {
            console.log("Columna 'customerPhone' no existe en 'order' o tabla no encontrada. No se intentó eliminar.");
        }
        // Revertir customerPhone al tipo original (asumiendo que era character varying sin especificación de longitud)
        await queryRunner.query(`ALTER TABLE "order" ADD "customerPhone" character varying`);
        console.log("Columna 'customerPhone' (character varying) agregada/recreada en la tabla 'order' (reversión).");


        if (orderTable && orderTable.findColumnByName("createdById")) {
            await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "createdById"`);
            console.log("Columna 'createdById' eliminada de la tabla 'order'.");
        } else {
            console.log("Columna 'createdById' no existe en 'order' o tabla no encontrada. No se intentó eliminar.");
        }

        if (orderTable && orderTable.findColumnByName("notes")) {
            await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "notes"`);
            console.log("Columna 'notes' eliminada de la tabla 'order'.");
        } else {
            console.log("Columna 'notes' no existe en 'order' o tabla no encontrada. No se intentó eliminar.");
        }
    }

}
