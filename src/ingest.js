import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { LOG_FILE, LOG_INTERVAl } from './constants.js'
import { createDatabase } from './db.js'

const db = createDatabase()

const fileStream = createReadStream(LOG_FILE)
const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
})

console.log(`Iniciando ingestão de logs do arquivo ${LOG_FILE} para o banco de dados...`)

let count = 0
for await (const line of rl) {

    if (!line.trim()) continue;


    let record;

    try {
        record = JSON.parse(line)
    } catch (err) {
        continue;
    }

    db.prepare(`
        INSERT INTO access_logs(
            ip,
            username,
            first_name,
            last_name,
            email,
            location,
            job_area,
            company,
            job_title,
            id,
            timestamp
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        `).run(
        record.ip,
        record.username,
        record.first_name,
        record.last_name,
        record.email,
        record.location,
        record.job_area,
        record.company,
        record.job_title,
        record.id,
        record.timestamp
    )
    count++

    if (count % LOG_INTERVAl === 0) {
        console.log(`Registros ingeridos: ${count.toLocaleString()}`)
    }
}

console.log(`Ingestão concluída. Total de registros ingeridos: ${count.toLocaleString()}`)
db.close()