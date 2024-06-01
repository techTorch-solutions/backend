const jwt = require("jsonwebtoken");
const userModel = require("../src/user/user.model");
const ErrorHandler = require("../utils/errorhandler");
const { StatusCodes } = require("http-status-codes");

exports.auth = async (req, res, next) => {
    console.log(req.headers.auth);
    try {
        if (!req.headers.auth) {
            return res.status(401).send({
                error: {
                    message: `Unauthorized. Please Send token in request header`,
                },
            });
        }

        const { userId } = jwt.verify(
            req.headers.auth,
            process.env.JWT_SECRET
        );
        console.log({ userId });

        req.userId = userId;

        next();
    } catch (error) {
        console.log(error);
        return res.status(401).send({ error: { message: `Unauthorized` } });
    }
};

exports.authRole = (roles) => async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId)
        console.log(user)
        if (!user)
            return next(
                new ErrorHandler(
                    "Invalid token. User not found.",
                    StatusCodes.NOT_FOUND
                )
            );

        if (!roles.includes(user.role))
            return next(new ErrorHandler("Restricted.", StatusCodes.UNAUTHORIZED));

        req.user = user;

        next();
    } catch (error) {
        console.log("ERRORRRRR", error)
        return next(new ErrorHandler("Unauthorized.", StatusCodes.UNAUTHORIZED, error));
    }
};
