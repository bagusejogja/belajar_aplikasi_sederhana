const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js'); 
const fs = require('fs'); 
const data = new Uint8Array(fs.readFileSync('657-603231-surat-dinas-20260813112805_signed.pdf')); 
pdfjsLib.getDocument({data}).promise.then(doc => console.log('Pages:', doc.numPages)).catch(e => console.error('Error:', e.message));
