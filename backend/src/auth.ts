import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hashed: string): Promise<boolean> => {
  try {
    console.log('comparePassword - uneta:', password);
    console.log('comparePassword - heš iz baze:', hashed);
    const result = await bcrypt.compare(password, hashed);
    console.log('bcrypt.compare rezultat:', result);
    return result;
  } catch (err) {
    console.error('Greška u comparePassword:', err);
    return false;
  }
};

export const generateToken = (userId: number): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT secret not defined');
  return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
};