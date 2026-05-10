import { rejects } from 'assert';
import csv from 'csv-parser';
import { resolve } from 'dns';
import { Readable } from 'stream';


export async function parseCsv(fileBuffer: Buffer): Promise<any[]>{
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        const stream = Readable.from(fileBuffer);

        stream.pipe(csv({
            mapHeaders:({header})=> header.trim()
        }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

