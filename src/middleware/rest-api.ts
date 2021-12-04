import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { db } from './utils/connect-db';
import CONSTS from '../api.constants';
import { trace, getTime } from '../utils';
import { simplifyWattageData, fixTimezone } from '../utils.wattage.js';
import dayjs from 'dayjs';

const { ERROR_CODES, WATTAGE_READING } = CONSTS;

const logNow = (msg:any) => trace( `${new Date().toISOString()} - ${msg}`);

const sendError = (res:Response, err:any) => {
    logNow(err.error);
    res.status(400).json(err);
}

const sendPretty = (res:Response, data:any) => {
    res.type('json').end( JSON.stringify(data, null, '  ') );
}

const queryOptions = async (req:Request, statement:string) => await db.query(statement, (req as any).__.dbOptions);

const app = express();
app.use( bodyParser.json() );

app.get('/', (req, res) => {
    sendError(res, {
        error: 'The API needs to be accessed via its nested routes!',
        code: ERROR_CODES.API_CHILD_ROUTE_NEEDED
    });
});

app.all('/*', async (req, res, next) => {
    //Toss any private data here;
    const __:any = (req as any).__ = {};
    __.dateRequested = new Date();
    __.timeStart = __.dateRequested.getTime();
    __.dbOptions = {req, nocache: !!req.query.nocache};

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
    const { rows } = await queryOptions(req, `SELECT COUNT(*) FROM readings`);

    res.json(rows);
});

app.get('/readings/:offset?', async (req, res, next) => {
    const { __ } = req as any;

    const offset = parseInt(req.params.offset ?? '0');
    if(isNaN(offset) || offset < 0) {
        return sendError(res, {
            error: 'Wattage Readings offset should be 0 or greater (or omitted, defaults to 0), got: ' + offset,
            code: ERROR_CODES.WATTAGE_OFFSET_INVALID
        });
    }

    applyDateTimeFix( __ );
    logNow("Reading offset: " + offset);
    const { rows } = await queryOptions(req, `SELECT * FROM readings ORDER BY "DateTime" LIMIT ${WATTAGE_READING.LIMIT_PER_QUERY} OFFSET ${offset}`);

    __.timeDiff = getTime() - __.timeStart;
    const simplified = simplifyWattageData(rows);

    sendPretty(res, {
        timeToQueryMS: __.timeDiff,
        ... simplified
    });
});

app.get('/readings/date/:dateStart', async (req, res, next) => {
    const { __ } = req as any;

    const dateStart = dayjs(req.params.dateStart || '');
    
    if(!dateStart || !dateStart.isValid()) {
        return sendError(res, {
            error: `Wattage Readings 'dateStart' param is required and must be in the format YYYY-MM-DD, got: ${dateStart}`,
            code: ERROR_CODES.WATTAGE_OFFSET_INVALID
        });
    }
    
    applyDateTimeFix( __ );
    const toISO = (d:any) => d.toISOString(); //.replace('.000Z', '').replace('T',' ');
    const dateEnd = dateStart.add(WATTAGE_READING.SAMPLE_TIME_RANGE, WATTAGE_READING.SAMPLE_TIME_UNIT);
    const dateStartStr = toISO(dateStart);
    const dateEndStr = toISO(dateEnd);
    
    const q = [
        `SELECT * FROM readings`,
        `WHERE "DateTime" >= '${dateStartStr}'`,
        `AND "DateTime" < '${dateEndStr}'`,
        `ORDER BY "DateTime"`
    ].join(' ');
    
    try {
        const { rows } = await queryOptions(req, q);

        __.timeDiff = getTime() - __.timeStart;

        const simplified = simplifyWattageData(rows);
        const plural = WATTAGE_READING.SAMPLE_TIME_UNIT + (WATTAGE_READING.SAMPLE_TIME_RANGE > 1 ? 's' : '');

        sendPretty(res, {
            timeToQueryMS: __.timeDiff,
            timeRange: `${WATTAGE_READING.SAMPLE_TIME_RANGE} ${plural}`,
            dateRequested: __.dateRequested,
            dateStart: dateStartStr,
            dateEnd: dateEndStr,
            ... simplified
        });
    } catch(err:any) {
        sendError(res, {
            error: err.toString(),
            q,
            code: -1
        });
    }
});

app.get('/init-data', async (req, res, next) => {
    const getDistinct = async (distinctField:string) => {
        const { rows } = await queryOptions(req, `SELECT DISTINCT "${distinctField}" FROM readings LIMIT ${WATTAGE_READING.LIMIT_SERIAL_NUMBERS}`);
        return rows.map( (r:any) => r[distinctField] );
    };
    
    const serialNumbers = await getDistinct('Serial_Number');
    const deviceIds = await getDistinct('Device_ID');
    const { rows: rowsDate } = await queryOptions(req, `SELECT min("DateTime") as min_date, max("DateTime") as max_date FROM readings`);
    const { min_date, max_date } = rowsDate[0];

    const { rows: rowsWatts } = await queryOptions(req, `SELECT min("Wattage") as min_watts, max("Wattage") as max_watts FROM readings`);
    const { min_watts, max_watts } = rowsWatts[0];

    const data = {
        dateRequested: new Date(),
        dateLimits: {min: min_date, max: max_date},
        wattageLimits: {min: min_watts, max: max_watts},
        serialNumbers,
        deviceIds
    };

    sendPretty(res, data);
});

app.get('/time-now', async (req, res, next) => {
    const { __ } = req as any;
    __.dbOptions.nocache = true; //Never cache the DB server-time!

    const { rows } = await queryOptions(req, `SELECT NOW()`);
    const databaseTime = rows[0].now;
    const serverNow = new Date();
    const serverTime = serverNow.toISOString();
    const serverDateTime = serverNow.toString();
    sendPretty(res, {databaseTime, serverTime, serverDateTime});
})

function applyDateTimeFix( __:any ) {
    __.dbOptions.forEachRow = (row:any) => {
        row.DateTime = fixTimezone(row.DateTime);
    }
}

export default { path: '/api', handler: app };