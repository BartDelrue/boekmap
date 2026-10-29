'use strict';

const ICONS = {
    country: { cluster: 'img/icons/country.png', single: 'img/icons/country_search.png', size: 60, zoom: 6 },
    region: { cluster: 'img/icons/region.png', single: 'img/icons/region_search.png', size: 40, zoom: 8 },
    city: { cluster: 'img/icons/city.png', single: 'img/icons/city_search.png', size: 40, zoom: 12 }
};
const COVER_WIDTH = 34;
const COVER_SPACING = 48; // pixels tussen de boeken rond een locatie
const NO_COVER = 'img/icons/cover.png';

const openedPlaces = new Set(); // locaties waarvan de boeken al op de kaart staan
const knownPlaces = new Map();

// --- navigatie ---

const navbar = document.querySelector('.navbar');
const updateNavbar = () => navbar.classList.toggle('scrolled', window.scrollY > 50);
window.addEventListener('scroll', updateNavbar);
updateNavbar();

// --- kaart ---

const placeSources = {};
const placeLayers = Object.keys(ICONS).map(type => {
    placeSources[type] = new ol.source.Vector();
    return new ol.layer.Vector({
        source: new ol.source.Cluster({ distance: 50, source: placeSources[type] }),
        style: clusterStyle(type)
    });
});

const bookSource = new ol.source.Vector();
const bookLayer = new ol.layer.Vector({ source: bookSource });

const popupEl = document.getElementById('popup');
const popup = new ol.Overlay({
    element: popupEl,
    positioning: 'bottom-center',
    offset: [0, -30],
    autoPan: { animation: { duration: 250 } }
});

const mapEl = document.getElementById('map');
mapEl.tabIndex = 0;

const map = new ol.Map({
    target: mapEl,
    // scrollen en toetsenbord pas als de kaart focus heeft, zodat de pagina gewoon kan scrollen
    interactions: ol.interaction.defaults.defaults({ onFocusOnly: true }),
    layers: [
        new ol.layer.Tile({ source: new ol.source.OSM(), className: 'ol-layer osm-tiles' }),
        ...placeLayers,
        bookLayer
    ],
    overlays: [popup],
    view: new ol.View({ center: ol.proj.fromLonLat([3.42, 50]), zoom: 4 })
});

function clusterStyle(type) {
    const cache = {};
    return cluster => {
        const count = cluster.get('features').length;
        if (count === 1) {
            return cache.single ??= new ol.style.Style({
                image: new ol.style.Icon({ src: ICONS[type].single, width: ICONS[type].size })
            });
        }
        return cache[count] ??= new ol.style.Style({
            image: new ol.style.Icon({ src: ICONS[type].cluster, width: ICONS[type].size }),
            text: new ol.style.Text({
                text: String(count),
                font: 'bold 12px Lato, sans-serif',
                fill: new ol.style.Fill({ color: 'black' }),
                stroke: new ol.style.Stroke({ color: 'white', width: 3 }),
                offsetY: ICONS[type].size / 2 + 6
            })
        });
    };
}

function addPlace(place) {
    if (knownPlaces.has(place._id)) return;
    knownPlaces.set(place._id, place);
    const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([place.lng, place.lat])),
        place
    });
    feature.setId(place._id);
    placeSources[place.type].addFeature(feature);
}

function removePlaceMarker(place) {
    const source = placeSources[place.type];
    const feature = source.getFeatureById(place._id);
    if (feature) source.removeFeature(feature);
}

fetch('/api/places')
    .then(res => res.json())
    .then(places => places.forEach(addPlace))
    .catch(() => showMessage('Oeps...', 'De gekende locaties konden niet geladen worden.'));

map.on('click', event => {
    const hit = map.forEachFeatureAtPixel(event.pixel, (feature, layer) => ({ feature, layer }));
    if (!hit) return closePopup();

    if (hit.layer === bookLayer) return showBook(hit.feature);

    const members = hit.feature.get('features');
    if (members.length === 1) return loadBooks(members[0].get('place'));

    // inzoomen op een cluster
    const extent = ol.extent.boundingExtent(members.map(f => f.getGeometry().getCoordinates()));
    map.getView().fit(extent, { duration: 500, padding: [80, 80, 80, 80], maxZoom: 10 });
});

map.on('pointermove', event => {
    if (event.dragging) return;
    map.getTargetElement().style.cursor = map.hasFeatureAtPixel(event.pixel) ? 'pointer' : '';
});

// --- boeken ---

