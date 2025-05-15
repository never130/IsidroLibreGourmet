import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UserRole } from '../entities/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UpdateProfileDto } from '../dtos/user.dto';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';

export class UserController {
  async getAll(req: Request, res: Response) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find({
        select: ['id', 'username', 'firstName', 'lastName', 'email', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt']
      });
      res.json(users);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Error getting users' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: parseInt(id) },
        select: ['id', 'username', 'firstName', 'lastName', 'email', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt']
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ message: 'Error getting user' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        username,
        password,
        role,
        firstName,
        lastName,
        email,
        isActive
      } = req.body as CreateUserDto;

      const userRepository = AppDataSource.getRepository(User);

      // Verificar si el usuario ya existe
      const existingUserByUsername = await userRepository.findOne({ where: { username } });
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Verificar si el email ya existe
      if (email) {
        const existingUserByEmail = await userRepository.findOne({ where: { email } });
        if (existingUserByEmail) {
          return res.status(400).json({ message: 'Email already exists' });
        }
      }

      const user = userRepository.create({
        username,
        password,
        firstName,
        lastName,
        email,
        role: role || UserRole.OWNER,
        isActive: typeof isActive === 'boolean' ? isActive : true
      });

      await userRepository.save(user);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error && 'code' in error && (error as any).code === '23505') { 
        if ('detail' in error && typeof (error as any).detail === 'string' && (error as any).detail.includes('username')){
            return res.status(400).json({ message: 'Username already exists.' });
        }
        if ('detail' in error && typeof (error as any).detail === 'string' && (error as any).detail.includes('email')){
            return res.status(400).json({ message: 'Email already exists.' });
        }
      }
      res.status(500).json({ message: 'Error creating user' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        username,
        password,
        role,
        isActive,
        firstName,
        lastName,
        email
      } = req.body as UpdateUserDto;

      const authenticatedUserId = req.user?.id; // Asumimos que req.user está poblado por el middleware de auth

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(id) } });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Restricciones para el usuario 'admin'
      if (user.username === 'admin') {
        if (typeof isActive === 'boolean' && !isActive) {
          return res.status(403).json({ message: "The 'admin' user cannot be deactivated." });
        }
        if (role && role !== user.role) {
          return res.status(403).json({ message: "The role of the 'admin' user cannot be changed." });
        }
        if (username && username !== 'admin') {
          return res.status(403).json({ message: "The username of the 'admin' user cannot be changed." });
        }
      }

      // Restricción para que un usuario no se desactive a sí mismo
      if (authenticatedUserId && user.id === authenticatedUserId && typeof isActive === 'boolean' && !isActive) {
        return res.status(403).json({ message: 'You cannot deactivate yourself.' });
      }
      
      // Lógica revisada para el cambio de roles
      if (role && role !== user.role) { // Si se intenta cambiar el rol
        const authenticatedUser = await userRepository.findOne({ where: { id: authenticatedUserId } });

        if (!authenticatedUser) {
          return res.status(403).json({ message: 'Authenticated user not found. Cannot process role change.' });
        }

        // Caso 1: Intentando cambiar su propio rol
        if (user.id === authenticatedUserId) {
          if (authenticatedUser.role !== UserRole.OWNER) {
            return res.status(403).json({ message: 'You cannot change your own role unless you are an Owner.' });
          }
          // Si es OWNER, se permite cambiar su propio rol (aunque es raro, la lógica lo permite)
        } 
        // Caso 2: Intentando cambiar el rol de OTRO usuario (o del usuario 'admin')
        else {
          // Subcaso 2.1: Intentando cambiar el rol del usuario 'admin'
          if (user.username === 'admin') {
            if (authenticatedUser.role !== UserRole.OWNER) {
              return res.status(403).json({ message: "Only an OWNER can change the 'admin' user's role." });
            }
          } 
          // Subcaso 2.2: Intentando cambiar el rol de un usuario que NO es 'admin'
          else {
            if (authenticatedUser.role !== UserRole.OWNER && authenticatedUser.role !== UserRole.ADMIN) {
              return res.status(403).json({ message: "You do not have permission to change this user's role. Requires Owner or Admin." });
            }
          }
        }
      }

      // Verificar si el nuevo username ya existe (si se está cambiando)
      if (username && username !== user.username) {
        const existingUser = await userRepository.findOne({ where: { username } });
        if (existingUser) {
          return res.status(400).json({ message: 'Username already exists' });
        }
        user.username = username;
      }

      // Verificar si el nuevo email ya existe (si se está cambiando)
      if (email && email !== user.email) {
        const existingEmail = await userRepository.findOne({ where: { email } });
        if (existingEmail && existingEmail.id !== user.id) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        user.email = email;
      }

      // Actualizar campos
      if (typeof firstName === 'string') user.firstName = firstName;
      if (typeof lastName === 'string') user.lastName = lastName;
      if (password) user.password = await bcrypt.hash(password, 10);
      if (role) user.role = role;
      if (typeof isActive === 'boolean') user.isActive = isActive;

      await userRepository.save(user);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof Error && 'code' in error && (error as any).code === '23505') { 
        if ('detail' in error && typeof (error as any).detail === 'string' && (error as any).detail.includes('username')){
            return res.status(400).json({ message: 'Username already exists.' });
        }
        if ('detail' in error && typeof (error as any).detail === 'string' && (error as any).detail.includes('email')){
            return res.status(400).json({ message: 'Email already in use.' });
        }
      }
      res.status(500).json({ message: 'Error updating user' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const authenticatedUserId = req.user?.id; // Asumimos que req.user está poblado por el middleware de auth

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: parseInt(id) }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Restricción para no eliminar al usuario 'admin'
      if (user.username === 'admin') {
        return res.status(403).json({ message: "The 'admin' user cannot be deleted." });
      }

      // Restricción para que un usuario no se elimine a sí mismo
      if (authenticatedUserId && user.id === authenticatedUserId) {
        return res.status(403).json({ message: 'You cannot delete yourself.' });
      }

      await userRepository.remove(user);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Error deleting user' });
    }
  }

  async updateCurrentUserProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const updateProfileDto = req.body as UpdateProfileDto;
      const { firstName, lastName, email, currentPassword, newPassword } = updateProfileDto;

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Validar si se intenta cambiar el email y ya existe en otro usuario
      if (email && email !== user.email) {
        const existingEmail = await userRepository.findOne({ where: { email } });
        if (existingEmail && existingEmail.id !== userId) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        user.email = email;
      }

      // Actualizar campos básicos del perfil
      if (typeof firstName === 'string') user.firstName = firstName;
      if (typeof lastName === 'string') user.lastName = lastName;

      // Cambiar contraseña
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to set a new password' });
        }
        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordMatch) {
          return res.status(400).json({ message: 'Invalid current password' });
        }
        user.password = await bcrypt.hash(newPassword, 10);
      }

      await userRepository.save(user);

      // Devolver el usuario actualizado (sin la contraseña)
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);

    } catch (error) {
      console.error('Error updating profile:', error);
      if (error instanceof Error && 'code' in error && (error as any).code === '23505' && (error as any).detail?.includes('email')) {
        return res.status(400).json({ message: 'Email already in use.' });
      }
      res.status(500).json({ message: 'Error updating profile' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { username },
        select: ['id', 'username', 'password', 'role', 'isActive', 'firstName', 'lastName', 'email', 'lastLogin', 'createdAt', 'updatedAt']
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'User is inactive' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generar token JWT
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '24h' }
      );

      // Actualizar último login
      user.lastLogin = new Date();
      await userRepository.save(user);

      // No devolver la contraseña
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  }

  // Método para obtener el perfil del usuario autenticado actualmente
  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id; // Asume que authMiddleware inyecta 'user' en 'req'
      
      if (!userId) {
        // Esto no debería pasar si authMiddleware se ejecuta primero
        return res.status(401).json({ message: 'Not authenticated or user ID missing from token' });
      }

      const userRepository = AppDataSource.getRepository(User);
      // Selecciona solo los campos que quieres enviar al frontend
      const user = await userRepository.findOne({ 
        where: { id: userId },
        select: ['id', 'username', 'firstName', 'lastName', 'email', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt']
      });

      if (!user) {
        // Usuario del token no encontrado en la BD, podría ser un token viejo o un problema de consistencia
        return res.status(404).json({ message: 'User associated with token not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({ message: 'Error getting current user data' });
    }
  }
} 