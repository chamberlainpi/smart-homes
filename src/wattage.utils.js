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
    const readings = [];
    
    //Parse the data based on supplied *keys* and *values* that are pipe-delimited.
    //////////// TODO 

    return readings;
}
