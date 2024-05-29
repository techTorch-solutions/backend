const ErrorHandler = require("../utils/errorhandler");
const { StatusCodes } = require("http-status-codes");

module.exports = (err, req, res, next) => {
    console.error(err);
    err.message = err.message || "Internal Server Error";

    // Handle Mongoose CastError
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, StatusCodes.BAD_REQUEST);
    }

    // Handle Mongoose ValidationError
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map(value => value.message).join(', ');
        err = new ErrorHandler(message, StatusCodes.BAD_REQUEST);
    }

    // Handle Mongoose Duplicate Key Error
    if (err.code && err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `Duplicate value entered for ${field} field. Please use another value.`;
        err = new ErrorHandler(message, StatusCodes.BAD_REQUEST);
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        const message = `Invalid token, please try again`;
        err = new ErrorHandler(message, StatusCodes.UNAUTHORIZED);
    }

    if (err.name === "TokenExpiredError") {
        const message = `Token has expired, please login again`;
        err = new ErrorHandler(message, StatusCodes.UNAUTHORIZED);
    }

    res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
            message: err.message,
        },
    });
}
