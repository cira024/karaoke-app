const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err: Error | null) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

app.get('/api/songs', (req: express.Request, res: express.Response) => {
  db.query('SELECT * FROM songs', (err: Error | null, results: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));