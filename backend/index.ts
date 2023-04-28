import express, { Express, NextFunction, Request, Response, Router } from 'express'
import { param, body, validationResult } from 'express-validator'
import cookieParser from 'cookie-parser'
import * as argon2 from 'argon2'
import multer from 'multer'
import cors from 'cors'
import { uuidv7 } from '@kripod/uuidv7'
import dotenv from 'dotenv'
import { Category, Item, PrismaClient, Role, Prisma } from '@prisma/client'
import { UploadClient } from '@uploadcare/upload-client'
import path from 'path'
import fs from 'fs'
import { issueToken, JWTAuth, JWTRefresh, RefreshData, UserInfoRequest, UserWithoutPassword } from './jwt'

dotenv.config()

const app: Express = express()
const router: Router = express.Router()
const port = process.env.PORT || 3000
const REMOTE_UPLOAD = true

const uploadClient = new UploadClient({ publicKey: '1860953c55123fdaa48d', store: true })
//uploadClient.uploadFile()

const frontendUpload = path.resolve('..', 'frontend', 'public', 'upload/')
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, frontendUpload)
    },
    filename: (_req, file, cb) => {
        cb(null, `${uuidv7()}.${file.mimetype.split('/')[1]}`)
    }
})
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    if ((file.mimetype).includes('jpeg') || (file.mimetype).includes('png') || (file.mimetype).includes('jpg')) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}
const upload = multer({ storage, fileFilter })
const categoryMiddleware = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'title', maxCount: 1 }
])
const itemMiddleware = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'title', maxCount: 1 },
    { name: 'description', maxCount: 1 },
    { name: 'price', maxCount: 1 }
])

const imageDelete = (image: string) => fs.unlinkSync(path.join(frontendUpload, image))

function exclude<User, Key extends keyof User>(user: User, keys: Key[]): Omit<User, Key> {
    for (let key of keys) {
      delete user[key]
    }
    return user
}

app.use(cookieParser())
app.use(cors({ origin: true, credentials: true }))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const prisma = new PrismaClient()

export class CustomError extends Error {
    status: number
    constructor(message: string, status: number = 500) {
      super(message)
      this.name = "CustomError"
      this.status = status
    }
}

router.get('/categories', async (req: Request, res: Response) => {
    const skipNumber = parseInt(req.query.skip as string, 10)
    const skip = isFinite(skipNumber) && skipNumber > 0 ? skipNumber : 0

    try {
        const categories = await prisma.category.findMany({
            skip,
            take: 20,
            include: {
                items: true
            }
        })
    
        res.json(categories)
    } catch (ex: any) {
        return res.status(500).json({ errors: [ex.message] })
    }
})

router.get('/categories/:id', param('id').isInt({ min: 1 }).toInt(), async (req: Request, res: Response) => {
    const result = validationResult(req)
    if (result.isEmpty()) {
        try {
            const category = await prisma.category.findFirst({
                where: {
                    id: req.params.id as unknown as number
                },
                include: {
                    items: true
                }
            })
        
            if (category) return res.json(category)
        } catch (ex: any) {
            return res.status(500).json({ errors: [ex.message] })
        }
    }

    res.status(404).json({ errors: [`Не найдено категроии с ID ${req.params.id}`] })
})

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
type CategoryCreate = Optional<Category, 'id'>
type CategoryUpdate = Optional<CategoryCreate, 'image'>

router.post('/categories', JWTAuth, categoryMiddleware, body('title').trim().notEmpty(), async (req: Request, res: Response) => {
    const result = validationResult(req)
    if (result.isEmpty()) {
        if (!(req.files && 'image' in req.files && req.files.image.length)) {
            return res.status(400).json({ errors: ['Необходимо загрузить изображение'] })
        }

        const data: CategoryCreate = {
            title: req.body.title,
            image: req.files.image[0].filename
        }
        try {
            const category = await prisma.category.create({
                data
            })
            return res.json(category)
        } catch (ex: any) {
            return res.status(500).json({ errors: [ex.message] })
        }
    }

    res.status(400).json({ errors: result.array() })
})

