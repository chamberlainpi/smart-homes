import dayjs from 'dayjs';
import Chance from 'chance';
import { _, defer, getTime } from './utils';

export function organizeReadings( readings ) {
    const organized = { Serial_Number: {}, Device_ID: {} };

    /**
     * Catalogs all readings into their respective Serial_Number & Device_ID.
     * Example:
     *   organized.Serial_Number.XYZ123[0] == (1 reading)
     */
    _.forOwn(organized, (obj, field) => {
        for(var reading of readings) {
        const value = reading[field];
        if(!(value in obj)) obj[value] = [];
        obj[value].push( reading );
        }
    });

    return organized;
}


export async function parseSimplifiedWattageData( wattageData ) {
    const { keys: keysPiped, values: valuesPiped } = wattageData;
    
    // const dateRegex = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d/g;
    const castData = d => {
        if(!d || !d.length) return null;
        // if(dateRegex.test(d)) return new Date(d);
        return d;
    }

    //Parse the data based on supplied *keys* and *values* that are pipe-delimited.
    const keys = keysPiped.split('|');
    const readings = [];

    var timeLast = getTime();
    var timeFrames = 0;
    const oneFrameMS = 1000 / 60;

    for(var vPiped of valuesPiped) {
        const reading = {};
        const vSplit = vPiped.split('|');
        for(var k in keys) {
            const key = keys[k];
            reading[key] = castData(vSplit[k]);
        }

        readings.push( reading );

        const timeNow =  getTime();
        const timeDiff = timeNow - timeLast;

        if(timeDiff > oneFrameMS) {
            timeLast = timeNow;
            timeFrames++;
            trace(' *TICK!* ');
            await defer();
        }
    }

    trace(`*parseSimplifiedWattageData* lasted for ${timeFrames} frames.`);
    
    return readings;
}


export function generateMockupData( total ) {
  const chance = new Chance('JUST A SEED HERE');
  const mockupLocations = 'Basement,LivingRoom,Kitchen,Garage'.split(',');
  const randInt = range => chance.natural({max: range});

  const mockupEntries = _.times(total, () => ({
    DateTime: dayjs('2019-04-29T03:00:00.000Z').add(randInt(10000), 'minute').toISOString(),
    Serial_Number: chance.hash({length: 8}),
    Device_Type: chance.pickone(mockupLocations),
    Wattage: chance.floating({min:0, max: 1000})
  }));

  const mockupBounds = getMinMaxDates( mockupEntries );

  return {mockupEntries, mockupBounds};
}

export function getMinMaxDates( entries ) {
    var min = new Date().getTime();
    var max = 0;

    for(var entry of entries) {
        var millis = new Date(entry.DateTime).getTime();
        if(millis < min) min = millis;
        if(millis > max) max = millis;
    }

    const toISO = d => new Date(d).toISOString();

    return [toISO(min), toISO(max)];
}

export const simplifyWattageData = rows => {
    if(!rows || !rows.length) return {empty: true};

    const preserveDate = d => d!=null && d.constructor === Date ? d.toISOString() : d;
    const keepDateFirst = (a, b) => b.indexOf('Date') - a.indexOf('Date');
    const keys = Object.keys(rows[0]).sort( keepDateFirst );
    const values = rows.map( r => keys.map( k => preserveDate(r[k]) ).join('|') );
    
    return {
        count: values.length,
        keys:  keys.join('|'),
        values
    };
}