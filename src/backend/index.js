import '../extensions.js';
import fs from 'fs/promises';

(async function() {    
    const credsEncoded = await fs.readFile('./src/creds.json.dat', 'utf8');
    const creds = JSON.parse( atob(credsEncoded) );

    trace("Hello in async SERVER side", creds);
})();