router.put('/categories/:id', JWTAuth, categoryMiddleware, param('id').toInt().isInt({ min: 1 }), body('title').trim().notEmpty(), async (req: Request, res: Response) => {
    const result = validationResult(req)
    if (result.isEmpty()) {
        const id = req.params.id as unknown as number
        try {
            const categoryBefore = await prisma.category.findFirst({
                where: {
                    id
                }
            })
            if (!categoryBefore) return res.status(404).json({ errors: [`Не найдено категории с ID ${req.params.id}`] })

            const data: CategoryUpdate = {
                title: req.body.title
            }
            let deleteImage = false
            if (req.files && 'image' in req.files && req.files.image.length) {
                data.image = req.files.image[0].filename
                deleteImage = true
            }
            const categoryAfter = await prisma.category.update({
                where: {
                    id
                },
                data
            })
            if (!categoryAfter) return res.status(500).json({ errors: ['Ошибка при попытке обновить категорию'] })

            if (deleteImage) imageDelete(categoryBefore.image)

            return res.json(categoryAfter)
        } catch (ex: any) {
            return res.status(500).json({ errors: [ex.message] })
        }
    }

    res.status(400).json({ errors: result.array() })
})

router.delete('/categories/:id', JWTAuth, param('id').toInt().isInt({ min: 1 }), async (req: Request, res: Response) => {
    const result = validationResult(req)
    if (result.isEmpty()) {
        const id = req.params.id as unknown as number
        try {
            const category = await prisma.category.delete({
                where: {
                    id
                },
                include: {
                    items: true
                }
            })
            imageDelete(category.image)
            if (Array.isArray(category.items)) category.items.forEach((item: Item) => imageDelete(item.image))

            return res.json(category)
        } catch (ex: any) {
            return res.status(500).json({ errors: [ex.message] })
        }
    }

    res.status(400).json({ errors: result.array() })
})

type ItemCreate = Optional<Item, 'id'>
type ItemUpdate = Optional<ItemCreate, 'categoryId' | 'image'>

router.post('/items', JWTAuth, itemMiddleware,
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('categoryId').toInt().isInt({ min: 1 }),
    body('price').toInt().isInt({ min: 0 }), async (req: Request, res: Response) => {
        const result = validationResult(req)
        if (result.isEmpty()) {
            if (!(req.files && 'image' in req.files && req.files.image.length)) {
                return res.status(400).json({ errors: ['Необходимо загрузить изображение'] })
            }

            const data: ItemCreate = {
                title: req.body.title,
                description: req.body.description,
                categoryId: req.body.categoryId,
                price: req.body.price,
                image: req.files.image[0].filename
            }
            try {
                const item = await prisma.item.create({
                    data
                })
                return res.json(item)
            } catch (ex: any) {
                return res.status(500).json({ errors: [ex.message] })
            }
        }

        res.status(400).json({ errors: result.array() })
})

router.put('/items/:id', JWTAuth, itemMiddleware, 
    param('id').toInt().isInt({ min: 1 }),
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('price').toInt().isInt({ min: 0 }), async (req: Request, res: Response) => {
    const result = validationResult(req)
    if (result.isEmpty()) {
        const id = req.params.id as unknown as number
        try {
            const itemBefore = await prisma.item.findFirst({
                where: {
                    id
                }
            })
            if (!itemBefore) return res.status(404).json({ errors: [`Не найдено позиции с ID ${req.params.id}`] })

            const data: ItemUpdate = {
                title: req.body.title,
                description: req.body.description,
                price: req.body.price
            }
            let deleteImage = false
            if (req.files && 'image' in req.files && req.files.image.length) {
                data.image = req.files.image[0].filename
                deleteImage = true
            }
            const itemAfter = await prisma.item.update({
                where: {
                    id
                },
                data
            })
            if (!itemAfter) return res.status(500).json({ errors: ['Ошибка при попытке обновить позицию'] })

            if (deleteImage) imageDelete(itemAfter.image)

            return res.json(itemAfter)
        } catch (ex: any) {
            return res.status(500).json({ errors: [ex.message] })
        }
    }

    res.status(400).json({ errors: result.array() })
})

router.delete('/items/:id', JWTAuth, param('id').toInt().isInt({ min: 1 }), async (req: Request, res: Response) => {
    const result = validationResult(req)
    if (result.isEmpty()) {
        const id = req.params.id as unknown as number
        try {
            const item = await prisma.item.delete({
                where: {
                    id
                }
            })
            imageDelete(item.image)
            return res.json(item)
        } catch (ex: any) {
            return res.status(500).json({ errors: [ex.message] })
        }
    }

    res.status(400).json({ errors: result.array() })
})

