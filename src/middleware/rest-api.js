import '../extensions.js';
import express from 'express';
import bodyParser from 'body-parser';
import { db } from './utils/connect-db';
import CONSTS from '../api.constants';
import { getTime } from '../utils';
import dayjs from 'dayjs';

const { ERROR_CODES, WATTAGE_READING } = CONSTS;
const logNow = msg => trace( `${new Date().toISOString()} - ${msg}`);
const sendError = (res, err) => {
    logNow(err.error);
    res.status(400).json(err);
}

const sendPretty = (res, data) => {
    res.type('json').end( JSON.stringify(data, null, '  ') );
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

    __.timeStart = getTime();

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

app.get('/total', async (req, res, next) => {
    const { rows } = await db.query(`SELECT COUNT(*) FROM readings`);

    res.json(rows);
});

app.get('/readings/:offset?', async (req, res, next) => {
    const { __ } = req;

    const offset = parseInt(req.params.offset ?? 0);
    if(isNaN(offset) || offset < 0) {
        return sendError(res, {
            error: 'Wattage Readings offset should be 0 or greater (or omitted, defaults to 0), got: ' + offset,
            code: ERROR_CODES.WATTAGE_OFFSET_INVALID
        });
    }

    logNow("Reading offset: " + offset);
    const { rows } = await db.query(`SELECT * FROM readings ORDER BY "DateTime" LIMIT ${WATTAGE_READING.LIMIT_PER_QUERY} OFFSET ${offset}`);

    __.timeDiff = getTime() - __.timeStart;
    const simplified = simplifyWattageData(rows);

    sendPretty(res, {
        timeToQueryMS: __.timeDiff,
        ... simplified
    });
});

app.get('/readings/date/:dateStart', async (req, res, next) => {
    const { __ } = req;

    const dateStart = dayjs(req.params.dateStart || '');
    if(!dateStart || !dateStart.isValid()) {
        return sendError(res, {
            error: `Wattage Readings 'dateStart' param is required and must be in the format YYYY-MM-DD, got: ${dateStart}`,
            code: ERROR_CODES.WATTAGE_OFFSET_INVALID
        });
    }

    const dateEnd = dateStart.add(WATTAGE_READING.LIMIT_DAYS_RANGE, 'day');
    const dateStartStr = dateStart.format('YYYY-MM-DD');
    const dateEndStr = dateEnd.format('YYYY-MM-DD');    

    const q = `SELECT * FROM readings WHERE "DateTime" BETWEEN '${dateStartStr}' AND '${dateEndStr}' ORDER BY "DateTime"`;
    logNow("Reading query: ", q);

    try {
        const { rows } = await db.query(q);

        __.timeDiff = getTime() - __.timeStart;

        const simplified = simplifyWattageData(rows);

        sendPretty(res, {
            timeToQueryMS: __.timeDiff,
            dateStart: dateStartStr,
            dateEnd: dateEndStr,
            days: WATTAGE_READING.LIMIT_DAYS_RANGE,
            ... simplified
        });
    } catch(err) {
        sendError(res, {
            error: err.toString(),
            q,
            code: -1
        });
    }
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
    const { rows } = await db.query(`SELECT min("DateTime") as min_date, max("DateTime") as max_date FROM readings`);
    const { min_date, max_date } = rows[0];

    const data = {
        dateRequested: new Date(),
        dateLimits: {min: min_date, max: max_date},
        serialNumbers,
        deviceIds
    };

    sendPretty(res, data);
});

const simplifyWattageData = rows => {
    if(!rows || !rows.length) return {empty: true};

    const preserveDate = d => d!=null && d.constructor === Date ? d.toISOString() : d;
    const keepDateFirst = (a, b) => b.indexOf('Date') - a.indexOf('Date');
    const keys = Object.keys(rows[0]).sort( keepDateFirst );
    const values = rows.map( r => keys.map( k => preserveDate(r[k]) ).join('|') );
    return {count: values.length, keys:  keys.join('|'), values};
}

export default { path: '/api', handler: app };