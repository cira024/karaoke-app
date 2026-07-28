import express, { Request, Response } from 'express';
import mysql from 'mysql2';
import 'dotenv/config';
import { comparePassword, generateToken } from './auth';  
import { verifyToken, isAdmin } from './middleware/authMiddleware';

const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/songs', express.static('public/songs'));

export const db: mysql.Connection = mysql.createConnection({
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
  const sql = `
    SELECT 
      s.song_id,
      s.name,
      s.about,
      s.path_to_img,
      s.path_to_audio,
      s.path_to_lyrics,
      a.name AS artist_name,
      g.name AS genre_name,
      ROUND(AVG(r.rate), 1) AS average_rating,
      COUNT(r.rate_id) AS rating_count
    FROM songs s
    LEFT JOIN artist a ON s.artist_id = a.artist_id
    LEFT JOIN genres g ON s.genre_id = g.genre_id
    LEFT JOIN rate r ON s.song_id = r.song_id
    WHERE s.deleted_at IS NULL
    GROUP BY s.song_id
    ORDER BY s.name ASC
  `;

  db.query(sql, (err: Error | null, results: any[]) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  console.log('=== LOGIN POKUŠAJ ===');
  console.log('Username:', username);
  console.log('Password uneta:', password);

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results: any[]) => {
    if (err) {
      console.log('DB error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      console.log('Korisnik nije pronađen');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    console.log('Korisnik pronađen, heš u bazi:', user.password);

    const isMatch = await comparePassword(password, user.password);
    console.log('comparePassword rezultat:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.user_id);
    console.log('Login uspešan, token generisan');
    res.json({ token });
  });
});
app.post('/api/genres', verifyToken, isAdmin, (req: Request, res: Response) => {
  const { name } = req.body as { name: string };
  db.query('INSERT INTO genres (name) VALUES (?)', [name], (err: Error | null) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Genre added' });
  });
});

app.listen(5000, () => console.log('Server running on port 5000'));