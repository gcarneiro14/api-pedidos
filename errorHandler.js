const { AppError } = require('../errors/AppError');

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Erros de negócio/validação conhecidos
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  // JSON malformado enviado pelo cliente
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  // Qualquer outro erro é inesperado: não vaza detalhes ao cliente.
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { errorHandler, rotaNaoEncontrada };
