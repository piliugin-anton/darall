import { uuidv7 } from '@kripod/uuidv7'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import CloudinaryStorage, { cloudImageDelete, cloudImageGet } from './CloudinaryStorage'

const STORE_TO_CLOUD = true

const frontendUpload = path.resolve('..', 'frontend', 'public', 'upload/')
const diskStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, frontendUpload)
    },
    filename: (_req, file, cb) => {
        cb(null, `${uuidv7()}.${file.mimetype.split('/')[1]}`)
    }
})
const cloudStorage = CloudinaryStorage()
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    if ((file.mimetype).includes('jpeg') || (file.mimetype).includes('png') || (file.mimetype).includes('jpg')) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}
const upload = multer({ storage: STORE_TO_CLOUD ? cloudStorage : diskStorage, fileFilter })
export const categoryMiddleware = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'title', maxCount: 1 }
])
export const itemMiddleware = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'title', maxCount: 1 },
    { name: 'description', maxCount: 1 },
    { name: 'price', maxCount: 1 }
])

export const imageDelete = (image: string) => STORE_TO_CLOUD ? cloudImageDelete(image) : fs.unlinkSync(path.join(frontendUpload, image))
export const imageGet = (image: string) => STORE_TO_CLOUD ? cloudImageGet(image) : image