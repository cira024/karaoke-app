import express, { Request, Response } from 'express';
import mysql from 'mysql2';
import 'dotenv/config';

const app = express();
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string
});

db.connect((err: Error | null) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

app.get('/api/songs', (req: Request, res: Response) => {
  db.query('SELECT * FROM songs', (err: Error | null, results: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));