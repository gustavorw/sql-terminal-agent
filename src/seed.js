import { createWriteStream, statSync } from 'node:fs'
import { faker } from '@faker-js/faker'

const LOG_FILE = 'access.log'
const LOG_INTERVAl = 1 * 1000 // 1s
const maxRecords = Number(process.argv[2] || Infinity)

if ((!Number.isInteger(maxRecords) && Number.isFinite(maxRecords)) || maxRecords <= 0 || Number.isNaN(maxRecords)) {
    console.error('Uso: npm run seed -- <quantidade>')
    console.error('A quantidade deve ser um número inteiro maior que zero.')
    process.exit(1)
}

const stream = createWriteStream(LOG_FILE)

function generateUser() {
    return {
        ip: faker.internet.ip(),
        username: faker.internet.userName(),
        fist_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        location: faker.location.city(),
        job_area: faker.person.jobArea(),
        company: faker.company.name(),
        job_title: faker.person.jobTitle(),
        id: faker.string.uuid(),
    }
}

function generateLogEntry(user) {

    return {
        ...user,
        timestamp: faker.date.recent().toISOString(),
    }
}

function writeRecord(line) {
    return new Promise((resolve) => {
        if (!stream.write(line)) {
            stream.once('drain', resolve)
        } else {
            resolve()
        }
    })

}

function convertFromBytesToGb(bytes) {
    return (bytes / 1024 / 1024 / 1024).toFixed(4)
}

console.log(`Gerando logs de acessos falsos em ${LOG_FILE}... CONTROL + C para parar`)
console.log(`Limite de registros ${maxRecords.toLocaleString()}`)

const users = Array.from({ length: 20 }, generateUser)

let count = 0
while (count < maxRecords) {
    const user = faker.helpers.arrayElement(users)
    const record = generateLogEntry(user)
    await writeRecord(JSON.stringify(record) + '\n')
    count++
    if (count % LOG_INTERVAl == 0) {
        const { size } = statSync(LOG_FILE)
        console.log(`Registros: ${count.toLocaleString()}, tamanho do arquivo ${convertFromBytesToGb(size)} GB `)
    }
}

process.on('SIGINT', () => {
    stream.end(() => {
        const { size } = statSync(LOG_FILE)
        console.log(`Geração interrompida. Registros: ${count.toLocaleString()}, tamanho ${convertFromBytesToGb(size)} GB`)
    })
})

stream.end(() => {
    const { size } = statSync(LOG_FILE)
    console.log(`Geração concluída. Registros: ${count.toLocaleString()}, tamanho ${convertFromBytesToGb(size)} GB`)
})