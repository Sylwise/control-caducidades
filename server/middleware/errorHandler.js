const AppError = require("../utils/AppError");
const logger = require("../logger");

const handleCastErrorDB = err => {
  const message = `Inválido ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'Duplicate field';
  const message = `Valor duplicado: ${value}. Por favor use otro valor.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Datos inválidos: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

module.exports = (err, req, res, next) => {
  // logger.error(err.stack); // Optional: keep logs clean during tests?

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  
  if (err.name === 'CastError') error = handleCastErrorDB(error);
  if (err.code === 11000) error = handleDuplicateFieldsDB(error);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(error);

  if (process.env.NODE_ENV === 'development') {
      res.status(error.statusCode || 500).json({
          status: error.status,
          error: error,
          message: error.message,
          stack: error.stack
      });
  } else {
      if (error.isOperational) {
          res.status(error.statusCode).json({
              status: error.status,
              message: error.message
          });
      } else {
          console.error('ERROR 💥', error);
          res.status(500).json({
              status: 'error',
              message: 'Algo salió muy mal!'
          });
      }
  }
};
