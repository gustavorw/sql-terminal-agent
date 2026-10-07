# SQL Terminal Agent

Agente de terminal para consultar logs de acesso em SQLite usando perguntas em linguagem natural. O projeto usa o modelo `gpt-4o-mini`, por meio do AI SDK, para sugerir SQL e explicar os resultados em português.

## Como funciona

1. Você faz uma pergunta no terminal.
2. O agente gera uma consulta SQL e exibe sua explicação.
3. Você confirma a execução digitando `s`.
4. A consulta é executada no banco local e suas linhas são enviadas ao modelo para compor a resposta.

O projeto também inclui geração de logs fictícios com Faker e importação desses registros para SQLite.

## Requisitos

- Node.js 24 ou superior, com suporte a `node:sqlite`.
- npm.
- Uma chave de API da OpenAI e conexão com a internet para usar o agente.

A geração e a importação de logs são locais e não precisam da chave de API.

## Instalação e configuração

```bash
git clone https://github.com/gustavorw/sql-terminal-agent.git
cd sql-terminal-agent
npm ci
cp .env.example .env
```

Edite o arquivo `.env` com sua chave:

```dotenv
OPENAI_API_KEY=SUA_CHAVE_DE_API_AQUI
```

O arquivo `.env` é ignorado pelo Git. Execute os comandos a partir da raiz do projeto, pois os caminhos de `access.log` e `logs.db` são relativos ao diretório de execução.

## Preparar os dados

Gere, por exemplo, 1.000 registros fictícios e importe-os:

```bash
npm run seed -- 1000
npm run ingest
```

O gerador cria 20 usuários fictícios e distribui os acessos entre eles. Cada linha de `access.log` contém um objeto JSON com os dados de um acesso. A importação cria `logs.db` e a tabela `access_logs`, caso ainda não existam.

- A geração sobrescreve `access.log`. Sem uma quantidade, continua gerando registros sem limite definido.
- A importação acrescenta registros ao banco existente. Importar o mesmo arquivo novamente causa conflito de chave primária nos IDs já cadastrados.
- Linhas vazias ou com JSON inválido são ignoradas; registros com campos incompatíveis podem interromper a importação.

## Usar o agente

Inicie carregando as variáveis do `.env`:

```bash
node --env-file=.env src/index.js
```

Para desenvolvimento, com reinício automático ao alterar arquivos:

```bash
npm run dev
```

Exemplos de perguntas:

- Quantos acessos estão registrados?
- Quantos usuários distintos acessaram o sistema?
- Quais são os cinco usuários com mais acessos?
- Quantos acessos tivemos por cidade?
- Quais empresas aparecem com mais frequência nos logs?

Revise a SQL exibida e digite `s` para executá-la. Qualquer outra resposta cancela a execução daquela consulta. Use `Ctrl+C` para encerrar.

## Comandos disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run seed -- <quantidade>` | Gera a quantidade informada de logs fictícios. |
| `npm run ingest` | Importa `access.log` para `logs.db`. |
| `npm start` | Inicia o agente usando as variáveis já presentes no ambiente. |
| `npm run dev` | Inicia com `--watch` e carrega `.env`. |
| `npm run env:setup` | Copia `.env.example` para `.env.local`. |
| `npm test` | Executa os testes com o runner nativo do Node.js e mocks experimentais de módulos. |

**Configuração do ambiente:** `npm start` não carrega `.env` automaticamente. O script `env:setup` cria `.env.local`, mas `dev` lê `.env`; por isso, o passo a passo acima copia o exemplo diretamente para `.env`. Para usar `.env.local`, execute `node --env-file=.env.local src/index.js`.

## Estrutura

```text
src/
├── index.js       # Interface interativa e execução das consultas
├── ai.js          # Integração com o modelo e validação SQL
├── db.js          # Criação do banco e da tabela access_logs
├── constants.js   # Nomes dos arquivos e intervalo de progresso
├── mocks.js       # Geração de usuários e acessos fictícios
├── seed.js        # Escrita dos logs em JSON por linha
├── ingest.js      # Importação dos logs para SQLite
├── ai.spec.js     # Teste da geração de SQL
└── db.spec.js     # Teste de inserção no banco
```

## Modelo de dados

A tabela `access_logs` contém:

| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `id` | `TEXT PRIMARY KEY` | Identificador do acesso. |
| `ip` | `TEXT NOT NULL` | Endereço IP. |
| `username` | `TEXT NOT NULL` | Nome de usuário. |
| `first_name` | `TEXT NOT NULL` | Primeiro nome. |
| `last_name` | `TEXT NOT NULL` | Sobrenome. |
| `email` | `TEXT NOT NULL` | E-mail. |
| `location` | `TEXT NOT NULL` | Localidade. |
| `job_area` | `TEXT NOT NULL` | Área profissional. |
| `company` | `TEXT NOT NULL` | Empresa. |
| `job_title` | `TEXT NOT NULL` | Cargo. |
| `timestamp` | `TIMESTAMP NOT NULL` | Data do acesso, com padrão `CURRENT_TIMESTAMP`. |

## Limitações atuais

- O prompt orienta o modelo a gerar somente `SELECT` sobre `access_logs`. A validação local bloqueia uma lista de palavras-chave, mas não faz análise completa da SQL nem abre o banco em modo somente leitura.
- A pergunta, o esquema e, após a execução, a SQL e os resultados são enviados à API da OpenAI. Não há limite automático de linhas no retorno enviado ao modelo.
- O módulo `ai.js` contém uma chamada de demonstração executada durante sua importação. Ao iniciar o agente, ela pode gerar uma requisição adicional e imprimir uma sugestão SQL antes ou durante a interação.

## Licença

O arquivo [LICENSE](LICENSE) contém a licença Apache 2.0. O campo `license` do `package.json` ainda declara `ISC`; essa divergência está presente nos metadados atuais do projeto.
