const https = require('https');

async function getCsvHead(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/10EaZBJ4x8ZMP2zyI_dUE1ljE88Gb5c64_NYtHskGEik/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
          let data = '';
          res2.on('data', chunk => {
            data += chunk;
            if (data.includes('\n')) {
               res2.destroy();
               resolve(data.split('\n')[0]);
            }
          });
        });
      } else {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
          if (data.includes('\n')) {
             res.destroy();
             resolve(data.split('\n')[0]);
          }
        });
        res.on('error', reject);
      }
    });
  });
}

(async () => {
  try {
    console.log('Sheet1:', await getCsvHead('Sheet1'));
    console.log('Detail Realisasi:', await getCsvHead('Detail Realisasi'));
    console.log('Pagu Historis:', await getCsvHead('Pagu Historis'));
  } catch (e) {
    console.error(e);
  }
})();
