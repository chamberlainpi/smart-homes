
import { Client } from 'pg';
import fs from 'fs/promises';
import { query } from 'express';

export const db = {
    isConnected: false,
    numRequests: 0,
    creds: null,
    client: null,

    async connect() {
        const credsEncoded = await fs.readFile('./src/creds.json.dat', 'utf8');
        const creds = db.creds = JSON.parse( atob(credsEncoded) );
    
        trace("Hello in async SERVER side", db.creds);

        db.client = new Client( creds );
        db.client.connect();

        const res = await db.query('SELECT NOW()');

        trace("Postgre response = ", res.rows[0]);
    
        db.isConnected = true;
    },

    query(statement) {
        const { client } = db;

        return new Promise((_then, _catch) => {
            
            client.query(statement, (err, res) => {
                if(err) return _catch(err);
                
                _then(res);
            });
        })
    }
};