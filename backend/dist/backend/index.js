"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const argon2 = __importStar(require("argon2"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_1 = require("cookie");
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const jwt_1 = require("./jwt");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const frontendUpload = path_1.default.resolve('..', 'frontend', 'upload/');
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, frontendUpload);
    },
    filename: (req, file, cb) => {
        cb(null, `${file.originalname}_${Date.now() + Math.random()}`);
    }
});
const fileFilter = (req, file, cb) => {
    if ((file.mimetype).includes('jpeg') || (file.mimetype).includes('png') || (file.mimetype).includes('jpg')) {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};
const upload = (0, multer_1.default)({ storage, fileFilter });
const uploadImage = upload.single('image');
app.use((0, cors_1.default)());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
app.get('/categories', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const skipNumber = parseInt(req.query.skip, 10);
    const skip = isFinite(skipNumber) && skipNumber > 0 ? skipNumber : 0;
    const categories = yield prisma.category.findMany({
        skip,
        take: 20,
    });
    res.json(categories);
}));
app.post('/categories', uploadImage, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ okay: 42 });
}));
app.put('/categories/:id', uploadImage, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ okay: 42 });
}));
app.delete('/categories/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ okay: 42 });
}));
const issueToken = (data, expiresIn = '1800s', refreshExpiresIn = 2592000) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = yield (0, jwt_1.signToken)(Object.assign(Object.assign({}, data), { isRefreshToken: true }), `${refreshExpiresIn}s`);
    const token = yield (0, jwt_1.signToken)(data, expiresIn);
    const serialized = (0, cookie_1.serialize)('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: refreshExpiresIn,
        path: '/',
    });
    return { token, serialized };
});
app.post('/user/signup', (0, express_validator_1.body)('email').trim().isEmail(), (0, express_validator_1.body)('name').trim().notEmpty(), (0, express_validator_1.body)('password').notEmpty(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = (0, express_validator_1.validationResult)(req);
    if (result.isEmpty()) {
        const { email, name, password } = req.body;
        try {
            const hash = yield argon2.hash(password);
            const user = yield prisma.user.create({
                data: {
                    email,
                    name,
                    password: hash
                }
            });
            const { token, serialized } = yield issueToken(user);
            return res.setHeader('Set-Cookie', serialized).json({ user, token });
        }
        catch (ex) {
            return res.sendStatus(500).json({ errors: [ex.message] });
        }
    }
    res.json({ errors: result.array() });
}));
app.post('/user/login', (0, express_validator_1.body)('email').trim().isEmail(), (0, express_validator_1.body)('password').isLength({ min: 43, max: 43 }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = (0, express_validator_1.validationResult)(req);
    if (result.isEmpty()) {
        const { email, password } = req.body;
        const notFoundMessage = 'Пользователя с таким e-mail и паролем не найдено';
        const user = yield prisma.user.findFirst({
            where: {
                email
            }
        });
        if (!user)
            return res.json({ errors: [notFoundMessage] });
        try {
            if (yield argon2.verify(user.password, password)) {
                const { token, serialized } = yield issueToken(user);
                return res.setHeader('Set-Cookie', serialized).json({ user, token });
            }
            else {
                return res.json({ errors: [notFoundMessage] });
            }
        }
        catch (ex) {
            return res.sendStatus(500).json({ errors: [ex.message] });
        }
    }
    res.json({ errors: result.array() });
}));
app.get('/user/me', jwt_1.JWTMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ okay: 'AUTHORIZED!' });
}));
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
