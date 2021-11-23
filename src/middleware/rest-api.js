import '../extensions.js';
import express from 'express';
import bodyParser from 'body-parser';
import { db } from './utils/connect-db';
import CONSTS from '../api.constants';

const { ERROR_CODES, WATTAGE_READING } = CONSTS;

const logNow = msg => trace( `${new Date().toISOString()} - ${msg}`);
const sendError = (res, err) => {
    logNow(err.error);
    res.status(400).json(err);
}

const app = express();
app.use( bodyParser.json() );

app.get('/', (req, res) => {
    sendError(res, {
        error: 'The API needs to be accessed via its nested routes!',
        code: ERROR_CODES.API_CHILD_ROUTE_NEEDED
    });
});

app.all('/*', async (req, res, next) => {
    const __ = req.__ = {}; //Toss any private data here;

    if(!db.isConnected) {
        await db.connect();
        logNow(`Connected to the DB on port: ${db.creds.port}`);
    }
    
    next();
});

app.get('/test', (req, res, next) => {
    logNow("GET - /test was called");
    res.end(`Testing`);
});

app.get('/readings/:offset?', async (req, res, next) => {
    const offset = parseInt(req.params.offset ?? 0);
    if(isNaN(offset) || offset < 0) {
        return sendError(res, {
            error: 'Wattage Readings offset should be 0 or greater (or omitted, defaults to 0), got: ' + offset,
            code: ERROR_CODES.WATTAGE_OFFSET_INVALID
        });
    }

    logNow("Reading offset: " + offset);
    const { rows } = await db.query(`SELECT * FROM readings LIMIT ${WATTAGE_READING.LIMIT_PER_QUERY} OFFSET ${offset}`);

    res.json(rows);
});

app.get('/filters', async (req, res, next) => {
    const getDistinct = async distinctField => {
        logNow(`>>> ${distinctField}`);
        const { rows } = await db.query(`SELECT DISTINCT "${distinctField}" FROM readings LIMIT ${WATTAGE_READING.LIMIT_SERIAL_NUMBERS}`);
        logNow(`  < ${distinctField}`);

        return rows.map( r => r[distinctField] );
    }
    
    const serialNumbers = await getDistinct('Serial_Number');
    const deviceIds = await getDistinct('Device_ID');

    res.json( {dateRequested: new Date(), serialNumbers, deviceIds} );
});

export default { path: '/api', handler: app };