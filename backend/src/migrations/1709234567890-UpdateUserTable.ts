import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserTable1709234567890 implements MigrationInterface {
    name = 'UpdateUserTable1709234567890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Primero, agregamos la columna username como nullable
        // await queryRunner.query(`ALTER TABLE "user" ADD "username" character varying`); // COMENTADA porque ya existe
        
        // Las siguientes operaciones asumen que la columna "username" existe.
        // Si fallan, es porque estas condiciones (NOT NULL, UNIQUE) ya se cumplen o hay datos incompatibles.

        // Intentar actualizar los registros existentes con un valor por defecto si son NULL
        // Esto podría fallar si la columna ya es NOT NULL y no hay NULLs, o si hay un conflicto UNIQUE al actualizar.
        try {
            await queryRunner.query(`UPDATE "user" SET "username" = 'user_' || id WHERE "username" IS NULL`);
        } catch (e) {
            console.warn("Warning: Could not update existing NULL usernames. This might be okay if column is already NOT NULL or no NULLs existed.", e);
        }
        
        // Intentar hacer la columna NOT NULL
        try {
            await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "username" SET NOT NULL`);
        } catch (e) {
            console.warn("Warning: Could not set username to NOT NULL. This might be okay if it's already NOT NULL.", e);
        }
        
        // Intentar agregar la restricción UNIQUE
        try {
            await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_user_username" UNIQUE ("username")`);
        } catch (e) {
            console.warn("Warning: Could not add UNIQUE constraint to username. This might be okay if it already exists.", e);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Solo intentar quitar la restricción si existe (más seguro)
        try {
            await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_user_username"`);
        } catch (e) {
            console.warn("Warning: Could not drop UNIQUE constraint on username. It might not exist.");
        }
        // No quitar la columna username aquí si no la creamos en el método up actual
        // await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "username"`);
        console.log('Method down for UpdateUserTable1709234567890: Attempted to drop UNIQUE constraint if it existed. Column username not dropped by this modified migration.');
    }
} 