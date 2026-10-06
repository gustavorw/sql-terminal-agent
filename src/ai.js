import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const model = openai('gpt-4o-mini', {
    apiKey: process.env.OPENAI_API_KEY,
})

const SCHEMA_DESCRIPTION = `
    Tabela: access_logs
    Colunas:
    - ip TEXT NOT NULL,
    - username TEXT NOT NULL,
    - first_name TEXT NOT NULL,
    - last_name TEXT NOT NULL,
    - email TEXT NOT NULL,
    - location TEXT NOT NULL,
    - job_area TEXT NOT NULL,
    - company TEXT NOT NULL,
    - job_title TEXT NOT NULL,
    - id TEXT PRIMARY KEY,
    - timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

`

const sqlSuggestionSchema = z.object({
    sql: z.string(),
    explanation: z.string(),
})

const BLOCKED_KEYWORDS = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'REPLACE', 'PRAGMA', 'ATTACH', 'DETACH', 'VACUUM', 'REINDEX', 'ANALYZE', 'BEGIN', 'COMMIT', 'ROLLBACK'];

export function validateSql(sql) {
    if (typeof sql !== 'string' || !sql.trim()) {
        throw new Error('A query SQL é inválida.');
    }
    const safeSql = sql.trim().replace(/;$/, '').trim();

    for (const keyword of BLOCKED_KEYWORDS) {
        if (new RegExp(`\\b${keyword}\\b`, 'i').test(safeSql)) {
            throw new Error(`A query SQL contém uma palavra-chave bloqueada: ${keyword}`);
        }

    }
    return safeSql;
}

export async function generateSqlObject(question) {
    const { experimental_output } = await generateText({
        model,
        experimental_output: Output.object({ schema: sqlSuggestionSchema }),
        system: `
      Você é um assistente especialista em SQLite.

      Sua tarefa é gerar uma única query SQL para responder pergunta do(a) usuário(a).

      Regras obrigatórias:
      - Gere apenas SELECT.
      - Use apenas a tabela access_logs.
      - Não use ${BLOCKED_KEYWORDS.join(', ')}.
      - Não gere múltiplas queries.
      - Não use comentários SQL.
      - Se a pergunta não puder ser respondida com o schema disponível, gere uma query simples de inspeção ou explique a limitação.

      Schema disponível:
      ${SCHEMA_DESCRIPTION}`,
        prompt: `
      Pergunta do usuário:
      ${question}
    `,
    });

    if (!experimental_output?.sql) {
        throw new Error('O modelo nao retornou uma sugestão SQL valida.');
    }

    return {
        sql: validateSql(experimental_output.sql),
        explanation: experimental_output.explanation,
    };
}

const sql = generateSqlObject("Quantos usuários únicos acessaram o sistema no último mês?").then(
    ({ sql, explanation }) => {
        console.log("SQL:", sql);
        console.log("Explicação:", explanation);
    }
)

export async function generateTextAnswer({ question, sql, rows }) {
    const { text } = await generateText({
        model,
        system: `
      Responda em português, de forma objetiva, apenas com base nos dados retornados.
      Se o resultado estiver vazio, diga isso claramente.
    `,
        prompt: `
      Pergunta original:
      ${question}

      SQL executada:
      ${sql}

      Linhas retornadas em JSON:
      ${JSON.stringify(rows, null, 2)}

      Resposta:
    `,
    });

    return text.trim();
}