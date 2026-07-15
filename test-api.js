const res = await fetch('http://localhost:3000/api/analisis/global-pagu?date=2026-07-13T12:45:44.775041%2B00:00&year=2026');
const json = await res.json();
console.log(JSON.stringify(json, null, 2));
