const request = require('supertest');
const app = require('../src/app');
const repository = require('../src/repositories/pedidos.repository');

const pedidoValido = { cliente: 'Carlos Silva', tipo: 'entrega', valor: 350, prioridade: 'normal' };

beforeEach(() => repository.limpar());

describe('POST /pedidos', () => {
  test('201 com pedido criado', async () => {
    const res = await request(app).post('/pedidos').send(pedidoValido);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
  });

  test('400 com mensagem JSON para dados inválidos', async () => {
    const res = await request(app).post('/pedidos').send({ ...pedidoValido, cliente: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/cliente/);
  });

  test('400 para valor não positivo', async () => {
    const res = await request(app).post('/pedidos').send({ ...pedidoValido, valor: 0 });
    expect(res.status).toBe(400);
  });

  test('400 para JSON malformado', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{ cliente: ');
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('400 quando não há corpo', async () => {
    const res = await request(app).post('/pedidos');
    expect(res.status).toBe(400);
  });
});

describe('GET /pedidos', () => {
  test('200 com lista vazia', async () => {
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('200 com pedidos cadastrados', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /pedidos/:id', () => {
  test('200 para pedido existente', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).get('/pedidos/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  test('404 para pedido inexistente', async () => {
    const res = await request(app).get('/pedidos/999');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });
});

describe('PATCH /pedidos/:id/status', () => {
  test('200 em atualização válida', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'em_preparacao' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_preparacao');
  });

  test('400 para status inválido', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'voando' });
    expect(res.status).toBe(400);
  });

  test('400 para transição não permitida', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'entregue' });
    expect(res.status).toBe(400);
  });

  test('404 para id inexistente', async () => {
    const res = await request(app).patch('/pedidos/999/status').send({ status: 'cancelado' });
    expect(res.status).toBe(404);
  });
});

describe('Outros', () => {
  test('404 para rota desconhecida', async () => {
    const res = await request(app).get('/qualquer');
    expect(res.status).toBe(404);
  });

  test('500 para erro inesperado, sem vazar detalhes', async () => {
    const spy = jest.spyOn(repository, 'listar').mockImplementation(() => {
      throw new Error('falha interna secreta');
    });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/secreta/);
    spy.mockRestore();
    errSpy.mockRestore();
  });
});
