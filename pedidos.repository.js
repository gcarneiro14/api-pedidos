// Armazenamento em memória. Isola a persistência: trocar por um banco
// de dados exigiria alterar apenas este arquivo.
let pedidos = [];
let proximoId = 1;

function criar(dados) {
  const pedido = { id: proximoId++, ...dados };
  pedidos.push(pedido);
  return { ...pedido };
}

function listar() {
  return pedidos.map((p) => ({ ...p }));
}

function buscarPorId(id) {
  const pedido = pedidos.find((p) => p.id === id);
  return pedido ? { ...pedido } : null;
}

function atualizarStatus(id, status) {
  const pedido = pedidos.find((p) => p.id === id);
  if (!pedido) return null;
  pedido.status = status;
  return { ...pedido };
}

// Usado apenas nos testes.
function limpar() {
  pedidos = [];
  proximoId = 1;
}

module.exports = { criar, listar, buscarPorId, atualizarStatus, limpar };
