const repository = require('../repositories/pedidos.repository');
const { ValidationError, NotFoundError } = require('../errors/AppError');

const TIPOS = ['entrega', 'retirada', 'local'];
const PRIORIDADES = ['baixa', 'normal', 'alta'];
const STATUS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];

// Transições permitidas de status.
const TRANSICOES = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: [],
};

function isObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function validarNovoPedido(dados) {
  if (!isObjeto(dados)) {
    throw new ValidationError('O corpo da requisição deve ser um objeto JSON.');
  }

  const { cliente, tipo, valor, prioridade } = dados;

  if (typeof cliente !== 'string' || cliente.trim() === '') {
    throw new ValidationError('O campo "cliente" é obrigatório e não pode ser vazio.');
  }
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    throw new ValidationError('O campo "valor" deve ser numérico e maior que zero.');
  }
  if (!TIPOS.includes(tipo)) {
    throw new ValidationError(`O campo "tipo" deve ser um de: ${TIPOS.join(', ')}.`);
  }
  if (!PRIORIDADES.includes(prioridade)) {
    throw new ValidationError(
      `O campo "prioridade" deve ser um de: ${PRIORIDADES.join(', ')}.`
    );
  }

  return { cliente: cliente.trim(), tipo, valor, prioridade };
}

// Converte o parâmetro de rota em número. Retorna null se não for
// um inteiro positivo (nesse caso, o pedido certamente não existe).
function converterId(idTexto) {
  if (!/^\d+$/.test(String(idTexto))) return null;
  return Number(idTexto);
}

function criar(dados) {
  const validos = validarNovoPedido(dados);
  return repository.criar({ ...validos, status: 'recebido' });
}

function listar() {
  return repository.listar();
}

function buscarPorId(idTexto) {
  const id = converterId(idTexto);
  const pedido = id === null ? null : repository.buscarPorId(id);
  if (!pedido) {
    throw new NotFoundError(`Pedido ${idTexto} não encontrado.`);
  }
  return pedido;
}

function atualizarStatus(idTexto, dados) {
  // 1º: o pedido existe? (404 tem precedência sobre 400)
  const pedido = buscarPorId(idTexto);

  if (!isObjeto(dados) || typeof dados.status !== 'string') {
    throw new ValidationError('O campo "status" é obrigatório e deve ser texto.');
  }
  const novoStatus = dados.status;

  if (!STATUS.includes(novoStatus)) {
    throw new ValidationError(`Status inválido. Valores aceitos: ${STATUS.join(', ')}.`);
  }
  if (!TRANSICOES[pedido.status].includes(novoStatus)) {
    const permitidas = TRANSICOES[pedido.status];
    const detalhe = permitidas.length
      ? `Transições permitidas: ${permitidas.join(', ')}.`
      : 'Este status é final e não pode ser alterado.';
    throw new ValidationError(
      `Transição inválida de "${pedido.status}" para "${novoStatus}". ${detalhe}`
    );
  }

  return repository.atualizarStatus(pedido.id, novoStatus);
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizarStatus,
  TIPOS,
  PRIORIDADES,
  STATUS,
  TRANSICOES,
};
