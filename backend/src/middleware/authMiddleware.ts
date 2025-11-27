import 'express'; 

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number };
  }
}
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../app';



export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    console.log('Token:', token);
    console.log('JWT Secret:', process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    console.log('Decoded token:', decoded); // Dodaj ovo za debug
    req.user = decoded as {id: number };
    next();
  } catch (err) {
    console.log('Verify error:', err); // Dodaj ovo
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id; // Dodaj ovo
  console.log('User ID from token:', userId); // Dodaj ovo za debug
  db.query('SELECT is_admin FROM users WHERE user_id = ?', [userId], (err: Error | null, results: any[]) => {
    console.log('Query err:', err); // Dodaj ovo
    console.log('Query results:', results); // Dodaj ovo
    if (err || results.length === 0 || !results[0].is_admin) return res.status(403).json({ error: 'Admin access required' });
    next();
  });
};