import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post<any>('http://localhost:3000/api/login', { username, password });
      setToken(res.data.token);
      fetchSongs(res.data.token);
    } catch (err) {
      console.error('Login error', err);
    }
  };

  const fetchSongs = async (authToken: string) => {
    try {
      const res = await axios.get<any>('http://localhost:3000/api/songs', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setSongs(res.data);
    } catch (err) {
      console.error('Fetch songs error', err);
    }
  };

  useEffect(() => {
    if (token) fetchSongs(token);
  }, [token]);

  return (
    <div className="container mt-5">
      {!token ? (
        <div className="card">
          <div className="card-body">
            <h2>Login</h2>
            <input className="form-control mb-2" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
            <input className="form-control mb-2" type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            <button className="btn btn-primary" onClick={handleLogin}>Login</button>
          </div>
        </div>
      ) : (
        <div>
          <h2>Songs List</h2>
          <ul className="list-group">
            {songs.map((song: any) => (
              <li key={song.song_id} className="list-group-item">{song.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
