import { MigrationInterface, QueryRunner } from "typeorm";
// import * as bcrypt from "bcrypt"; // No se necesita bcrypt aquí
// import { UserRole } from "../entities/User"; // No es estrictamente necesario si usamos el valor string directo

export class CreateAdminUser1709234567891 implements MigrationInterface {
    name = 'CreateAdminUser1709234567891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // const hashedPassword = await bcrypt.hash("admin123", 10); // ELIMINADO: El hasheo se hará por el @BeforeInsert de la entidad User
        
        // Usar el valor en minúscula para el enum, como se almacena en la BD
        await queryRunner.query(`
            INSERT INTO "user" (username, password, role, "isActive", "createdAt", "updatedAt")
            VALUES ('admin', 'admin123', 'owner', true, NOW(), NOW()) /* MODIFICADO: Usar contraseña en texto plano */
            ON CONFLICT (username) DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "user" WHERE username = 'admin' AND role = 'owner'`); // Ser más específico en el down
    }
} 