router.post('/user/signup',
    body('email').trim().isEmail(),
    body('name').trim().notEmpty(),
    body('password').notEmpty(), async (req: Request, res: Response) => {
        const result = validationResult(req)
        if (result.isEmpty()) {
            const { email, name, password } = req.body
            try {
                const hash = await argon2.hash(password)
                const user = await prisma.user.create({
                    data: {
                        email,
                        name,
                        password: hash
                    }
                })

                if (!user) return res.status(500).json({ errors: ['Ошибка при попытке создать пользователя'] })
                
                const userWithoutPassword = exclude(user, ['password'])
                const { token, serialized } = await issueToken(userWithoutPassword)

                return res.setHeader('Set-Cookie', serialized).json({ user: userWithoutPassword, token })
            } catch (ex: any) {
                if (ex instanceof Prisma.PrismaClientKnownRequestError && ex.code === 'P2002') {
                    return res.status(403).json({ errors: ['Пользователь с таким e-mail уже существует'] })
                }
                return res.status(500).json({ errors: [ex.message] })
            }
        }

        res.status(400).json({ errors: result.array() })
})

router.post('/user/login',
    body('email').trim().isEmail(),
    body('password').notEmpty(), async (req: Request, res: Response) => {
        const result = validationResult(req)
        if (result.isEmpty()) {
            const { email, password } = req.body
            const notFoundMessage = 'Пользователя с таким e-mail и паролем не найдено'
            const user = await prisma.user.findFirst({
                where: {
                    email
                }
            })
            
            if (!user) return res.json({ errors: [notFoundMessage] })
            
            try {
                if (await argon2.verify(user.password, password)) {
                    const userWithoutPassword = exclude(user, ['password'])
                    const { token, serialized } = await issueToken(userWithoutPassword)

                    return res.setHeader('Set-Cookie', serialized).json({ user: userWithoutPassword, token })
                } else {
                    return res.json({ errors: [notFoundMessage] })
                }
            } catch (ex: any) {
                return res.status(500).json({ errors: [ex.message] })
            }
        }

        res.status(400).json({ errors: result.array() })
})

router.get('/user/me', JWTAuth, async (req: UserInfoRequest<UserWithoutPassword>, res: Response) => {
    const { id } = req.user as UserWithoutPassword

    try {
        const user = await prisma.user.findFirst({
            where: {
                id
            }
        })

        if (!user) return res.status(500).json({ errors: ['Ошибка при попытке найти пользователя'] })

        const userWithoutPassword = exclude(user, ['password'])
        return res.json(userWithoutPassword)
    } catch (ex: any) {
        return res.status(500).json({ errors: [ex.message] })
    }
})

router.get('/user/getPrivileges', JWTAuth, async (req: UserInfoRequest<UserWithoutPassword>, res: Response) => {
    const { id } = req.user as UserWithoutPassword

    try {
        const user = await prisma.user.update({
            data: {
                role: Role.ADMIN
            },
            where: {
                id
            }
        })

        if (!user) return res.status(500).json({ errors: ['Ошибка при получении привилегий'] })

        const userWithoutPassword = exclude(user, ['password'])
        return res.json(userWithoutPassword)
    } catch (ex: any) {
        return res.status(500).json({ errors: [ex.message] })
    }
})

router.get('/user/refresh', JWTRefresh, async (req: UserInfoRequest<RefreshData>, res: Response) => {
    const { id } = req.user as RefreshData
    try {
        const user = await prisma.user.findFirst({
            where: {
                id
            }
        })
        if (!user) return res.status(403).json({ errors: ['Ошибка при попытке обновить JWT'] })

        const userWithoutPassword = exclude(user, ['password'])
        const { token, serialized } = await issueToken(userWithoutPassword)
        res.setHeader('Set-Cookie', serialized).json({ user: userWithoutPassword, token })
    } catch (ex: any) {
        return res.status(500).json({ errors: [ex.message] })
    }    
})

app.use(router)

// Обязательно добавлять middleware для обработки ошибок последним!
app.use((err: CustomError | unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err)
    } else if (err instanceof CustomError) res.status(err.status).json({ errors: [err.message] })
})

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})