import express, { Request, Response } from 'express';
import mysql from 'mysql2';
import 'dotenv/config';
import { comparePassword, generateToken } from './auth';  
import { verifyToken, isAdmin } from './middleware/authMiddleware';

const cors = require('cors');
const app = express();
const multer = require('multer');
const path = require('path');
app.use(cors());
app.use(express.json());
// Upload konfiguracija
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    if (file.fieldname === 'audio') {
      cb(null, 'public/songs/audio');
    } else if (file.fieldname === 'lyrics') {
      cb(null, 'public/songs/lyrics');
    } else if (file.fieldname === 'image') {
      cb(null, 'public/songs/images');
    } else {
      cb(null, 'public/songs');
    }
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

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

// Lista žanrova
app.get('/api/genres', (req: Request, res: Response) => {
  db.query('SELECT genre_id, name FROM genres WHERE deleted_at IS NULL ORDER BY name', (err: Error | null, results: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Dodaj žanr
app.post('/api/genres', verifyToken, isAdmin, (req: any, res: Response) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Naziv žanra je obavezan' });
  }

  db.query('INSERT INTO genres (name) VALUES (?)', [name.trim()], (err: Error | null) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Žanr dodat' });
  });
});

// Izmeni žanr
app.put('/api/genres/:id', verifyToken, isAdmin, (req: any, res: Response) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Naziv žanra je obavezan' });
  }

  db.query(
    'UPDATE genres SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE genre_id = ? AND deleted_at IS NULL',
    [name.trim(), req.params.id],
    (err: Error | null, result: any) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Žanr nije pronađen' });
      res.json({ message: 'Žanr izmenjen' });
    }
  );
});

// Obriši žanr (soft delete)
app.delete('/api/genres/:id', verifyToken, isAdmin, (req: any, res: Response) => {
  db.query(
    'UPDATE genres SET deleted_at = CURRENT_TIMESTAMP WHERE genre_id = ? AND deleted_at IS NULL',
    [req.params.id],
    (err: Error | null, result: any) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Žanr nije pronađen' });
      res.json({ message: 'Žanr obrisan' });
    }
  );
});

// Lista izvođača
app.get('/api/artists', (req: Request, res: Response) => {
  db.query('SELECT artist_id, name FROM artist WHERE deleted_at IS NULL ORDER BY name', (err: Error | null, results: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Dodaj izvođača
app.post('/api/artists', verifyToken, isAdmin, (req: any, res: Response) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Naziv izvođača je obavezan' });
  }

  db.query('INSERT INTO artist (name) VALUES (?)', [name.trim()], (err: Error | null) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Izvođač dodat' });
  });
});

// Izmeni izvođača
app.put('/api/artists/:id', verifyToken, isAdmin, (req: any, res: Response) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Naziv izvođača je obavezan' });
  }

  db.query(
    'UPDATE artist SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE artist_id = ? AND deleted_at IS NULL',
    [name.trim(), req.params.id],
    (err: Error | null, result: any) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Izvođač nije pronađen' });
      res.json({ message: 'Izvođač izmenjen' });
    }
  );
});

// Obriši izvođača (soft delete)
app.delete('/api/artists/:id', verifyToken, isAdmin, (req: any, res: Response) => {
  db.query(
    'UPDATE artist SET deleted_at = CURRENT_TIMESTAMP WHERE artist_id = ? AND deleted_at IS NULL',
    [req.params.id],
    (err: Error | null, result: any) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Izvođač nije pronađen' });
      res.json({ message: 'Izvođač obrisan' });
    }
  );
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username mora imati najmanje 3 karaktera' });
  }
  if (!password || typeof password !== 'string' || password.length < 4) {
    return res.status(400).json({ error: 'Password mora imati najmanje 4 karaktera' });
  }
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
      res.json({ 
        token,
        is_admin: user.is_admin,
        username: user.username
      });
  });
});
app.post('/api/songs', verifyToken, isAdmin, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'lyrics', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), (req: any, res: Response) => {
  const { name, about, genre_id, artist_id } = req.body;
  const files = req.files;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Naziv pesme mora imati najmanje 2 karaktera' });
  }
  if (!genre_id || isNaN(Number(genre_id))) {
    return res.status(400).json({ error: 'Neispravan žanr' });
  }
  if (!artist_id || isNaN(Number(artist_id))) {
    return res.status(400).json({ error: 'Neispravan izvođač' });
  }
  if (!files?.audio?.[0]) {
    return res.status(400).json({ error: 'Audio fajl je obavezan' });
  }
  if (!files?.lyrics?.[0]) {
    return res.status(400).json({ error: 'Lyrics fajl je obavezan' });
  }

  

  const path_to_audio = '/songs/audio/' + files.audio[0].filename;
  const path_to_lyrics = '/songs/lyrics/' + files.lyrics[0].filename;
  const path_to_img = files.image ? '/songs/images/' + files.image[0].filename : null;

  const sql = `
    INSERT INTO songs (genre_id, artist_id, name, about, path_to_audio, path_to_lyrics, path_to_img)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [genre_id, artist_id, name, about || null, path_to_audio, path_to_lyrics, path_to_img], (err: Error | null) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Pesma uspešno dodata' });
  });
});
// Ocenjivanje pesme
app.post('/api/songs/:id/rate', verifyToken, (req: any, res: Response) => {
  const songId = req.params.id;
  const userId = req.user?.id || req.user?.user_id;
  const { rate } = req.body;

  if (!Number.isInteger(Number(rate))) {
    return res.status(400).json({ error: 'Ocena mora biti ceo broj' });
  }
  if (!rate || rate < 1 || rate > 5) {
    return res.status(400).json({ error: 'Ocena mora biti između 1 i 5' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'Niste ulogovani' });
  }

  // INSERT ili UPDATE ako korisnik već ocenio
  const sql = `
    INSERT INTO rate (user_id, song_id, rate)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE rate = VALUES(rate), updated_at = CURRENT_TIMESTAMP
  `;

  db.query(sql, [userId, songId, rate], (err: Error | null) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Ocena sačuvana', rate });
  });
});
// Brisanje pesme (admin) - soft delete
app.delete('/api/songs/:id', verifyToken, isAdmin, (req: any, res: Response) => {
  const songId = req.params.id;

  const sql = `UPDATE songs SET deleted_at = CURRENT_TIMESTAMP WHERE song_id = ? AND deleted_at IS NULL`;

  db.query(sql, [songId], (err: Error | null, result: any) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pesma nije pronađena' });
    }
    res.json({ message: 'Pesma obrisana' });
  });
});


app.listen(5000, () => console.log('Server running on port 5000'));