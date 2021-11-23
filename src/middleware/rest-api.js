import '../extensions.js';
import express from 'express';
import bodyParser from 'body-parser';
import { db } from './utils/connect-db';

const app = express();

app.use( bodyParser.json() );

app.get('/', (req, res) => {
    res.status(404).end('The API needs to be accessed via its nested routes!');
});

app.all('/*', async (req, res, next) => {
    const __ = req.__ = {}; //Toss any private data here;
        
    __.dateRequested = new Date().toISOString();

    if(!db.isConnected) {
        await db.connect();
    }
    
    if(db.numRequests === 0) {
        trace(`${__.dateRequested} - Connected to the DB on port: ${db.creds.port}`);
    }

    db.numRequests++;

    next();
});

app.get('/test', (req, res, next) => {
    trace("GET - /test was called");
    res.end(`${req.__.dateRequested} - Testing 123 ...`);
});

app.get('/wattage/readings', async (req, res, next) => {
    const result = await db.query('SELECT * FROM readings LIMIT 10');
    const { rows } = result;

    trace(rows);

    res.json(rows);
})

export default { path: '/api', handler: app };