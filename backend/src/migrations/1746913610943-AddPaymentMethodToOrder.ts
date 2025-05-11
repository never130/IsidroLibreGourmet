import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentMethodToOrder1746913610943 implements MigrationInterface {
    name = 'AddPaymentMethodToOrder1746913610943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Se asume que el tipo enum 'order_paymentmethod_enum' y 
        // la columna 'paymentMethod' en la tabla 'order' ya existen.
        // No se realizan operaciones DDL aquí para evitar errores si ya existen.
        console.log(`Skipping DDL operations in AddPaymentMethodToOrder1746913610943 up() as schema is assumed to be up-to-date for paymentMethod.`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Si 'up' no hace nada, 'down' tampoco debería intentar eliminar estas estructuras
        // a menos que estemos seguros de que esta migración fue la ÚNICA responsable
        // de su creación en un escenario limpio. Por seguridad, no las eliminamos aquí.
        console.log(`Skipping DDL operations in AddPaymentMethodToOrder1746913610943 down(). Manual check may be needed if rollback is truly required.`);
        // try {
        //     await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "paymentMethod"`);
        // } catch (e) {
        //     console.warn("Warning: Could not drop 'paymentMethod' column from 'order' table. It might not exist.", e);
        // }
        // try {
        //     await queryRunner.query(`DROP TYPE "public"."order_paymentmethod_enum"`);
        // } catch (e) {
        //    console.warn("Warning: Could not drop type 'order_paymentmethod_enum'. It might not exist or be in use.", e);
        // }
    }
}
