import { Request, Response, NextFunction } from 'express'
import { User } from '@prisma/client'
import { serialize } from 'cookie'
import { CustomError } from '.'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string

export type UserWithoutPassword = Omit<User, 'password'>

export type RefreshData = UserWithoutPassword & { isRefreshToken: boolean }

export type UserInfoRequest<T = UserWithoutPassword> = Request & { user?: T }

export const signToken = (payload: unknown, expiresIn = '1800s'): Promise<string> => {
    return new Promise((resolve, reject) => {
        jwt.sign({ payload }, accessTokenSecret, { algorithm: 'HS512', expiresIn }, (err: Error | null, token: string | undefined) => {
            if (err) {
                console.log('JWT ERROR', err)
                return reject(new CustomError('Ошибка при попытке подписать JWT', 500))
            }

            resolve(token as string)
        })
    })
}

export const verifyToken = (token: string) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, accessTokenSecret, (err: Error | null, payload: unknown) => {
            if (err) {
                const message = err.name == 'JsonWebTokenError' ? 'Unauthorized' : err.message
                return reject(new CustomError(message, 401))
            }

            resolve(payload)
        })
    })
}

export const issueToken = async (data: UserWithoutPassword, expiresIn = '1800s', refreshExpiresIn = 2592000) => {
    const refreshToken = await signToken({ ...data, isRefreshToken: true }, `${refreshExpiresIn}s`)
    const token = await signToken(data, expiresIn)

    const serialized = serialize('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: refreshExpiresIn,
        path: '/',
    })

    return { token, serialized }
}

export const JWTAuth = async (req: Request, _res: Response, next: NextFunction) => {
    const unauthorizedMessage = 'Access token is required'

    if (!req.headers.authorization) return next(new CustomError(unauthorizedMessage, 401))

    const token = req.headers.authorization.split(' ')[1]
    if (!token) return next(new CustomError(unauthorizedMessage, 401))

    await verifyToken(token).then((user: any) => {
        (req as UserInfoRequest<UserWithoutPassword>).user = user.payload as UserWithoutPassword
        next()
    }).catch ((ex) => {
        next(new CustomError(ex.message, 401))
    })
}

export const JWTRefresh = async (req: Request, _res: Response, next: NextFunction) => {
    const unauthorizedMessage = 'Access token is required'

    if (!req.cookies.refreshToken) return next(new CustomError(unauthorizedMessage, 401))

    await verifyToken(req.cookies.refreshToken).then((user: any) => {
        const refreshData = user.payload as RefreshData
        if (!refreshData.isRefreshToken) {
            next(new CustomError(unauthorizedMessage, 401))
        } else {
            (req as UserInfoRequest<RefreshData>).user = refreshData
            next()
        }        
    }).catch ((ex) => {
        next(new CustomError(ex.message, 401))
    })
}