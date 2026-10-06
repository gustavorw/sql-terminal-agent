import { createInterface } from 'node:readline'
import { styleText } from 'node:util'
import { generateSqlObject, generateTextAnswer } from './ai.js'
import { createDatabase } from './db.js'
import { DB_NAME } from './constants.js'

const db = createDatabase(DB_NAME)

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
})

function prompt(text) {
    return new Promise(resolve => rl.question(text, resolve))
}

rl.on('close', () => {
    db.close()
    console.log(styleText('gray', 'Encerrando o agent. Até a próxima!'))
    process.exit(0)
})

console.log(styleText(['bold', 'cyan'], '\nBem-vindo ao SQL Terminal Agent! Precione Ctrl+C para sair.'))

while (true) {
    const question = await prompt(styleText(['bold', 'magenta'], 'Pergunta: '))
    if (!question.trim()) {
        continue
    }

    try {
        const { sql, explanation } = await generateSqlObject(question)
        console.log(styleText('cyan', '\nSQL sugerido:'))
        console.log(styleText('red', sql))
        console.log(styleText('cyan', '\nExplicação:'))
        console.log(styleText('yellow', explanation))
        const confirm = await prompt(styleText(['bold', 'green'], '\nDeseja executar a query? (s/n):'))
        if (confirm.toLowerCase() === 's') {
            const result = await db.prepare(sql).all().map(row => ({ ...row }))
            const answer = await generateTextAnswer({
                question, sql, rows: result
            })
            console.log(styleText('green', '\nResposta:'))
            console.log(styleText('white', answer))
        } else {
            console.log(styleText('yellow', 'Sql não executado.'))
        }

    } catch (error) {
        console.log(styleText('red', 'Erro ao processar a solicitação'), error.message)
    }

}