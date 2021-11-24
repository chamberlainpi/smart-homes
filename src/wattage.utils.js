import dayjs from 'dayjs';
import { _ } from './utils';

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


export function parseSimplifiedWattageData( wattageData ) {
    console.clear();
    
    const { keys: keysPiped, values: valuesPiped } = wattageData;
    
    const dateRegex = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d/g;
    
    const castData = d => {
        if(!d || !d.length) return null;
        // if(dateRegex.test(d)) return new Date(d);
        return d;
    }

    const keys = keysPiped.split('|');
    const readings = valuesPiped.map( vPiped => {
        const reading = {};
        const vSplit = vPiped.split('|');
        for(var k in keys) {
            const key = keys[k];
            reading[key] = castData(vSplit[k]);
        }
        return reading;
    });

    
    //Parse the data based on supplied *keys* and *values* that are pipe-delimited.
    trace(readings.length, readings[0]);

    return readings;
}
