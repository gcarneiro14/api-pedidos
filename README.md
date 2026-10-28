# API de Gerenciamento de Pedidos

Projeto prático avaliativo — Tópicos Avançados em Sistemas de Informação II.
**Aluno:** _[SEU NOME]_ — **RA:** _[SEU RA]_

API REST para gerenciar pedidos de uma pequena loja, feita com Node.js e Express (JavaScript), com armazenamento em memória.

## Instalação e execução

```bash
npm install
npm start      # sobe a API em http://localhost:3000
npm test       # executa os testes automatizados (Jest + Supertest)
```

A porta pode ser alterada com a variável de ambiente `PORT`. Os dados ficam em memória e são perdidos ao reiniciar.

## Valores aceitos

| Campo | Valores |
|---|---|
| `tipo` | `entrega`, `retirada`, `local` |
| `prioridade` | `baixa`, `normal`, `alta` |
| `status` | `recebido`, `em_preparacao`, `enviado`, `entregue`, `cancelado` |

## Rotas

| Método | Rota | Sucesso | Erros |
|---|---|---|---|
| POST | `/pedidos` | 201 | 400 |
| GET | `/pedidos` | 200 | — |
| GET | `/pedidos/:id` | 200 | 404 |
| PATCH | `/pedidos/:id/status` | 200 | 400, 404 |

Erros retornam JSON no formato `{ "erro": "mensagem explicativa" }`. Erros inesperados retornam 500 com mensagem genérica (o detalhe fica apenas no log do servidor).

### Exemplos

**POST /pedidos**
```json
{ "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal" }
```
Resposta `201`:
```json
{ "id": 1, "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal", "status": "recebido" }
```

**PATCH /pedidos/1/status**
```json
{ "status": "em_preparacao" }
```

**Resposta de erro (400)**
```json
{ "erro": "O campo \"cliente\" é obrigatório e não pode ser vazio." }
```

## Regras de validação

- `cliente`: texto não vazio (espaços nas extremidades são removidos antes de salvar).
- `valor`: número (tipo `number` no JSON, `"350"` é rejeitado) e maior que zero.
- `tipo` e `prioridade`: devem estar nas listas acima.
- Todo pedido nasce com status `recebido`.
- ID inexistente (ou malformado, como `abc`) → 404. Se o ID não existe, o 404 tem precedência sobre erros do corpo.
- JSON malformado → 400.

## Regras de transição de status

| De | Para (permitido) |
|---|---|
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue` | — (final) |
| `cancelado` | — (final) |

Transição não permitida → 400 com mensagem listando as transições válidas. Escolhi 400 (e não 409) porque o enunciado define 400 para "dados inválidos" na atualização de status.

## Arquitetura

Arquitetura em camadas, cada uma com uma responsabilidade:

```
src/
├── server.js                  # inicia o servidor (listen)
├── app.js                     # configura Express, rotas e middlewares
├── routes/                    # mapeia método + URL -> controller
├── controllers/               # traduz HTTP <-> service (status codes, req/res)
├── services/                  # regras de negócio e validações
├── repositories/              # acesso aos dados (array em memória)
├── errors/                    # AppError, ValidationError (400), NotFoundError (404)
└── middlewares/errorHandler.js# converte erros em respostas HTTP
tests/                         # testes unitários (service) e de API (Supertest)
```

Fluxo: `rota → controller → service → repository`. O service lança `ValidationError`/`NotFoundError`; o controller chama `next(err)`; o `errorHandler` converte em 400/404, ou 500 se o erro não for conhecido.

`app.js` e `server.js` são separados para que os testes importem o `app` sem abrir uma porta.

## Testes

- **Automatizados:** `npm test` (Jest). Cobrem validações, fluxo de status, 404, 400, JSON malformado e 500.
- **Manuais:** importe `postman/pedidos.postman_collection.json` no Postman. Os prints estão em `evidencias/`.

## Uso de IA

> **Preencha esta seção com a sua experiência real.** O enunciado exige honestidade e ao menos uma sugestão aceita, modificada ou rejeitada, com justificativa.

- **Utilizei IA?** Sim, o Claude (Anthropic).
- **Para quais tarefas?** _[ex.: gerar a estrutura inicial do projeto, escrever testes, rascunhar o README]_
- **Sugestão aceita/modificada/rejeitada:** _[Descreva uma decisão sua. Exemplo de formato: "A IA sugeriu X; eu modifiquei/rejeitei porque Y." Possibilidades reais neste projeto: usar 400 vs. 409 para transição inválida; aceitar `valor` como texto numérico `"350"` ou exigir `number`; retornar 404 ou 400 para ID malformado como `abc`.]_