async function loadBooks(place) {
    closePopup();
    const view = map.getView();
    const zoom = ICONS[place.type].zoom;
    const center = ol.proj.fromLonLat([place.lng, place.lat]);

    if (openedPlaces.has(place._id)) {
        view.animate({ center, zoom, duration: 800 });
        return;
    }

    showMessage('Een ogenblik geduld...', 'We verzamelen de gegevens van de bibliotheek.');
    let data;
    try {
        const res = await fetch(`/api/places/${encodeURIComponent(place._id)}/books`);
        if (!res.ok) throw new Error(res.status);
        data = await res.json();
    } catch {
        showMessage('Oeps...', 'De bibliotheek-API of OpenStreetMap gaf een fout terug. Probeer het later opnieuw.');
        return;
    }

    view.animate({ center, zoom, duration: 800 });

    if (!data.books.length) {
        showMessage('Geen boeken gevonden', 'Er werden geen boeken gevonden voor deze locatie');
        return;
    }
    hideMessage();

    addPlace(data.place);
    removePlaceMarker(data.place);
    openedPlaces.add(place._id);

    // boeken in een raster rond de locatie leggen, op de schaal van het doel-zoomniveau
    const resolution = view.getResolutionForZoom(zoom);
    const columns = Math.ceil(Math.sqrt(data.books.length));
    const rows = Math.ceil(data.books.length / columns);
    const step = COVER_SPACING * resolution;

    data.books.forEach((book, i) => {
        const x = (i % columns) - (columns - 1) / 2;
        const y = Math.floor(i / columns) - (rows - 1) / 2;
        const feature = new ol.Feature({
            geometry: new ol.geom.Point([center[0] + x * step, center[1] - y * step * 1.3]),
            book
        });
        feature.setStyle(coverStyle(NO_COVER));
        bookSource.addFeature(feature);
        loadCover(feature, book);
    });
}

function coverStyle(src) {
    return new ol.style.Style({
        image: new ol.style.Icon({ src, width: COVER_WIDTH })
    });
}

// de cover pas tonen als ze effectief geladen is; zonder cover levert de API een
// "geen plaatje beschikbaar"-afbeelding van 100x120, dan blijft het standaard icoon staan
function loadCover(feature, book) {
    if (!book.cover) return;
    const img = new Image();
    img.onload = () => {
        if (img.naturalWidth === 100 && img.naturalHeight === 120) return;
        book.hasCover = true;
        feature.setStyle(coverStyle(book.cover));
    };
    img.src = book.cover;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showBook(feature) {
    const book = feature.get('book');
    const publisher = [book.publisher, book.isbn].filter(Boolean).join(' - ');
    popupEl.querySelector('.popup-content').innerHTML = `
        ${book.hasCover ? `<img src="${escapeHtml(book.cover)}" alt="">` : ''}
        <h3>${escapeHtml(book.title)}</h3>
        <p><em>${escapeHtml(book.author)}</em>${publisher ? `<br>( ${escapeHtml(publisher)} )` : ''}</p>
        <p class="description">${escapeHtml(book.summary)}</p>
        <a target="_blank" rel="noopener" href="${escapeHtml(book.detailPage)}">Details en beschikbaarheid</a>`;
    popupEl.hidden = false;
    popup.setPosition(feature.getGeometry().getCoordinates());
}

function closePopup() {
    popup.setPosition(undefined);
    popupEl.hidden = true;
}

popupEl.querySelector('.popup-close').addEventListener('click', closePopup);

// --- meldingen ---

const messageEl = document.getElementById('message');
let messageTimer;

function showMessage(title, text) {
    clearTimeout(messageTimer);
    messageEl.innerHTML = `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>`;
    messageEl.hidden = false;
    if (!title.startsWith('Een ogenblik')) messageTimer = setTimeout(hideMessage, 5000);
}

function hideMessage() {
    messageEl.hidden = true;
}

messageEl.addEventListener('click', hideMessage);

// --- zoeken ---

const searchForm = document.getElementById('search');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

searchForm.addEventListener('submit', async event => {
    event.preventDefault();
    const q = searchInput.value.trim();
    if (q.length < 2) return;

    searchResults.innerHTML = '<li class="empty">Zoeken...</li>';
    searchResults.hidden = false;
    let results = [];
    try {
        results = await (await fetch(`/api/search?q=${encodeURIComponent(q)}`)).json();
    } catch {
        // lege lijst tonen
    }

    searchResults.innerHTML = '';
    if (!results.length) {
        searchResults.innerHTML = '<li class="empty">Geen locaties gevonden</li>';
        return;
    }
    for (const place of results) {
        const li = document.createElement('li');
        li.tabIndex = 0;
        li.textContent = place.label;
        const choose = () => {
            searchResults.hidden = true;
            searchInput.value = place.name;
            loadBooks(knownPlaces.get(place._id) || place);
        };
        li.addEventListener('click', choose);
        li.addEventListener('keydown', e => e.key === 'Enter' && choose());
        searchResults.append(li);
    }
});

searchInput.addEventListener('input', () => {
    if (!searchInput.value) searchResults.hidden = true;
});
