# Karaoke aplikacija

Web aplikacija za karaoke žurke. Korisnici mogu da pretražuju i puštaju pesme sa sinhronizovanim titlovima, kao i da ih ocenjuju. Administratori upravljaju pesmama, žanrovima i izvođačima.


---

## Opis sistema

Aplikacija omogućava:

- prijavu korisnika (JWT autentifikacija)
- pregled, pretragu, filtriranje i sortiranje pesama
- karaoke playback (instrumental + WebVTT titlovi)
- ocenjivanje pesama (1–5) sa prikazom proseka i broja ocena
- admin panel: dodavanje/brisanje pesama, CRUD žanrova i izvođača

---

## Tehnologije

| Sloj | Tehnologija |
|------|-------------|
| Backend | Node.js, Express, TypeScript |
| Frontend | React, TypeScript, Bootstrap |
| Baza | MySQL |
| Auth | JWT (jsonwebtoken), bcrypt |
| Upload fajlova | multer |
| Titlovi | WebVTT  |

---

## Struktura projekta

```
karaoke-app/
├── backend/                 # Express API
│   ├── public/songs/        # audio, lyrics, images
│   ├── src/                 # TypeScript izvorni kod
│   └── db_dump.sql          # SQL dump baze
├── frontend/                # React SPA
│   └── src/
└── dokumentacija/           # Model baze, dijagrami, use-case
    ├── 01_model_baze.md
    ├── dijagram baze.png
    ├── dijagram sistema.png
    └── use case.png
```

---

## Uputstvo za pokretanje

### Preduslovi

- Node.js
- MySQL (Workbench ili CLI)
- Git

### 1. Kloniranje

```bash
git clone https://github.com/cira024/karaoke-app.git
cd karaoke-app
git checkout develop
```

### 2. Baza podataka

1. Pokreni MySQL
2. U Workbench-u: **Server → Data Import** → izaberi `backend/db_dump.sql`
3. Importuj shemu `karaoke`

### 3. Backend

```bash
cd backend
npm install
```

Napravi fajl `.env` u `backend/` folderu:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tvoja_lozinka
DB_NAME=karaoke
JWT_SECRET=tvoj_tajni_kljuc
```

Pokreni server:

```bash
npm run start
```

Backend radi na: `http://localhost:5000`

### 4. Frontend

U **novom** terminalu:

```bash
cd frontend
npm install
npm start
```

Frontend radi na: `http://localhost:3000`

### 5. Prijava

- **Username:** `admin`
- **Password:** (lozinka koju si postavio u bazi)

---

## Dokumentacija

Detaljna projektna dokumentacija nalazi se u folderu [`documentation/`](./documentation):

1. Model baze podataka
2. ER dijagram baze
3. Dijagram organizacije sistema
4. Use-case dijagram

---

