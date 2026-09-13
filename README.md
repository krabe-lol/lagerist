# Lagerist

Schlanke, selbst gehostete Lagerverwaltung ohne Nutzerverwaltung. Locations
(verschachtelbar) enthalten Container, Container enthalten Items, Items können
Unteritems haben. Jede Entity kann Fotos, Dateianhänge, Tags und Vorlagen-Felder
haben, bekommt einen QR-Code und ist über die Volltextsuche auffindbar.

## Stack

- Next.js (App Router, TypeScript) — UI, API-Routen und Server Actions in einer Codebase
- Prisma ORM + SQLite (`data/lagerist.db`)
- SQLite FTS5 für die Volltextsuche
- Tailwind CSS + DaisyUI (Dracula-Theme)
- `qrcode` für QR-Code-Erzeugung, `jsqr` für den Kamera-Scan

## Entwicklung

```bash
npm install
npx prisma migrate deploy   # legt data/lagerist.db an
npm run dev
```

Die App läuft dann unter [http://localhost:3000](http://localhost:3000).

## Produktion mit Docker

```bash
docker compose up --build
```

`data/` wird als Volume gemountet und enthält die SQLite-Datenbank sowie alle
hochgeladenen Fotos/Dateien — das ist alles, was für ein Backup gesichert
werden muss.

## Features

- Entity-Typen Location, Container, Item (mit Unteritems), inkl. verschachtelbarer Locations
- Vorlagen mit frei definierbaren Feldern (Text/Zahl/Datum/Ja-Nein) pro Entity-Typ
- Foto- und Dateianhänge, Tags, QR-Code je Entity
- Volltextsuche über Name, Beschreibung, Tags und Vorlagen-Feldwerte
- Dashboard mit Kennzahlen und zuletzt geänderten Entities
- QR-Code-Scan per Kamera (`/scan`) und druckbare Label-Bögen (`/labels`)
