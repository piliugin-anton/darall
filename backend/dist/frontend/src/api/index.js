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
exports.getCategories = exports.login = exports.signup = void 0;
const axios_1 = __importDefault(require("axios"));
const mem_1 = __importDefault(require("mem"));
const auth_1 = require("../store/auth");
const baseURL = 'http://localhost:3000';
const instance = axios_1.default.create({ baseURL });
instance.interceptors.request.use((config) => {
    const auth = (0, auth_1.useAuthStore)();
    if (auth.token) {
        config.headers = Object.assign(Object.assign({}, config.headers), { authorization: `Bearer ${auth.token}` });
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});
instance.interceptors.response.use((response) => response, (error) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const config = error === null || error === void 0 ? void 0 : error.config;
    if (((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) === 401 && !(config === null || config === void 0 ? void 0 : config.sent)) {
        config.sent = true;
        const token = yield memoizedRefreshToken();
        if (token) {
            config.headers = Object.assign(Object.assign({}, config.headers), { authorization: `Bearer ${token}` });
        }
        return (0, axios_1.default)(config);
    }
    return Promise.reject(error);
}));
const refreshTokenFn = () => __awaiter(void 0, void 0, void 0, function* () {
    const auth = (0, auth_1.useAuthStore)();
    try {
        const response = yield instance.get('/user/refresh');
        const { token } = response.data;
        if (!token) {
            auth.logout();
        }
        else {
            auth.refresh(token);
        }
        return token;
    }
    catch (error) {
        auth.logout();
    }
});
const maxAge = 18000;
const memoizedRefreshToken = (0, mem_1.default)(refreshTokenFn, {
    maxAge,
});
const signup = (form) => instance
    .post('/user/signup', form)
    .then((response) => response.data)
    .catch((error) => console.error(error));
exports.signup = signup;
const login = (form) => instance
    .post('/user/login', form)
    .then((response) => response.data)
    .catch((error) => console.error(error));
exports.login = login;
const getCategories = () => instance
    .get('/categories')
    .then((response) => response.data)
    .catch((error) => console.error(error));
exports.getCategories = getCategories;
