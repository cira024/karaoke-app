import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

interface LoginResponse {
  token: string;
  is_admin?: number | boolean;
  username?: string;
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

interface Genre {
  genre_id: number;
  name: string;
}

interface Artist {
  artist_id: number;
  name: string;
}

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'artist' | 'rating' | 'rating_count'>('name');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showGenresPanel, setShowGenresPanel] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [editingGenreId, setEditingGenreId] = useState<number | null>(null);
  const [editingGenreName, setEditingGenreName] = useState('');
  const [showArtistsPanel, setShowArtistsPanel] = useState(false);
  const [newArtistName, setNewArtistName] = useState('');
  const [editingArtistId, setEditingArtistId] = useState<number | null>(null);
  const [editingArtistName, setEditingArtistName] = useState('');

  // Player
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [cues, setCues] = useState<Cue[]>([]);
  const [currentLyric, setCurrentLyric] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Forma za novu pesmu
  const [newSong, setNewSong] = useState({
    name: '',
    about: '',
    genre_id: '',
    artist_id: ''
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Dropdown podaci
  const [genres, setGenres] = useState<Genre[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  // ========== LOGIN ==========
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Unesi username i password');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username mora imati najmanje 3 karaktera');
      return;
    }
    if (password.length < 4) {
      setError('Password mora imati najmanje 4 karaktera');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post<LoginResponse>('http://localhost:5000/api/login', {
        username: username.trim(),
        password
      });
      setToken(res.data.token);
      setIsAdmin(!!res.data.is_admin);
      fetchSongs(res.data.token);
      fetchGenresAndArtists();
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

  const fetchGenresAndArtists = async () => {
    try {
      const [genresRes, artistsRes] = await Promise.all([
        axios.get<Genre[]>('http://localhost:5000/api/genres'),
        axios.get<Artist[]>('http://localhost:5000/api/artists')
      ]);
      setGenres(genresRes.data);
      setArtists(artistsRes.data);
    } catch (err) {
      console.error('Greška pri učitavanju žanrova/izvođača', err);
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
    setIsAdmin(false);
    setShowAddForm(false);
  };

  // ========== DODAVANJE PESME ==========
  const handleAddSong = async () => {
    if (!newSong.name.trim()) {
      alert('Naziv pesme je obavezan');
      return;
    }
    if (newSong.name.trim().length < 2) {
      alert('Naziv pesme mora imati najmanje 2 karaktera');
      return;
    }
    if (!newSong.genre_id) {
      alert('Izaberi žanr');
      return;
    }
    if (!newSong.artist_id) {
      alert('Izaberi izvođača');
      return;
    }
    if (!audioFile) {
      alert('Audio fajl je obavezan');
      return;
    }
    if (!lyricsFile) {
      alert('Lyrics fajl je obavezan');
      return;
    }

    const formData = new FormData();
    formData.append('name', newSong.name);
    formData.append('about', newSong.about);
    formData.append('genre_id', newSong.genre_id);
    formData.append('artist_id', newSong.artist_id);
    formData.append('audio', audioFile);
    formData.append('lyrics', lyricsFile);
    if (imageFile) formData.append('image', imageFile);

    try {
      await axios.post('http://localhost:5000/api/songs', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Pesma uspešno dodata!');
      setShowAddForm(false);
      setNewSong({ name: '', about: '', genre_id: '', artist_id: '' });
      setAudioFile(null);
      setLyricsFile(null);
      setImageFile(null);
      if (token) fetchSongs(token);
    } catch (err) {
      console.error(err);
      alert('Greška pri dodavanju pesme');
    }
  };
  const handleRate = async (songId: number, rate: number) => {
    if (!token) return;

    try {
      await axios.post(
        `http://localhost:5000/api/songs/${songId}/rate`,
        { rate },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert(`Ocena ${rate} ★ sačuvana!`);
      // Osveži listu pesama da se vidi nova prosečna ocena
      fetchSongs(token);
    } catch (err) {
      console.error(err);
      alert('Greška pri ocenjivanju');
    }
  };

  const handleDeleteSong = async (songId: number, songName: string) => {
    if (!token) return;
    if (!window.confirm(`Obriši pesmu "${songName}"?`)) return;

    try {
      await axios.delete(`http://localhost:5000/api/songs/${songId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pesma obrisana');
      fetchSongs(token);
    } catch (err) {
      console.error(err);
      alert('Greška pri brisanju pesme');
    }
  };

  const handleAddGenre = async () => {
  if (!newGenreName.trim() || !token) return;
  try {
    await axios.post(
      'http://localhost:5000/api/genres',
      { name: newGenreName.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setNewGenreName('');
    fetchGenresAndArtists();
    alert('Žanr dodat');
  } catch (err) {
    console.error(err);
    alert('Greška pri dodavanju žanra');
  }
};

const handleUpdateGenre = async (id: number) => {
  if (!editingGenreName.trim() || !token) return;
  try {
    await axios.put(
      `http://localhost:5000/api/genres/${id}`,
      { name: editingGenreName.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setEditingGenreId(null);
    setEditingGenreName('');
    fetchGenresAndArtists();
    alert('Žanr izmenjen');
  } catch (err) {
    console.error(err);
    alert('Greška pri izmeni žanra');
  }
};

const handleDeleteGenre = async (id: number, name: string) => {
  if (!token) return;
  if (!window.confirm(`Obriši žanr "${name}"?`)) return;
  try {
    await axios.delete(`http://localhost:5000/api/genres/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchGenresAndArtists();
    alert('Žanr obrisan');
  } catch (err) {
    console.error(err);
    alert('Greška pri brisanju žanra');
  }
};

const handleAddArtist = async () => {
  if (!newArtistName.trim() || !token) return;
  try {
    await axios.post(
      'http://localhost:5000/api/artists',
      { name: newArtistName.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setNewArtistName('');
    fetchGenresAndArtists();
    alert('Izvođač dodat');
  } catch (err) {
    console.error(err);
    alert('Greška pri dodavanju izvođača');
  }
};

const handleUpdateArtist = async (id: number) => {
  if (!editingArtistName.trim() || !token) return;
  try {
    await axios.put(
      `http://localhost:5000/api/artists/${id}`,
      { name: editingArtistName.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setEditingArtistId(null);
    setEditingArtistName('');
    fetchGenresAndArtists();
    alert('Izvođač izmenjen');
  } catch (err) {
    console.error(err);
    alert('Greška pri izmeni izvođača');
  }
};

const handleDeleteArtist = async (id: number, name: string) => {
  if (!token) return;
  if (!window.confirm(`Obriši izvođača "${name}"?`)) return;
  try {
    await axios.delete(`http://localhost:5000/api/artists/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchGenresAndArtists();
    alert('Izvođač obrisan');
  } catch (err) {
    console.error(err);
    alert('Greška pri brisanju izvođača');
  }
};

  // ========== PARSE WEBVTT ==========
  const parseWebVTT = (text: string): Cue[] => {
    const lines = text.split(/\r?\n/);
    const result: Cue[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

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
    const parts = time.replace(',', '.').split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // ========== UČITAJ TITLOVE ==========
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
      } catch (err) {
        console.error('Greška pri učitavanju titlova:', err);
        setCurrentLyric('Greška pri učitavanju titlova');
      }
    };

    loadLyrics();
  }, [selectedSong]);

  // ========== PRATI VREME AUDIO-A ==========
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

    // Pretraga po nazivu / izvođaču
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(song =>
        song.name.toLowerCase().includes(term) ||
        song.artist_name?.toLowerCase().includes(term)
      );
    }

    // Filter po žanru
    if (selectedGenre) {
      result = result.filter(song => song.genre_name === selectedGenre);
    }

    // Sortiranje
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === 'artist') {
        cmp = (a.artist_name || '').localeCompare(b.artist_name || '');
      } else if (sortBy === 'rating') {
        cmp = (Number(a.average_rating) || 0) - (Number(b.average_rating) || 0);
      } else if (sortBy === 'rating_count') {
        cmp = (a.rating_count || 0) - (b.rating_count || 0);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    setFilteredSongs(result);
  }, [songs, searchTerm, selectedGenre, sortBy, sortOrder]);

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

                <audio
                  ref={audioRef}
                  controls
                  className="w-100 mb-4"
                  src={`http://localhost:5000${selectedSong.path_to_audio}`}
                />

                <div
                  className="bg-dark text-white p-4 rounded d-flex align-items-center justify-content-center"
                  style={{ minHeight: '160px' }}
                >
                  <h3 className="text-center m-0" style={{ lineHeight: 1.4 }}>
                    {currentLyric || <span className="text-muted">... čeka se početak ...</span>}
                  </h3>
                </div>

                <div className="mt-4">
                  <h5>Oceni pesmu:</h5>
                  <div className="btn-group">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className="btn btn-outline-warning"
                        onClick={() => selectedSong && handleRate(selectedSong.song_id, star)}
                      >
                        {star} ★
                      </button>
                    ))}
                  </div>
                  {selectedSong.average_rating && (
                    <p className="mt-2 text-muted">
                      Trenutna prosečna ocena: <strong>{Number(selectedSong.average_rating).toFixed(1)} ★</strong>
                      {selectedSong.rating_count ? ` (${selectedSong.rating_count} ocena)` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
     
        ) : showArtistsPanel ? (
          <div className="row justify-content-center">
            <div className="col-md-8">
              <button className="btn btn-outline-secondary mb-3" onClick={() => setShowArtistsPanel(false)}>
                ← Nazad na listu
              </button>

              <div className="card shadow">
                <div className="card-body p-4">
                  <h3 className="mb-4">Upravljanje izvođačima</h3>

                  <div className="input-group mb-4">
                    <input
                      className="form-control"
                      placeholder="Naziv novog izvođača"
                      value={newArtistName}
                      onChange={(e) => setNewArtistName(e.target.value)}
                    />
                    <button className="btn btn-success" onClick={handleAddArtist}>
                      Dodaj
                    </button>
                  </div>

                  <ul className="list-group">
                    {artists.map((a) => (
                      <li key={a.artist_id} className="list-group-item d-flex justify-content-between align-items-center">
                        {editingArtistId === a.artist_id ? (
                          <div className="input-group">
                            <input
                              className="form-control"
                              value={editingArtistName}
                              onChange={(e) => setEditingArtistName(e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={() => handleUpdateArtist(a.artist_id)}>
                              Sačuvaj
                            </button>
                            <button className="btn btn-outline-secondary" onClick={() => setEditingArtistId(null)}>
                              Otkaži
                            </button>
                          </div>
                        ) : (
                          <>
                            <span>{a.name}</span>
                            <div>
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => {
                                  setEditingArtistId(a.artist_id);
                                  setEditingArtistName(a.name);
                                }}
                              >
                                Izmeni
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteArtist(a.artist_id, a.name)}
                              >
                                Obriši
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : showGenresPanel ? (
  <div className="row justify-content-center">
    <div className="col-md-8">
      <button className="btn btn-outline-secondary mb-3" onClick={() => setShowGenresPanel(false)}>
        ← Nazad na listu
      </button>

      <div className="card shadow">
        <div className="card-body p-4">
          <h3 className="mb-4">Upravljanje žanrovima</h3>

          <div className="input-group mb-4">
            <input
              className="form-control"
              placeholder="Naziv novog žanra"
              value={newGenreName}
              onChange={(e) => setNewGenreName(e.target.value)}
            />
            <button className="btn btn-success" onClick={handleAddGenre}>
              Dodaj
            </button>
          </div>

          <ul className="list-group">
            {genres.map((g) => (
              <li key={g.genre_id} className="list-group-item d-flex justify-content-between align-items-center">
                {editingGenreId === g.genre_id ? (
                  <div className="input-group">
                    <input
                      className="form-control"
                      value={editingGenreName}
                      onChange={(e) => setEditingGenreName(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={() => handleUpdateGenre(g.genre_id)}>
                      Sačuvaj
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => setEditingGenreId(null)}>
                      Otkaži
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{g.name}</span>
                    <div>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => {
                          setEditingGenreId(g.genre_id);
                          setEditingGenreName(g.name);
                        }}
                      >
                        Izmeni
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteGenre(g.genre_id, g.name)}
                      >
                        Obriši
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
) : showAddForm ? (
        /* ========== FORMA ZA DODAVANJE PESME ========== */
        <div className="row justify-content-center">
          <div className="col-md-8">
            <button className="btn btn-outline-secondary mb-3" onClick={() => setShowAddForm(false)}>
              ← Nazad na listu
            </button>

            <div className="card shadow">
              <div className="card-body p-4">
                <h3 className="mb-4">Dodaj novu pesmu</h3>

                <div className="mb-3">
                  <label className="form-label">Naziv pesme *</label>
                  <input
                    className="form-control"
                    value={newSong.name}
                    onChange={(e) => setNewSong({ ...newSong, name: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Opis</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={newSong.about}
                    onChange={(e) => setNewSong({ ...newSong, about: e.target.value })}
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Žanr *</label>
                    <select
                      className="form-select"
                      value={newSong.genre_id}
                      onChange={(e) => setNewSong({ ...newSong, genre_id: e.target.value })}
                    >
                      <option value="">Izaberi žanr</option>
                      {genres.map((g) => (
                        <option key={g.genre_id} value={g.genre_id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Izvođač *</label>
                    <select
                      className="form-select"
                      value={newSong.artist_id}
                      onChange={(e) => setNewSong({ ...newSong, artist_id: e.target.value })}
                    >
                      <option value="">Izaberi izvođača</option>
                      {artists.map((a) => (
                        <option key={a.artist_id} value={a.artist_id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Audio fajl (instrumental) *</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Lyrics fajl (WebVTT / SRT) *</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".vtt,.srt"
                    onChange={(e) => setLyricsFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Slika (opciono)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>

                <button className="btn btn-success w-100" onClick={handleAddSong}>
                  Sačuvaj pesmu
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========== LISTA PESAMA ========== */
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>🎵 Dostupne pesme</h2>
            <div>
                    {isAdmin && (
                      <>
                        <button className="btn btn-success me-2" onClick={() => setShowAddForm(true)}>
                          + Dodaj pesmu
                        </button>
                        <button className="btn btn-outline-primary me-2" onClick={() => setShowGenresPanel(true)}>
                          Žanrovi
                        </button>
                        <button className="btn btn-outline-info me-2" onClick={() => setShowArtistsPanel(true)}>
                          Izvođači
                        </button>
                      </>
                    )}
              <button className="btn btn-outline-danger" onClick={handleLogout}>
                Odjavi se
              </button>
            </div>
          </div>

                <div className="row mb-4 g-2">
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="🔍 Pretraži pesme ili izvođača..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                    >
                      <option value="">Svi žanrovi</option>
                      {genres.map((g) => (
                        <option key={g.genre_id} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'artist' | 'rating' | 'rating_count')}
                    >
                      <option value="name">Po nazivu</option>
                      <option value="artist">Po izvođaču</option>
                      <option value="rating">Po oceni</option>
                      <option value="rating_count">Po broju ocena</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    >
                      <option value="asc">Rastuće</option>
                      <option value="desc">Opadajuće</option>
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
                          <strong>{Number(song.average_rating).toFixed(1)} ★</strong>
                          {song.rating_count && <small className="text-muted"> ({song.rating_count})</small>}
                        </p>
                      )}
                      <button className="btn btn-primary mt-auto" onClick={() => setSelectedSong(song)}>
                        🎤 Pusti
                      </button>
                      {isAdmin && (
                        <button
                          className="btn btn-outline-danger btn-sm mt-2"
                          onClick={() => handleDeleteSong(song.song_id, song.name)}
                        >
                          Obriši
                        </button>
                      )}
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