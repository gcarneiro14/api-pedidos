const service = require('../src/services/pedidos.service');
const repository = require('../src/repositories/pedidos.repository');

const pedidoValido = { cliente: 'Carlos Silva', tipo: 'entrega', valor: 350, prioridade: 'normal' };

beforeEach(() => repository.limpar());

describe('criar', () => {
  test('cria pedido com status inicial "recebido" e id sequencial', () => {
    const p1 = service.criar(pedidoValido);
    const p2 = service.criar(pedidoValido);
    expect(p1).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
    expect(p2.id).toBe(2);
  });

  test('remove espaços nas extremidades do cliente', () => {
    expect(service.criar({ ...pedidoValido, cliente: '  Ana  ' }).cliente).toBe('Ana');
  });

  test.each([
    ['cliente vazio', { cliente: '' }],
    ['cliente só com espaços', { cliente: '   ' }],
    ['cliente ausente', { cliente: undefined }],
    ['cliente não texto', { cliente: 123 }],
    ['valor zero', { valor: 0 }],
    ['valor negativo', { valor: -5 }],
    ['valor em texto', { valor: '350' }],
    ['valor NaN', { valor: NaN }],
    ['valor ausente', { valor: undefined }],
    ['tipo desconhecido', { tipo: 'voador' }],
    ['prioridade desconhecida', { prioridade: 'urgentissima' }],
  ])('rejeita %s', (_nome, alteracao) => {
    expect(() => service.criar({ ...pedidoValido, ...alteracao })).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  test('rejeita corpo que não é objeto', () => {
    expect(() => service.criar(undefined)).toThrow(expect.objectContaining({ statusCode: 400 }));
    expect(() => service.criar([])).toThrow(expect.objectContaining({ statusCode: 400 }));
  });
});

describe('buscarPorId', () => {
  test('retorna pedido existente', () => {
    service.criar(pedidoValido);
    expect(service.buscarPorId('1').id).toBe(1);
  });

  test.each(['99', 'abc', '-1', '1.5', '1abc'])('lança 404 para id "%s"', (id) => {
    service.criar(pedidoValido);
    expect(() => service.buscarPorId(id)).toThrow(expect.objectContaining({ statusCode: 404 }));
  });
});

describe('atualizarStatus', () => {
  test('percorre o fluxo completo válido', () => {
    service.criar(pedidoValido);
    expect(service.atualizarStatus('1', { status: 'em_preparacao' }).status).toBe('em_preparacao');
    expect(service.atualizarStatus('1', { status: 'enviado' }).status).toBe('enviado');
    expect(service.atualizarStatus('1', { status: 'entregue' }).status).toBe('entregue');
  });

  test('permite cancelar um pedido recebido', () => {
    service.criar(pedidoValido);
    expect(service.atualizarStatus('1', { status: 'cancelado' }).status).toBe('cancelado');
  });

  test('rejeita transição inválida (recebido -> entregue)', () => {
    service.criar(pedidoValido);
    expect(() => service.atualizarStatus('1', { status: 'entregue' })).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  test('status finais não podem ser alterados', () => {
    service.criar(pedidoValido);
    service.atualizarStatus('1', { status: 'cancelado' });
    expect(() => service.atualizarStatus('1', { status: 'recebido' })).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  test('rejeita status inexistente ou ausente', () => {
    service.criar(pedidoValido);
    expect(() => service.atualizarStatus('1', { status: 'xyz' })).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
    expect(() => service.atualizarStatus('1', {})).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
    expect(() => service.atualizarStatus('1', undefined)).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  test('id inexistente retorna 404 mesmo com corpo inválido', () => {
    expect(() => service.atualizarStatus('99', {})).toThrow(
      expect.objectContaining({ statusCode: 404 })
    );
  });
});
