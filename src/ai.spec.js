import { describe, it } from "node:test";
import { equal } from "node:assert";

describe('Teste para a integração com o modelo de linguagem', () => {

    it('Deve gerar uma query SQL válida para uma pergunta simples', async (ctx) => {


        ctx.mock.module('ai', {
            namedExports: {
                generateText: async () => ({
                    experimental_output: {
                        sql: 'SELECT DATE(timestamp) AS dia, COUNT(*) AS total FROM access_logs GROUP BY DATE(timestamp)',
                        explanation: 'Conta os acessos por dia.',
                    },
                }),
                Output: {
                    object: (options) => options,
                },
            },
        });

        const { generateSqlObject } = await import('./ai.js');
        const question = 'Quantos acessos tivemos por dia ?';
        const { sql, explanation } = await generateSqlObject(question);

        equal(typeof sql, 'string');
    });
});