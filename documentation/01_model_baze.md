# Model baze podataka – Karaoke aplikacija

## 1. Tabela `users`

| Polje       | Tip            | Ograničenja                          | Opis                          |
|-------------|----------------|--------------------------------------|-------------------------------|
| user_id     | INT UNSIGNED   | PK, AUTO_INCREMENT                   | Jedinstveni ID korisnika      |
| username    | VARCHAR(255)   | NOT NULL, UNIQUE                     | Korisničko ime                |
| password    | VARCHAR(255)   | NOT NULL                             | Heširana lozinka (bcrypt)     |
| email       | VARCHAR(255)   | NOT NULL                             | Email adresa                  |
| is_admin    | TINYINT        | NOT NULL, DEFAULT 0                  | 1 = admin, 0 = običan korisnik|
| active      | TINYINT        | NOT NULL, DEFAULT 1                  | Da li je nalog aktivan        |
| created_at  | DATETIME       | NOT NULL, DEFAULT CURRENT_TIMESTAMP  | Vreme kreiranja               |
| updated_at  | DATETIME       | NULL                                 | Vreme poslednje izmene        |

## 2. Tabela `genres`

| Polje       | Tip            | Ograničenja                          | Opis              |
|-------------|----------------|--------------------------------------|-------------------|
| genre_id    | INT UNSIGNED   | PK, AUTO_INCREMENT                   | ID žanra          |
| name        | VARCHAR(255)   | NOT NULL                             | Naziv žanra       |
| created_at  | DATETIME       | NOT NULL, DEFAULT CURRENT_TIMESTAMP  |                   |
| updated_at  | DATETIME       | NULL                                 |                   |
| deleted_at  | DATETIME       | NULL                                 | Soft delete       |

## 3. Tabela `artist`

| Polje       | Tip            | Ograničenja                          | Opis              |
|-------------|----------------|--------------------------------------|-------------------|
| artist_id   | INT UNSIGNED   | PK, AUTO_INCREMENT                   | ID izvođača       |
| name        | VARCHAR(255)   | NOT NULL                             | Ime izvođača      |
| created_at  | DATETIME       | NOT NULL, DEFAULT CURRENT_TIMESTAMP  |                   |
| updated_at  | DATETIME       | NULL                                 |                   |
| deleted_at  | DATETIME       | NULL                                 | Soft delete       |

## 4. Tabela `songs`

| Polje           | Tip            | Ograničenja                          | Opis                          |
|-----------------|----------------|--------------------------------------|-------------------------------|
| song_id         | INT UNSIGNED   | PK, AUTO_INCREMENT                   | ID pesme                      |
| genre_id        | INT UNSIGNED   | NOT NULL, FK → genres                | Žanr                          |
| artist_id       | INT UNSIGNED   | NOT NULL, FK → artist                | Izvođač                       |
| name            | VARCHAR(255)   | NOT NULL                             | Naziv pesme                   |
| about           | TEXT           | NULL                                 | Kratak opis                   |
| path_to_img     | VARCHAR(255)   | NULL                                 | Putanja do slike              |
| path_to_audio   | VARCHAR(255)   | NOT NULL                             | Putanja do instrumentala      |
| path_to_lyrics  | VARCHAR(255)   | NOT NULL                             | Putanja do WebVTT fajla       |
| created_at      | DATETIME       | NOT NULL, DEFAULT CURRENT_TIMESTAMP  |                               |
| updated_at      | DATETIME       | NULL                                 |                               |
| deleted_at      | DATETIME       | NULL                                 | Soft delete                   |

## 5. Tabela `rate`

| Polje       | Tip            | Ograničenja                          | Opis                    |
|-------------|----------------|--------------------------------------|-------------------------|
| rate_id     | INT UNSIGNED   | PK, AUTO_INCREMENT                   | ID ocene                |
| user_id     | INT UNSIGNED   | NOT NULL, FK → users                 | Ko je ocenio            |
| song_id     | INT UNSIGNED   | NOT NULL, FK → songs                 | Koja pesma              |
| rate        | TINYINT        | NOT NULL                             | Ocena 1–5               |
| created_at  | DATETIME       | NOT NULL, DEFAULT CURRENT_TIMESTAMP  |                         |
| updated_at  | DATETIME       | NULL                                 |                         |

**Dodatno na tabelu `rate`:**

- UNIQUE (`user_id`, `song_id`) — jedan korisnik može oceniti istu pesmu samo jednom

---

## Relacije

| Veza                         | Kardinalnost | Opis                                      |
|------------------------------|--------------|-------------------------------------------|
| songs.genre_id → genres      | N : 1        | Jedna pesma pripada jednom žanru          |
| songs.artist_id → artist     | N : 1        | Jedna pesma pripada jednom izvođaču       |
| rate.user_id → users         | N : 1        | Jedna ocena pripada jednom korisniku      |
| rate.song_id → songs         | N : 1        | Jedna ocena pripada jednoj pesmi          |

---

## Triggeri (validacija na nivou baze)

| Trigger                  | Tabela  | Dogadjaj       | Pravilo                                      |
|--------------------------|---------|----------------|----------------------------------------------|
| trg_rate_check           | rate    | BEFORE INSERT  | Ocena mora biti između 1 i 5                 |
| trg_rate_check_update    | rate    | BEFORE UPDATE  | Ocena mora biti između 1 i 5                 |
| trg_songs_name           | songs   | BEFORE INSERT  | Naziv pesme ne sme biti prazan               |
| trg_genres_name          | genres  | BEFORE INSERT  | Naziv žanra ne sme biti prazan               |
| trg_artist_name          | artist  | BEFORE INSERT  | Naziv izvođača ne sme biti prazan            |
