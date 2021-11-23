
import { Client } from 'pg';
import fs from 'fs/promises';
import { query } from 'express';

export const db = {
    isConnected: false,
    numQueries: 0,
    creds: null,
    client: null,

    async connect() {
        const credsEncoded = await fs.readFile('./src/creds.json.dat', 'utf8');
        const creds = db.creds = JSON.parse( atob(credsEncoded) );

        db.client = new Client( creds );
        db.client.connect();
    
        db.isConnected = true;
    },

    query(statement) {
        const { client } = db;

        db.numQueries++;

        return new Promise((_then, _catch) => {
            
            client.query(statement, (err, res) => {
                if(err) return _catch(err);
                
                _then(res);
            });
        })
    }
};