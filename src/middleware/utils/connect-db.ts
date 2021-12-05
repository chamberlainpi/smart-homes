import { _, trace } from '../../utils';
import { Client } from 'pg';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import 'colors';

const privatePath = path.join(__dirname, '../../../.private/db-data');
const makeHash = (str:string) => crypto.createHash('md5').update(str).digest('hex');
const nonNumeric = (s:string) => !/^\d/.test(s);
const resolveCacheFile = (req:Request, statement:string) => {
    const prefix = _.trim(req.path, '/').split('/').filter(nonNumeric).join('-');
    const hashStatement = makeHash(statement).substr(0, 10);
    return `${prefix}_${hashStatement}.json`;
}

const atob = (str:string) => Buffer.from(str, 'base64').toString();

export const db:DBType = {
    isConnected: false,
    numQueries: 0,
    creds: null,
    client: null,

    async connect() {
        const credsEncoded = await fs.readFile('./src/creds.json.dat', 'utf8');
        const creds = db.creds = JSON.parse( atob(credsEncoded) );

        db.client = new Client( creds );
        db.client.connect();

        if(!fs.existsSync(privatePath)) {
            await fs.mkdirp(privatePath);
        }
    
        db.isConnected = true;
    },

    query(statement:string, opts={}) {
        const { client } = db;
        const { nocache, req, forEachRow }:any = opts;
        db.numQueries++;
        
        return new Promise(async (_then, _catch) => {
            const hashFile = resolveCacheFile(req, statement);
            const hashPath = path.join(privatePath, hashFile);
            const hashPathShort = '.\\' + hashPath.split('.private\\').pop();
            const useCache = !nocache && fs.existsSync(hashPath);
            const logLine = ` [${useCache ? 'CACHED' : 'FROM-DB'}] ${hashPathShort}`
            
            
            if(useCache) {
                const rows = await fs.readJson(hashPath);
                trace(logLine.green, `count: ${rows.length}`);
                _then({ rows });
            } else {
                client.query(statement, async (err:Error, res:any) => {
                    if(err) return _catch(err);
                    
                    if(forEachRow) {
                        res.rows.forEach( forEachRow );
                    }

                    if(!nocache) {
                        trace("Caching...".magenta, res.rows[0].DateTime);
                        await fs.writeJson(hashPath, res.rows);
                    }

                    trace(logLine.gray, `count: ${res.rows.length}`);
                    _then(res);
                });
            }
        });
    },
};

interface DBType {
    isConnected:boolean,
    numQueries:number,
    creds:any,
    client:any,
    connect:Function,
    query:Function,
}