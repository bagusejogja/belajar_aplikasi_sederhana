const res = await fetch('http://localhost:3000/api/analisis/global-pagu?date=&year=2026');
const json = await res.json();
console.log(json);
