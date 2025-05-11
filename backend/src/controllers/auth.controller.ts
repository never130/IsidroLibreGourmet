import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { username }
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({ message: 'Error in login' });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      // req.user es adjuntado por authMiddleware. 
      // authMiddleware debería garantizar que req.user está presente.
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: No user data in token' });
      }
      
      // Devolvemos solo la información necesaria y segura del perfil
      const userProfile = {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email
      };
      res.json(userProfile);
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  }
} 