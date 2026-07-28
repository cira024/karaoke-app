import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

interface LoginResponse {
  token: string;
}

interface Song {
  song_id: number;
  name: string;
  about?: string;
  artist_name?: string;
  genre_name?: string;
  average_rating?: number;
  rating_count?: number;
  path_to_audio: string;
  path_to_lyrics: string;
  path_to_img?: string | null;
}

interface Cue {
  start: number;
  end: number;
  text: string;
}

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating'>('name');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Player
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [cues, setCues] = useState<Cue[]>([]);
  const [currentLyric, setCurrentLyric] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // ========== LOGIN ==========
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post<LoginResponse>('http://localhost:5000/api/login', {
        username,
        password
      });
      setToken(res.data.token);
      fetchSongs(res.data.token);
    } catch (err) {
      setError('Pogrešan username ili password');
    } finally {
      setLoading(false);
    }
  };

  const fetchSongs = async (authToken: string) => {
    try {
      const res = await axios.get<Song[]>('http://localhost:5000/api/songs', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setSongs(res.data);
      setFilteredSongs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setSongs([]);
    setFilteredSongs([]);
    setSearchTerm('');
    setSelectedSong(null);
    setUsername('');
    setPassword('');
  };

  // ========== PARSE WEBVTT ==========
  const parseWebVTT = (text: string): Cue[] => {
    const lines = text.split(/\r?\n/);
    const result: Cue[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Tražimo liniju sa vremenom (npr. 00:00:12.000 --> 00:00:15.500)
      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map(s => s.trim());
        const start = timeToSeconds(startStr);
        const end = timeToSeconds(endStr);

        i++;
        let textLines: string[] = [];
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i].trim());
          i++;
        }

        if (textLines.length > 0) {
          result.push({
            start,
            end,
            text: textLines.join('\n')
          });
        }
      } else {
        i++;
      }
    }
    return result;
  };

  const timeToSeconds = (time: string): number => {
    // Podržava i 00:00:12.000 i 00:12.000
    const parts = time.replace(',', '.').split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // ========== UČITAJ TITLOVE KADA SE IZABERE PESMA ==========
  useEffect(() => {
    if (!selectedSong) {
      setCues([]);
      setCurrentLyric('');
      return;
    }

    const loadLyrics = async () => {
      try {
        const res = await fetch(`http://localhost:5000${selectedSong.path_to_lyrics}`);
        const text = await res.text();
        const parsed = parseWebVTT(text);
        setCues(parsed);
        console.log('Učitano titlova:', parsed.length);
      } catch (err) {
        console.error('Greška pri učitavanju titlova:', err);
        setCurrentLyric('Greška pri učitavanju titlova');
      }
    };

    loadLyrics();
  }, [selectedSong]);

  // ========== PRATI VREME AUDIO-A I PRIKAŽI TRENUTNI STI ==========
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || cues.length === 0) return;

    const updateLyric = () => {
      const currentTime = audio.currentTime;
      const active = cues.find(c => currentTime >= c.start && currentTime <= c.end);
      setCurrentLyric(active ? active.text : '');
    };

    audio.addEventListener('timeupdate', updateLyric);
    return () => audio.removeEventListener('timeupdate', updateLyric);
  }, [cues]);

  // ========== SEARCH & SORT ==========
  useEffect(() => {
    let result = [...songs];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(song =>
        song.name.toLowerCase().includes(term) ||
        song.artist_name?.toLowerCase().includes(term)
      );
    }

    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    }

    setFilteredSongs(result);
  }, [songs, searchTerm, sortBy]);

  return (
    <div className="container mt-4">
      {!token ? (
        /* ========== LOGIN ========== */
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card shadow">
              <div className="card-body p-5">
                <h2 className="text-center mb-4">🎤 Karaoke Login</h2>
                {error && <div className="alert alert-danger text-center">{error}</div>}
                <input className="form-control mb-3" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input className="form-control mb-3" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button className="btn btn-primary w-100 py-2" onClick={handleLogin} disabled={loading}>
                  {loading ? 'Ulogujem se...' : 'Uloguj se'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : selectedSong ? (
        /* ========== KARAOKE PLAYER ========== */
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <button className="btn btn-outline-secondary mb-3" onClick={() => setSelectedSong(null)}>
              ← Nazad na listu
            </button>

            <div className="card shadow">
              <div className="card-body p-4">
                {/* SLIKA */}
                {selectedSong.path_to_img && (
                  <div className="text-center mb-3">
                    <img
                      src={`http://localhost:5000${selectedSong.path_to_img}`}
                      alt={selectedSong.name}
                      style={{ maxHeight: '220px', borderRadius: '8px' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                <h2 className="mb-1">{selectedSong.name}</h2>
                <p className="text-muted fs-5 mb-2">{selectedSong.artist_name}</p>
                {selectedSong.genre_name && (
                  <span className="badge bg-secondary mb-3">{selectedSong.genre_name}</span>
                )}

                {/* AUDIO */}
                <audio
                  ref={audioRef}
                  controls
                  className="w-100 mb-4"
                  src={`http://localhost:5000${selectedSong.path_to_audio}`}
                />

                {/* LYRICS */}
                <div
                  className="bg-dark text-white p-4 rounded d-flex align-items-center justify-content-center"
                  style={{ minHeight: '160px' }}
                >
                  <h3 className="text-center m-0" style={{ lineHeight: 1.4 }}>
                    {currentLyric || <span className="text-muted">... čeka se početak ...</span>}
                  </h3>
                </div>

                {/* RATING PLACEHOLDER */}
                <div className="mt-4">
                  <h5>Oceni pesmu:</h5>
                  <div className="btn-group">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} className="btn btn-outline-warning">
                        {star} ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========== LISTA PESAMA ========== */
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>🎵 Dostupne pesme</h2>
            <button className="btn btn-outline-danger" onClick={handleLogout}>Odjavi se</button>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Pretraži pesme ili izvođača..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'rating')}>
                <option value="name">Sortiraj po nazivu</option>
                <option value="rating">Sortiraj po oceni</option>
              </select>
            </div>
          </div>

          <div className="row">
            {filteredSongs.length === 0 ? (
              <p className="text-center fs-5">Nema pronađenih pesama.</p>
            ) : (
              filteredSongs.map((song) => (
                <div className="col-md-4 col-lg-3 mb-4" key={song.song_id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{song.name}</h5>
                      <p className="text-muted mb-1">{song.artist_name}</p>
                      {song.genre_name && <span className="badge bg-secondary mb-2">{song.genre_name}</span>}
                      {song.average_rating && (
                        <p className="mb-2">
                          <strong>{song.average_rating.toFixed(1)} ★</strong>
                          {song.rating_count && <small className="text-muted"> ({song.rating_count})</small>}
                        </p>
                      )}
                      <button className="btn btn-primary mt-auto" onClick={() => setSelectedSong(song)}>
                        🎤 Pusti
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default App;