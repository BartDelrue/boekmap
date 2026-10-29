# Boekmap

> This is an old student project of mine, dates back to november 2015!  
> At the time I was a second year bachelor student at Howest.  
> 
> The project was revived by Claude in 2026 with much of the original code intact.  
> It's not a serious project, it's nostalgia.



Nederlandstalige fictie op de kaart, per stad, land of regio.

- Kaart: [OpenStreetMap](https://www.openstreetmap.org/) met [OpenLayers](https://openlayers.org/)
- Locaties zoeken: [Nominatim](https://nominatim.org/)
- Boeken: [Cultuurconnect Catalogus API](https://www.cultuurconnect.be/diensten/apis) (opvolger van de bibnet API),
  zelfde zoekvraag als vroeger: `subject:"<locatie>" format:"boek" type:"fiction" language:"dut"` op de centrale catalogus (`zbb`)
- Backend: Node.js (Express) + MongoDB

Elke locatie waarvoor boeken gevonden worden, wordt bewaard in MongoDB (collectie `places`),
samen met de gevonden boeken. Cultuurconnect raadt aan zoveel mogelijk te cachen; de boeken worden
standaard na 365 dagen opnieuw opgehaald zodat nieuwe titels erbij komen (`BOOKS_MAX_AGE_DAYS`). Bij een lege database worden de locaties
uit `data/seed-places.json` ingeladen (de locaties van de oude boekmap).

## Ontwikkelen

Zet eerst je API-key in `.env` (zie `.env.example`):

```sh
CATALOGUS_KEY=...
```

Alles in Docker:

```sh
docker compose up --build
```

Of alleen MongoDB in Docker en de app lokaal (met auto-reload):

```sh
docker compose up -d mongo
cp .env.example .env
npm install
npm run dev
```

De app draait op http://localhost:3000. De dev-database luistert op poort **27018** op de host.

## Productie

Bouw de image en geef de verbinding met je bestaande MongoDB mee:

```sh
docker build -t boekmap .
docker run -d -p 3000:3000 \
  -e CATALOGUS_KEY="..." \
  -e MONGODB_URI="mongodb://user:pass@mongo-host:27017/boekmap?authSource=admin" \
  -e CONTACT_EMAIL="jij@example.com" \
  boekmap
```

| Variabele       | Standaard                              | Uitleg                                              |
|-----------------|----------------------------------------|-----------------------------------------------------|
| `PORT`          | `3000`                                 |                                                     |
| `CATALOGUS_KEY` | (verplicht)                          | Key voor de Cultuurconnect Catalogus API            |
| `BOOKS_MAX_AGE_DAYS` | `365`                          | Na hoeveel dagen de boeken van een locatie vernieuwd worden |
| `MONGODB_URI`   | `mongodb://localhost:27018/boekmap`    | De databasenaam komt uit de URI                     |
| `CONTACT_EMAIL` | (leeg)                                 | Meegestuurd naar Nominatim, zoals hun gebruiksbeleid vraagt |

## API

- `GET /api/places` — alle gekende locaties
- `GET /api/search?q=gent` — locaties zoeken via Nominatim
- `GET /api/places/:id/books` — boeken voor een locatie (`id` is een OSM-id zoals `R897671`)

De oude PHP-versie staat in `legacy/` en wordt niet meer gebruikt.
