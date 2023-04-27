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
exports.JWTRefresh = exports.JWTAuth = exports.issueToken = exports.verifyToken = exports.signToken = void 0;
const cookie_1 = require("cookie");
const _1 = require(".");
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const signToken = (payload, expiresIn = '1800s') => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.sign({ payload }, accessTokenSecret, { algorithm: 'HS512', expiresIn }, (err, token) => {
            if (err)
                return reject(new _1.CustomError('Error while trying to sign a JWT token', 500));
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
                return reject(new _1.CustomError(message, 401));
            }
            resolve(payload);
        });
    });
};
exports.verifyToken = verifyToken;
const issueToken = (data, expiresIn = '1800s', refreshExpiresIn = 2592000) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = yield (0, exports.signToken)(Object.assign(Object.assign({}, data), { isRefreshToken: true }), `${refreshExpiresIn}s`);
    const token = yield (0, exports.signToken)(data, expiresIn);
    const serialized = (0, cookie_1.serialize)('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: refreshExpiresIn,
        path: '/',
    });
    return { token, serialized };
});
exports.issueToken = issueToken;
const JWTAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const unauthorizedMessage = 'Access token is required';
    if (!req.headers.authorization)
        return next(new _1.CustomError(unauthorizedMessage, 401));
    const token = req.headers.authorization.split(' ')[1];
    if (!token)
        return next(new _1.CustomError(unauthorizedMessage, 401));
    yield (0, exports.verifyToken)(token).then((user) => {
        req.user = user.payload;
        next();
    }).catch((ex) => {
        next(new _1.CustomError(ex.message, 401));
    });
});
exports.JWTAuth = JWTAuth;
const JWTRefresh = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const unauthorizedMessage = 'Access token is required';
    if (!req.cookies.refreshToken)
        return next(new _1.CustomError(unauthorizedMessage, 401));
    yield (0, exports.verifyToken)(req.cookies.refreshToken).then((user) => {
        const refreshData = user.payload;
        if (!refreshData.isRefreshToken) {
            next(new _1.CustomError(unauthorizedMessage, 401));
        }
        else {
            req.user = refreshData;
            next();
        }
    }).catch((ex) => {
        next(new _1.CustomError(ex.message, 401));
    });
});
exports.JWTRefresh = JWTRefresh;
