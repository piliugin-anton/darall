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
exports.CustomError = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const argon2 = __importStar(require("argon2"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const uuidv7_1 = require("@kripod/uuidv7");
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const jwt_1 = require("./jwt");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const frontendUpload = path_1.default.resolve('..', 'frontend', 'public', 'upload/');
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, frontendUpload);
    },
    filename: (req, file, cb) => {
        cb(null, `${(0, uuidv7_1.uuidv7)()}.${file.mimetype.split('/')[1]}`);
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
const categoryMiddleware = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'title', maxCount: 1 }
]);
const itemMiddleware = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'title', maxCount: 1 },
    { name: 'description', maxCount: 1 },
    { name: 'price', maxCount: 1 }
]);
const imageDelete = (image) => fs_1.default.unlinkSync(path_1.default.join(frontendUpload, image));
function exclude(user, keys) {
    for (let key of keys) {
        delete user[key];
    }
    return user;
}
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
class CustomError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = "CustomError";
        this.status = status;
    }
}
exports.CustomError = CustomError;
app.get('/categories', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const skipNumber = parseInt(req.query.skip, 10);
    const skip = isFinite(skipNumber) && skipNumber > 0 ? skipNumber : 0;
    try {
        const categories = yield prisma.category.findMany({
            skip,
            take: 20,
            include: {
                items: true
            }
        });
        res.json(categories);
    }
    catch (ex) {
        return res.status(500).json({ errors: [ex.message] });
    }
}));
app.get('/categories/:id', (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = (0, express_validator_1.validationResult)(req);
    if (result.isEmpty()) {
        try {
            const category = yield prisma.category.findFirst({
                where: {
                    id: req.params.id
                },
                include: {
                    items: true
                }
            });
            if (category)
                return res.json(category);
        }
        catch (ex) {
            return res.status(500).json({ errors: [ex.message] });
        }
    }
    res.status(404).json({ errors: [`Не найдено категроии с ID ${req.params.id}`] });
}));
app.post('/categories', jwt_1.JWTAuth, categoryMiddleware, (0, express_validator_1.body)('title').trim().notEmpty(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = (0, express_validator_1.validationResult)(req);
    if (result.isEmpty()) {
        if (!(req.files && 'image' in req.files && req.files.image.length)) {
            return res.status(400).json({ errors: ['Необходимо загрузить изображение'] });
        }
        const data = {
            title: req.body.title,
            image: req.files.image[0].filename
        };
        try {
            const category = yield prisma.category.create({
                data
            });
            return res.json(category);
        }
        catch (ex) {
            return res.status(500).json({ errors: [ex.message] });
        }
    }
    res.status(400).json({ errors: result.array() });
}));
app.put('/categories/:id', jwt_1.JWTAuth, categoryMiddleware, (0, express_validator_1.param)('id').toInt().isInt({ min: 1 }), (0, express_validator_1.body)('title').trim().notEmpty(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = (0, express_validator_1.validationResult)(req);
    if (result.isEmpty()) {
        const id = req.params.id;
        try {
            const categoryBefore = yield prisma.category.findFirst({
                where: {
                    id
                }
            });
            if (!categoryBefore)
                return res.status(404).json({ errors: [`Не найдено категории с ID ${req.params.id}`] });
            const data = {
                title: req.body.title
            };
            let deleteImage = false;
            if (req.files && 'image' in req.files && req.files.image.length) {
                data.image = req.files.image[0].filename;
                deleteImage = true;
            }
            const categoryAfter = yield prisma.category.update({
                where: {
                    id
                },
                data
            });
            if (!categoryAfter)
                return res.status(500).json({ errors: ['Ошибка при попытке обновить категорию'] });
            if (deleteImage)
                imageDelete(categoryBefore.image);
            return res.json(categoryAfter);
        }
        catch (ex) {
            return res.status(500).json({ errors: [ex.message] });
        }
    }
    res.status(400).json({ errors: result.array() });
}));
app.delete('/categories/:id', jwt_1.JWTAuth, (0, express_validator_1.param)('id').toInt().isInt({ min: 1 }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = (0, express_validator_1.validationResult)(req);
    if (result.isEmpty()) {
        const id = req.params.id;
        try {
            const category = yield prisma.category.delete({
                where: {
                    id
                },
                include: {
                    items: true
                }
            });
            imageDelete(category.image);
            if (Array.isArray(category.items))
                category.items.forEach((item) => imageDelete(item.image));
            return res.json(category);
        }
        catch (ex) {
            return res.status(500).json({ errors: [ex.message] });
        }
    }
    res.status(400).json({ errors: result.array() });
}));
app.post('/items', jwt_1.JWTAuth, itemMiddleware, (0, express_validator_1.body)('title').trim().notEmpty(), (0, express_validator_1.body)('description').trim().notEmpty(), (0, express_validator_1.body)('categoryId').toInt().isInt({ min: 1 }), (0, express_validator_1.body)('price').toInt().isInt({ min: 0 }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = (0, express_validator_1.validationResult)(req);
    if (result.isEmpty()) {
        if (!(req.files && 'image' in req.files && req.files.image.length)) {
            return res.status(400).json({ errors: ['Необходимо загрузить изображение'] });
        }
        const data = {
            title: req.body.title,
            description: req.body.description,
            categoryId: req.body.categoryId,
            price: req.body.price,
            image: req.files.image[0].filename
        };
        try {
            const item = yield prisma.item.create({
                data
            });
            return res.json(item);
        }
        catch (ex) {
            return res.status(500).json({ errors: [ex.message] });
        }
    }
    res.status(400).json({ errors: result.array() });
}));
app.put('/items/:id', jwt_1.JWTAuth, itemMiddleware, (0, express_validator_1.param)('id').toInt().isInt({ min: 1 }), (0, express_validator_1.body)('title').trim().notEmpty(), (0, express_validator_1.body)('description').trim().notEmpty(), (0, express_validator_1.body)('price').toInt().isInt({ min: 0 }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = (0, express_validator_1.validationResult)(req);
    if (result.isEmpty()) {
        const id = req.params.id;
        try {
            const itemBefore = yield prisma.item.findFirst({
                where: {
                    id
                }
            });
            if (!itemBefore)
                return res.status(404).json({ errors: [`Не найдено позиции с ID ${req.params.id}`] });
            const data = {
                title: req.body.title,
                description: req.body.description,
                price: req.body.price
            };
            let deleteImage = false;
            if (req.files && 'image' in req.files && req.files.image.length) {
                data.image = req.files.image[0].filename;
                deleteImage = true;
            }
            const itemAfter = yield prisma.item.update({
                where: {
                    id
                },
                data
            });
            if (!itemAfter)
                return res.status(500).json({ errors: ['Ошибка при попытке обновить позицию'] });
            if (deleteImage)
                imageDelete(itemAfter.image);
            return res.json(itemAfter);
        }
        catch (ex) {
            return res.status(500).json({ errors: [ex.message] });
        }
    }
    res.status(400).json({ errors: result.array() });
}));
app.delete('/items/:id', jwt_1.JWTAuth, (0, express_validator_1.param)('id').toInt().isInt({ min: 1 }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = (0, express_validator_1.validationResult)(req);
    if (result.isEmpty()) {
        const id = req.params.id;
        try {
            const item = yield prisma.item.delete({
                where: {
                    id
                }
            });
            imageDelete(item.image);
            return res.json(item);
        }
        catch (ex) {
            return res.status(500).json({ errors: [ex.message] });
        }
    }
    res.status(400).json({ errors: result.array() });
}));
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
            if (!user)
                return res.status(500).json({ errors: ['Ошибка при попытке создать пользователя'] });
            const userWithoutPassword = exclude(user, ['password']);
            const { token, serialized } = yield (0, jwt_1.issueToken)(userWithoutPassword);
            return res.setHeader('Set-Cookie', serialized).json({ user: userWithoutPassword, token });
        }
        catch (ex) {
            return res.status(500).json({ errors: [ex.message] });
        }
    }
    res.json({ errors: result.array() });
}));
app.post('/user/login', (0, express_validator_1.body)('email').trim().isEmail(), (0, express_validator_1.body)('password').notEmpty(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                const userWithoutPassword = exclude(user, ['password']);
                const { token, serialized } = yield (0, jwt_1.issueToken)(userWithoutPassword);
                return res.setHeader('Set-Cookie', serialized).json({ user: userWithoutPassword, token });
            }
            else {
                return res.json({ errors: [notFoundMessage] });
            }
        }
        catch (ex) {
            return res.status(500).json({ errors: [ex.message] });
        }
    }
    res.json({ errors: result.array() });
}));
app.get('/user/me', jwt_1.JWTAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ okay: 'AUTHORIZED!' });
}));
app.get('/user/getPrivileges', jwt_1.JWTAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    try {
        const user = yield prisma.user.update({
            data: {
                role: client_1.Role.ADMIN
            },
            where: {
                id
            }
        });
        if (!user)
            return res.status(500).json({ errors: ['Ошибка при получении привилегий'] });
        const userWithoutPassword = exclude(user, ['password']);
        return res.json(userWithoutPassword);
    }
    catch (ex) {
        return res.status(500).json({ errors: [ex.message] });
    }
}));
app.get('/user/refresh', jwt_1.JWTRefresh, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    try {
        const user = yield prisma.user.findFirst({
            where: {
                id
            }
        });
        if (!user)
            return res.status(403).json({ errors: ['Ошибка при попытке обновить JWT'] });
        const userWithoutPassword = exclude(user, ['password']);
        const { token, serialized } = yield (0, jwt_1.issueToken)(userWithoutPassword);
        res.setHeader('Set-Cookie', serialized).json({ user: userWithoutPassword, token });
    }
    catch (ex) {
        return res.status(500).json({ errors: [ex.message] });
    }
}));
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    else if (err instanceof CustomError)
        res.status(err.status).json({ errors: [err.message] });
});
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
