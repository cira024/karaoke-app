import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(password, hashed);
};

export const generateToken = (userId: number): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT secret not defined');
  return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
};