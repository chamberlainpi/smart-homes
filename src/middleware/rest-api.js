import '../extensions.js';
import express from 'express';
import bodyParser from 'body-parser';
import { db } from './utils/connect-db';

const app = express();

app.use( bodyParser.json() );

app.get('/', (req, res) => {
    res.status(404).end('The API needs to be accessed via its nested routes!');
});

app.all('/*', (req, res, next) => {
    const __ = req.__ = {}; //Toss any private data here;
        
    __.dateRequested = new Date().toISOString();

    if(!db.isConnected) {
        db.connect();
        return res.end(`${__.dateRequested} - Not connected to DB yet, try again!`);
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
})

export default { path: '/api', handler: app };