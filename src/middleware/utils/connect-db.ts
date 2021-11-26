import { _ } from '../../utils';
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
        const { nocache, req }:any = opts;
        db.numQueries++;
        
        return new Promise(async (_then, _catch) => {
            const hashFile = resolveCacheFile(req, statement);
            const hashPath = path.join(privatePath, hashFile);
            
            if(nocache || !fs.existsSync(hashPath)) {
                trace(" --- ", hashPath.gray);
                client.query(statement, async (err:Error, res:any) => {
                    if(err) return _catch(err);
                    
                    if(!nocache) {
                        await fs.writeJson(hashPath, res.rows);
                    }
                    _then(res);
                });
            } else {
                trace(" --- ", hashPath.green, '[CACHED]');
                const rows = await fs.readJson(hashPath);
                _then({ rows });
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