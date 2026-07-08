const { jsPDF } = require('jspdf');
const doc = new jsPDF();

const text = "Mengingat urgensi operasional program KKN dan upaya efisiensi yang telah dilakukan, DPKM usulan anggaran sebesar Rp5.407.600.000,- ini secara prinsip layak untuk disetujui.";
const lines = doc.splitTextToSize(text, 100);

doc.text(lines, 10, 10, { align: 'justify' }); // wait, does this throw?
console.log("No error");
