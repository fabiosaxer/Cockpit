# Cockpit

Persönliches Cockpit für Termine, Abgaben und Projekte. Läuft unter https://cockpit.saxer.sg.

Next.js 15 · Supabase · Vercel. Kontext für Claude Code steht in `CLAUDE.md`.

## Setup (einmalig)

### 1. Supabase
1. **SQL Editor** → die Dateien in `supabase/migrations/` der Reihe nach einfügen und ausführen (Run):
   `20261107000000_init.sql`, `20261108000000_absences_ipa_referees.sql`, `20261108010000_ipa_profession_quota_toggle.sql`, `20261108020000_outlook.sql`, `20261108030000_item_deadline.sql`.
2. **Authentication → URL Configuration**
   - Site URL: `https://cockpit.saxer.sg`
   - Redirect URLs: `https://cockpit.saxer.sg/**`, `https://*.vercel.app/**`, `http://localhost:3000/**`
3. **Project Settings → API**: Project URL und `anon` Key kopieren.

### 2. Vercel
1. **Add New → Project** → Repo `fabiosaxer/cockpit` importieren (Framework: Next.js).
2. Environment Variables (siehe `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ALLOWED_EMAIL` = deine Login-Adresse
   - `NEXT_PUBLIC_AUTH_MICROSOFT` = `false`
3. Deploy.
4. **Settings → Domains** → `cockpit.saxer.sg` hinzufügen. Vercel zeigt den CNAME-Wert an.

### 3. DNS in Plesk (Hosttime)
Websites & Domains → saxer.sg → **DNS-Einstellungen** → Eintrag hinzufügen:
- Typ `CNAME`, Name `cockpit`, Wert: der von Vercel angezeigte Wert (meist `cname.vercel-dns.com.`)

### 4. Benutzer anlegen und erster Login
1. Supabase → **Authentication → Users → Add user → Create new user**:
   E-Mail (= `ALLOWED_EMAIL`), sicheres Passwort, **Auto Confirm User** anhaken.
2. Supabase → **Authentication → Sign In / Providers**: „Allow new users to sign up“ **ausschalten**.
   So kann niemand sonst ein Konto anlegen.
3. Cockpit öffnen und mit E-Mail und Passwort anmelden.
   Bereiche und Typen werden beim ersten Login automatisch angelegt.

Der Login-Link per E-Mail ist nur eine Alternative. Er muss im selben Browser geöffnet werden,
und Supabase verschickt ohne eigenen Mailserver nur wenige Mails pro Stunde.

### 5. Als App installieren
- iPhone/iPad: Safari → Teilen → „Zum Home-Bildschirm“.

## Optional: Microsoft-Login
1. Azure Portal → App registrations → New (Konten: „Personal Microsoft accounts“ oder alle).
   Redirect URI: `https://<projekt>.supabase.co/auth/v1/callback`.
2. Client ID und Secret in Supabase unter Authentication → Providers → Azure eintragen.
3. In Vercel `NEXT_PUBLIC_AUTH_MICROSOFT=true` setzen und neu deployen.

## Lokal entwickeln
```bash
cp .env.example .env.local   # Werte eintragen
npm install
npm run dev
```

## Datenbank-Änderungen
Neue Migrationen liegen in `supabase/migrations/`. Jede Datei einmal im Supabase **SQL Editor** ausführen,
in der Reihenfolge des Dateinamens.

## Outlook-Kalender (Microsoft 365)
1. Entra Admin Center → App-Registrierungen → Neue Registrierung „Cockpit“, einzelner Mandant,
   Umleitungs-URI (Web): `https://cockpit.saxer.sg/api/outlook/callback`.
2. Geheimen Clientschlüssel erstellen (24 Monate, vor Ablauf erneuern).
3. API-Berechtigungen (delegiert): `Calendars.ReadWrite`, `offline_access`, `User.Read`, Administratorzustimmung erteilen.
4. Vercel-Variablen: `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY` (lange Zufallszeichenkette).
5. Im Cockpit unter Einstellungen „Mit Outlook verbinden“. Kategorien den Bereichen zuordnen.

Tokens werden AES-256-GCM-verschlüsselt in Supabase gespeichert. Das Cockpit liest nur den eigenen Kalender.
