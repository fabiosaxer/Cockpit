# Cockpit

Persönliches Dashboard unter https://cockpit.saxer.sg.
Eine Person, ein Konto. Zeigt jeden Morgen, was heute und in den kommenden Tagen und Wochen ansteht, getrennt nach Lebensbereichen.

Die vollständigen Anforderungen stehen im Dokument "Life Cockpit – Anforderungen".

## Stack

- Next.js (App Router, TypeScript), als PWA installierbar
- Tailwind CSS v4 (eigene Komponenten, kein UI-Kit)
- Supabase: Postgres, Storage, Auth (Microsoft-Login, nur eine erlaubte E-Mail)
- Hosting: Vercel, Auto-Deploy aus GitHub (main = Produktion)
- Claude API für das Auslesen von Moduldokumenten (ab Stufe 3)

## Design

Design "Blauer Himmel" (Aviatik, hell und fröhlich): Himmelverlauf mit Wolken und Flugzeug, weisse Karten, Schriften Nunito und B612 Mono. Jeder Bereich hat eine eigene Farbe (`src/lib/areaColors.ts`).
Farben nach Avionik-Konvention, definiert in `src/app/globals.css`:
koralle = überfällig, sonnengelb = heute, himmelblau = demnächst (Vorlauf), grün = erledigt/normal,
violett = als Nächstes. Countdown als T-5 / HEUTE / T+2.
Texte schlicht und klar halten. Aviatik nur als kleine Anspielung (Flugzeug, Logo, Countdown), nicht in jedem Begriff.
Begriffe: "Demnächst" (im Vorlauf), "Erledigt", "Als Nächstes".

## Code-Struktur

- `src/lib/logic.ts`: Vorlauf- und Statuslogik (rein, testbar)
- `src/lib/dates.ts`: Datumsfunktionen, Zeitzone Europe/Zurich
- `src/lib/data.ts`: Laden der Daten, Seed beim ersten Login
- `src/app/actions.ts`: alle Server Actions
- `src/app/(app)/`: geschützte Seiten, `src/app/login/`: Login

## Bereiche

Bühler, Studium (ZHAW SML), IPA (Prüfungsexperte), SR-Verantwortlicher FC Zuzwil, Schiedsrichter OFV, Haushalt.

## Kernkonzepte

- **Vorlauf:** Jeder Eintrag wird ab `faellig_am - vorlauf_tage` im Dashboard angezeigt. Standard pro Typ:
  Termin 0, Aufgabe 2, Projekt-Meilenstein 7, Abgabe Studium 14, Prüfung 28. IPA-Korrektur ist ab Abgabe sichtbar.
  Der Vorlauf ist pro Eintrag überschreibbar.
- **Wiederholung:** Die nächste Fälligkeit wird ab dem Erledigt-Datum berechnet, nicht nach fixem Kalender.
- **Abwesenheiten:** Wiederkehrende Aufgaben in einer Abwesenheit werden auf den ersten Tag danach verschoben.
  Fixe Fristen werden nicht verschoben, sondern markiert.
- **IPA:** Aus Kürzel, Start und Ende werden Fixpunkte erzeugt: Validierungsgespräch (ca. 2 Arbeitstage vor Start),
  Besuch 1 (2. Arbeitstag), Besuch 2 (Mitte), Abgabe (Ende), Korrektur, Präsentation (ca. 3 Wochen nach Abgabe).
  Alle Fixpunkte sind einzeln verschiebbar. ICT-Fachmann/-frau EFZ: nur Durchführungstag und Validierungsgespräch ca. eine Woche davor.
- **SR-Kontingent:** Kein Spielzähler. Pro Vereins-SR und Kalenderjahr wird nur markiert, ob das Kontingent
  (15 Spiele) erreicht ist. Jeder erreichte SR sichert 2 Mannschaften für die folgende Saison.
- **Projekte:** Statusampel (grün, gelb, rot), nächster Schritt, Meilensteine.
- **Outlook-Kalender:** Microsoft Graph, delegiert (nur eigener Kalender). Termine werden live geladen,
  über die Outlook-Kategorie einem Bereich zugeordnet (`calendar_categories`) und wie Einträge mit Vorlauf angezeigt.
  Nur lesend; Bearbeiten in Outlook. Code: `src/lib/outlook.ts`, `src/lib/events.ts`, `src/app/api/outlook/`.

## Daten- und Sicherheitsregeln

- Keine Firmeninhalte von Bühler: nur Projekttitel, Status und Termine.
- Keine Personendaten von IPA-Kandidaten: nur Kürzel und Termine.
- Row Level Security auf allen Tabellen. Kein Zugriff ohne Login.
- Secrets nur in Umgebungsvariablen, nie im Repository.

## Arbeitsweise

- Mobile first: Jede Ansicht muss auf dem iPhone gut bedienbar sein.
- Kleine, abgeschlossene Schritte. Nach jedem Schritt lauffähig und deploybar.
- Datenbankänderungen nur über Migrationen in `supabase/migrations`.
- UI-Texte auf Deutsch (Schweiz, ohne ß).
- Reihenfolge: MVP (Login, Bereiche, Aufgaben, Vorlauf, Dashboard, Wiederholung, Projekte, Deployment),
  dann IPA, Kontingent, Abwesenheiten, dann Agent und Mini-SR-Einteilung, zuletzt Integrationen.
