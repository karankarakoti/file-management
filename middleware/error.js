const ErrorHandler = require("../utils/error-handler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";  

  // JWT Error
  if(err.name === "JsonWebTokenError"){
    const message = "Token is invalid. Try Again!!!";
    err = new ErrorHandler(400, message);
  };

  // JWT Expired Error
  if(err.name === "TokenExpiredError"){
    const message = "Token is expired. Relogin & Try Again!!!";
    err = new ErrorHandler(400, message);
  };

  if(process.env.NODE_ENV === "development")  console.log(err.stack);

  res.status(err.statusCode).json({
    success: false,
    error: err.message,    
  });
}