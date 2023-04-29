import { Request } from 'express'
import { StorageEngine } from 'multer'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

// Не забыть добавить переменную окружения (CLOUDINARY_URL=cloudinary://my_key:my_secret@my_cloud_name) ИЛИ настроки ниже: 

cloudinary.config({ 
  cloud_name: 'daral0kea', 
  api_key: '464918157125713', 
  api_secret: 'IcBtcImq8P8qGbASkhnnFaXJTsU',
  secure: true
})

function CloudinaryStorage(this: any): void {

}

export const cloudImageDelete = (image: string, cb?: (error: Error | null) => void) => cloudinary.uploader.destroy(image, { resource_type: 'image', invalidate: true }).then(() => cb && cb(null)).catch((err) => cb && cb(err))

CloudinaryStorage.prototype._handleFile = function _handleFile(_req: Request, file: Express.Multer.File, cb: (error?: any, info?: Partial<Express.Multer.File>) => void) {
  const uploadStream = cloudinary.uploader.upload_stream({ tags: 'images' }, function(err, image) {
    if (err) return cb(err)

    const imageData = image as UploadApiResponse
    cb(null, {
      filename: imageData.secure_url,
      path: imageData.public_id,
      size: imageData.bytes
    })
  })
  file.stream.pipe(uploadStream)
}

CloudinaryStorage.prototype._removeFile = function _removeFile(_req: Request, file: Express.Multer.File, cb: (error: Error | null) => void) {
  cloudImageDelete(file.filename, cb)
}

export default function(): StorageEngine {
  return new (CloudinaryStorage as any)()
}