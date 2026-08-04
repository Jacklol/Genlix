import { readFileSync, writeFileSync } from "node:fs";

const [geonamesPath, outputPath] = process.argv.slice(2);

if (!geonamesPath || !outputPath) {
  throw new Error("Usage: node scripts/build-belarus-district-routes.mjs <BY.txt> <output.json>");
}

const MINSK = { longitude: 27.56653, latitude: 53.90019 };
const REGIONAL_NAMES = {
  Brest: "Брест",
  "Homyel'": "Гомель",
  Hrodna: "Гродно",
  Mahilyow: "Могилёв",
  Vitebsk: "Витебск",
};

function chooseCyrillicName(alternateNames, fallback) {
  const candidates = alternateNames
    .split(",")
    .map((name) => name.trim())
    .filter((name) => /^[А-ЯЁа-яёІіЎў'’ -]+$/.test(name))
    .filter((name) => !/[ІіЎў]/.test(name))
    .filter((name) => !/^(Горад|Город|Гарадскі)/.test(name));

  if (!candidates.length) return fallback;
  const russianOrthography = candidates.filter((name) => !/(жы|шы|чы|шч)/i.test(name));
  return russianOrthography.at(-1) ?? candidates.at(-1) ?? fallback;
}

function roundCoordinate(value) {
  return Math.round(value * 100000) / 100000;
}

const records = readFileSync(geonamesPath, "utf8")
  .trim()
  .split("\n")
  .map((line) => line.split("\t"))
  .filter((fields) => fields[7] === "PPLA" || fields[7] === "PPLA2")
  .map((fields) => ({
    id: fields[0],
    sourceName: fields[1],
    name: REGIONAL_NAMES[fields[1]] ?? chooseCyrillicName(fields[3], fields[1]),
    latitude: Number(fields[4]),
    longitude: Number(fields[5]),
    kind: fields[7] === "PPLA" ? "regional" : "district",
    admin1Code: fields[10],
  }))
  .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name, "ru"));

let existing = {
  source: {
    destinations: "GeoNames BY country dump",
    routes: "OSRM route service / OpenStreetMap",
    generatedAt: new Date().toISOString(),
    hub: "Минск",
  },
  destinations: [],
};

try {
  existing = JSON.parse(readFileSync(outputPath, "utf8"));
} catch {
  // The file is created after the first successful route and can be resumed.
}

const completedIds = new Set(existing.destinations.map((destination) => destination.id));
const recordsById = new Map(records.map((record) => [record.id, record]));
existing.destinations = existing.destinations.map((destination) => ({
  ...destination,
  ...recordsById.get(destination.id),
}));

async function loadRoute(destination) {
  const coordinates = `${MINSK.longitude},${MINSK.latitude};${destination.longitude},${destination.latitude}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=simplified&geometries=geojson&steps=false`;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": "Genlix-prototype/1.0" } });
    if (response.ok) {
      const payload = await response.json();
      if (payload.code === "Ok" && payload.routes?.[0]) return payload.routes[0];
    }

    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
  }

  throw new Error(`Unable to build route to ${destination.sourceName}`);
}

for (const [index, destination] of records.entries()) {
  if (completedIds.has(destination.id)) continue;

  const route = await loadRoute(destination);
  existing.destinations.push({
    ...destination,
    distance: Math.round(route.distance),
    duration: Math.round(route.duration),
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => [
      roundCoordinate(longitude),
      roundCoordinate(latitude),
    ]),
  });
  existing.destinations.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name, "ru"));
  writeFileSync(outputPath, `${JSON.stringify(existing)}\n`);
  process.stdout.write(`${index + 1}/${records.length} ${destination.sourceName}\n`);
  await new Promise((resolve) => setTimeout(resolve, 260));
}

writeFileSync(outputPath, `${JSON.stringify(existing)}\n`);
process.stdout.write(`Completed ${existing.destinations.length} routes\n`);
