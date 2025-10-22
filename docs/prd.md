PRODUCT REQUIREMENTS DOCUMENT (PRD)
📌 1. Titlu proiect

TikSound Extractor
Aplicație web care descarcă și extrage sunetul original din clipurile TikTok.

🎯 2. Obiectiv

Permite utilizatorilor să introducă un link TikTok, să verifice dacă videoclipul are sunet original (nu unul suprapus) și, dacă da, să descarce sunetul în format .mp3.

🧑‍💻 3. Public țintă

Creatori de conținut care doresc să extragă propriile sunete

Persoane care doresc să analizeze sau folosească sunetele originale

Utilizatori care doresc un tool simplu și rapid pentru extragere audio din TikTok

🏗️ 4. Arhitectură generală
Frontend (React) <----> Backend (Node.js + Express)
                           |
                           |-> yt-dlp: descarcă video
                           |-> Scraper: verifică dacă sunetul e original
                           |-> FFmpeg: extrage sunetul în mp3
                           |
                           |-> Răspunde cu fișier .mp3

⚙️ 5. Funcționalități
✅ 5.1. Frontend (React + TailwindCSS)

 Form pentru introducerea linkului TikTok

 Validare URL

 Afișare stare (ex: „Se analizează…”, „Sunet original detectat”, etc.)

 Link de descărcare a fișierului .mp3

 Tratament erori (ex: sunet suprapus, link invalid)

✅ 5.2. Backend (Node.js + Express)
Endpoint principal: POST /extract

Input: url TikTok

Pași:

Validează URL-ul

Descarcă metadata video cu yt-dlp

Verifică dacă sunetul e original ("Original Sound" în metadata)

Dacă da:

Descarcă video

Extrage .mp3 cu ffmpeg

Salvează temporar și răspunde cu link de download

Dacă nu:

Returnează mesaj: „Sunetul este suprapus și nu poate fi extras”

Output: JSON:

{
  "status": "success",
  "originalSound": true,
  "downloadUrl": "https://yourdomain.com/downloads/audio.mp3"
}

🧱 6. Structura proiectului
/tiksound-extractor
│
├── backend/
│   ├── index.js
│   ├── download.js
│   ├── extractAudio.js
│   └── utils/
│       └── checkOriginalSound.js
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── styles/
│   └── public/
│
├── downloads/  ← mp3 temporare
├── .env
├── package.json
└── README.md

🛠️ 7. Tehnologii folosite
Componentă	Tehnologie
Frontend	React, TailwindCSS
Backend	Node.js, Express
Download	yt-dlp (sau youtube-dl)
Procesare audio	FFmpeg
Hosting	Vercel (frontend) + Render/Fly.io/Heroku (backend)
Storage temporar	Local (folder downloads/)
🔐 8. Securitate

Validare input-uri pe backend (nu permite altceva decât linkuri TikTok)

Limitare la 1 request / 10 secunde per IP (anti-abuz)

Ștergere mp3-urilor temporare după 10 minute (cron job)

💬 9. Mesaje posibile către utilizator

✅ „Sunet original detectat! Poți descărca mp3-ul.”

⚠️ „Clipul are sunet suprapus. Nu poate fi extras.”

❌ „Link invalid. Te rog să introduci un link TikTok valid.”

⏳ „Se procesează clipul… te rugăm să aștepți câteva secunde.”

📈 10. Măsurători de succes (KPIs)

Timp mediu de procesare < 10 secunde

Rată de succes a descărcării peste 90%

<5% erori server

🧪 11. Testare

Teste unitare pentru checkOriginalSound.js

Teste end-to-end pentru flow complet (de la input până la mp3)

Testare UI pe mobil + desktop

