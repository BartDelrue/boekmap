import express from 'express';
import { MongoClient } from 'mongodb';
import { XMLParser } from 'fast-xml-parser';
import { readFile } from 'node:fs/promises';

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/boekmap';
const CONTACT = process.env.CONTACT_EMAIL || '';
const USER_AGENT = `boekmap/2.0${CONTACT ? ` (${CONTACT})` : ''}`;
const CATALOGUS_KEY = process.env.CATALOGUS_KEY;
// Cultuurconnect raadt aan zoekresultaten zoveel mogelijk te cachen; af en toe vernieuwen voor nieuwe boeken
const BOOKS_MAX_AGE = (Number(process.env.BOOKS_MAX_AGE_DAYS) || 365) * 24 * 60 * 60 * 1000;

if (!CATALOGUS_KEY) {
    console.error('CATALOGUS_KEY ontbreekt (key voor de Cultuurconnect Catalogus API)');
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
await client.connect();
const places = client.db().collection('places');

// bij een lege database de gekende locaties van de oude boekmap inladen
if (await places.estimatedDocumentCount() === 0) {
    const seed = JSON.parse(await readFile(new URL('./data/seed-places.json', import.meta.url), 'utf8'));
    await places.insertMany(seed);
    console.log(`${seed.length} locaties ingeladen`);
}

async function getJson(url) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`${url} gaf ${res.status}`);
    return res.json();
}

// --- Nominatim (OpenStreetMap) ---

function placeType(addresstype) {
    if (addresstype === 'country') return 'country';
    if (['city', 'town', 'village', 'municipality', 'suburb', 'city_district'].includes(addresstype)) return 'city';
    return 'region';
}

function toPlace(hit) {
    return {
        _id: hit.osm_type[0].toUpperCase() + hit.osm_id,
        name: hit.name || hit.display_name.split(',')[0],
        type: placeType(hit.addresstype),
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        label: hit.display_name
    };
}

function nominatimUrl(path, params) {
    const url = new URL(path, 'https://nominatim.openstreetmap.org');
    url.search = new URLSearchParams({ format: 'jsonv2', namedetails: 1, 'accept-language': 'nl', ...params });
    if (CONTACT) url.searchParams.set('email', CONTACT);
    return url;
}

async function searchPlaces(q) {
    const hits = await getJson(nominatimUrl('/search', { q, limit: 5, featureType: 'settlement' }));
    const regions = hits.length ? [] : await getJson(nominatimUrl('/search', { q, limit: 5 }));
    return [...hits, ...regions].map(toPlace);
}

async function lookupPlace(id) {
    if (!/^[NWR]\d+$/.test(id)) return null;
    const [hit] = await getJson(nominatimUrl('/lookup', { osm_ids: id }));
    return hit ? toPlace(hit) : null;
}

// --- Cultuurconnect Catalogus API (opvolger van de bibnet API) ---

const xml = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    isArray: name => name === 'result'
});

const first = value => (Array.isArray(value) ? value[0] : value) ?? '';

async function findBooks(place) {
    const url = new URL('https://cataloguswebservices.bibliotheek.be/zbb/search/');
    url.search = new URLSearchParams({
        q: `subject:"${place.name}" format:"boek" type:"fiction" language:"dut"`,
        authorization: CATALOGUS_KEY,
        lang: 'nl'
    });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Catalogus API gaf ${res.status}`);
    const { aquabrowser } = xml.parse(await res.text());
    if (aquabrowser.error) throw new Error(`Catalogus API: ${aquabrowser.error.reason}`);

    return (aquabrowser.results?.result || []).map(r => ({
        id: first(r.id),
        title: first(r.titles?.title),
        author: first(r.authors?.['main-author']),
        publisher: first(r.publication?.publishers?.publisher),
        isbn: first(r.identifiers?.['isbn-id']),
        summary: first(r.summaries?.summary),
        cover: first(r.coverimages?.coverimage).replace('coversize=small', 'coversize=medium'),
        detailPage: first(r['detail-page'])
    }));
}

// --- routes ---

const app = express();
app.use(express.static('public'));

app.get('/api/places', async (req, res) => {
    res.json(await places.find({}, { projection: { books: 0, booksFetchedAt: 0 } }).toArray());
});

app.get('/api/search', async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    res.json(await searchPlaces(q));
});

app.get('/api/places/:id/books', async (req, res) => {
    let place = await places.findOne({ _id: req.params.id });
    const isNew = !place;
    if (isNew) {
        place = await lookupPlace(req.params.id);
        if (!place) return res.status(404).json({ error: 'Onbekende locatie' });
        delete place.label;
    }

    if (!place.books || Date.now() - place.booksFetchedAt > BOOKS_MAX_AGE) {
        place.books = await findBooks(place);
        place.booksFetchedAt = Date.now();
        // nieuwe locaties enkel bewaren als er boeken gevonden zijn (crowd sourced kaart)
        if (!isNew || place.books.length) {
            await places.replaceOne({ _id: place._id }, place, { upsert: true });
        }
    }

    const { books, booksFetchedAt, ...rest } = place;
    res.json({ place: rest, isNew: isNew && books.length > 0, books });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(502).json({ error: 'Er liep iets mis bij het ophalen van de gegevens.' });
});

app.listen(PORT, () => console.log(`Boekmap draait op http://localhost:${PORT}`));
