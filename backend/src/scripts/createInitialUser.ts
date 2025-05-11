import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities/User';
import bcrypt from 'bcrypt';

async function createInitialUser() {
  try {
    await AppDataSource.initialize();
    console.log('Conexión a la base de datos establecida');

    const userRepository = AppDataSource.getRepository(User);

    // Verificar si ya existe un usuario owner
    const existingOwner = await userRepository.findOne({
      where: { role: UserRole.OWNER }
    });

    if (existingOwner) {
      console.log('Ya existe un usuario owner');
      return;
    }

    // Crear usuario owner
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const owner = userRepository.create({
      name: 'Administrador',
      email: 'admin@isidrolibregourmet.com',
      password: hashedPassword,
      role: UserRole.OWNER,
      isActive: true
    });

    await userRepository.save(owner);
    console.log('Usuario owner creado exitosamente');

  } catch (error) {
    console.error('Error al crear usuario inicial:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

createInitialUser(); 