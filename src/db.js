import { DatabaseSync } from 'node:sqlite'


export function createDatabase(path = ':memory:') {
    const db = new DatabaseSync(path)
    db.exec(`
        CREATE TABLE IF NOT EXISTS access_logs (
            ip TEXT NOT NULL,
            username TEXT NOT NULL,
            fist_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            location TEXT NOT NULL,
            job_area TEXT NOT NULL,
            company TEXT NOT NULL,
            job_title TEXT NOT NULL,
            id TEXT PRIMARY KEY NOT NULL,
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        `)
    return db
}





const db = createDatabase('access_logs.db')

