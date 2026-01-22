export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
  
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      const message = 'Resource not found';
      error = { message, statusCode: 404 };
    }
  
    // Mongoose duplicate key
    if (err.code === 11000) {
      const message = 'Duplicate field value entered';
      error = { message, statusCode: 400 };
    }
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      error = { message, statusCode: 400 };
    }

    // JWT Token Expired Error
    if (err.name === 'TokenExpiredError') {
      const message = 'Token expired, please login again';
      error = { message, statusCode: 401 };
    }

    // JWT Invalid/Malformed Token Error
    if (err.name === 'JsonWebTokenError') {
      const message = 'Invalid token, please login again';
      error = { message, statusCode: 401 };
    }

    // JWT Not Before Error (token not active yet)
    if (err.name === 'NotBeforeError') {
      const message = 'Token not active yet';
      error = { message, statusCode: 401 };
    }

    // JSON Syntax Error (malformed JSON in request body)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      const message = 'Invalid JSON format in request body';
      error = { message, statusCode: 400 };
    }

    // MongoDB Connection Error
    if (err.name === 'MongoServerError' || err.name === 'MongoNetworkError') {
      const message = 'Database connection error';
      error = { message, statusCode: 500 };
    }

    // Mongoose Connection Error
    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      const message = 'Database error occurred';
      error = { message, statusCode: 500 };
    }

    // TypeError (common in Node.js)
    if (err instanceof TypeError) {
      const message = 'Type error occurred';
      error = { message, statusCode: 400 };
    }

    // Unauthorized Error
    if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
      const message = err.message || 'Not authorized to access this resource';
      error = { message, statusCode: 401 };
    }

    // Forbidden Error
    if (err.statusCode === 403) {
      const message = err.message || 'Access forbidden';
      error = { message, statusCode: 403 };
    }

    // Not Found Error
    if (err.statusCode === 404) {
      const message = err.message || 'Resource not found';
      error = { message, statusCode: 404 };
    }

    // Bad Request Error
    if (err.statusCode === 400) {
      const message = err.message || 'Bad request';
      error = { message, statusCode: 400 };
    }
  
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  };
  
  export default errorHandler;