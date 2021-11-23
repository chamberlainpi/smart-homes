//A very simple encryption for the DB creds details:
import './src/extensions.js';
import fs from 'fs/promises';

(async function() {
    const data = await fs.readFile('.private/creds.json', 'utf8');
    const encData = btoa(data);

    const encDataPath = './src/creds.json.dat';
    await fs.writeFile(encDataPath, encData);
    
    trace('DB data encrypted to: ', encDataPath);
})();