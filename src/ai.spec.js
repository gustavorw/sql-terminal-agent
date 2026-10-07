import { describe, it } from "node:test";
import { equal } from "node:assert";

describe('Teste para a integração com o modelo de linguagem', () => {

    it('Deve gerar uma query SQL válida para uma pergunta simples', async (ctx) => {

        // Mock do módulo 'ai' sem tentar exportar 'Output'
        ctx.mock.module('ai', {
            namedExports: {
                generateText: async ({ system, prompt }) => {
                    return {
                        experimental_output: {
                            sql: 'SELECT COUNT(*) FROM acessos GROUP BY DATE(data)',
                            explanation: 'Esta query retorna o número de acessos por dia, agrupando os registros pela data.'
                        }
                    };
                }
            }
        });

        const { generateSqlObject } = await import('./ai.js');
        const question = 'Quantos acessos tivemos por dia ?';
        const { sql, explanation } = await generateSqlObject(question);

        equal(typeof sql, 'string');
    });
});