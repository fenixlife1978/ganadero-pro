const pngToIco = require('png-to-ico');
const path = require('path');

(async () => {
  const inputPng = path.join(__dirname, 'app', 'logo.png');
  const outputIco = path.join(__dirname, 'icon.ico');
  try {
    const buf = await pngToIco(inputPng);
    require('fs').writeFileSync(outputIco, buf);
    console.log('icon.ico generado: ' + outputIco);
  } catch(e) {
    console.error('Error generando .ico:', e.message);
    process.exit(1);
  }
})();
