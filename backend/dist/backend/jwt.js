"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTMiddleware = exports.verifyToken = exports.signToken = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_errors_1 = __importDefault(require("http-errors"));
dotenv_1.default.config();
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const signToken = (payload, expiresIn = '1800s') => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.sign({ payload }, accessTokenSecret, { algorithm: 'HS512', expiresIn }, (err, token) => {
            if (err)
                return reject(http_errors_1.default.InternalServerError());
            resolve(token);
        });
    });
};
exports.signToken = signToken;
const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, accessTokenSecret, (err, payload) => {
            if (err) {
                const message = err.name == 'JsonWebTokenError' ? 'Unauthorized' : err.message;
                return reject(http_errors_1.default.Unauthorized(message));
            }
            resolve(payload);
        });
    });
};
exports.verifyToken = verifyToken;
const JWTMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const unauthorizedMessage = 'Access token is required';
    if (!req.headers.authorization)
        return next(http_errors_1.default.Unauthorized(unauthorizedMessage));
    const token = req.headers.authorization.split(' ')[1];
    if (!token)
        return next(http_errors_1.default.Unauthorized(unauthorizedMessage));
    yield (0, exports.verifyToken)(token).then((user) => {
        req.user = user;
        next();
    }).catch((ex) => {
        next(http_errors_1.default.Unauthorized(ex.message));
    });
});
exports.JWTMiddleware = JWTMiddleware;
