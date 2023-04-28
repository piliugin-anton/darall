import axios, { AxiosError, AxiosResponse, isAxiosError, InternalAxiosRequestConfig } from 'axios'
import mem from 'mem'
import { useAuthStore } from '../store/auth'
import { AuthState } from '../store/auth'
import { Category, Item } from '../../../backend/node_modules/.prisma/client'
import type { FieldValidationError } from '../../../node_modules/express-validator'
import { UserWithoutPassword } from '../../../backend/jwt'
import { ExtendedCategory } from '../store/application'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export interface SignupForm {
    email: string
    name: string
    password: string
}

export interface LoginForm {
    email: string
    password: string
}

export interface ApiError {
    errors: string[] | FieldValidationError[]
}

const instance = axios.create({ baseURL })

instance.interceptors.request.use((config: InternalAxiosRequestConfig<any>) => {
    const auth = useAuthStore()
    if (auth.token) config.headers.set('Authorization', `Bearer ${auth.token}`)

    return config
}, function(error: AxiosError) {
    return Promise.reject(error)
})

instance.interceptors.response.use((response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const config = error?.config as InternalAxiosRequestConfig<any> & { sent: boolean }
      if (error?.response?.status === 401 && !config.sent) {
        config.sent = true
  
        const token = await memoizedRefreshToken()
  
        if (token) config.headers.set('Authorization', `Bearer ${token}`)
  
        return axios(config)
      }

      return Promise.reject(error)
    }
)

const refreshTokenFn = async () => {
    const auth = useAuthStore()

    try {
      const data = await refreshToken()
  
      if ('token' in data && typeof data.token === 'string') {
        auth.refresh(data.token)
        return data.token
      } else {
        auth.logout()
      }
    } catch (error) {
        auth.logout()
    }
};
  
const maxAge = 18000
  
const memoizedRefreshToken = mem(refreshTokenFn, {
    maxAge,
})

export async function signup(form: SignupForm): Promise<AuthState | ApiError> {
    try {
        const { data } = await instance.post<AuthState>('/user/signup', form, { withCredentials: true })
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}

export async function login(form: LoginForm): Promise<AuthState | ApiError> {
    try {
        const { data } = await instance.post<AuthState>('/user/login', form, { withCredentials: true })
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}

export async function refreshToken(): Promise<AuthState | ApiError> {
    try {
        const { data } = await instance.get<AuthState>('/user/refresh', { withCredentials: true })
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}

export async function getPrivileges(): Promise<UserWithoutPassword | ApiError> {
    try {
        const { data } = await instance.get<UserWithoutPassword>('/user/getPrivileges')
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}

export async function getCategories(): Promise<ExtendedCategory[] | ApiError> {
    try {
        const { data } = await instance.get<ExtendedCategory[]>('/categories')
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}

export async function getCategory(id: string): Promise<ExtendedCategory | ApiError> {
    try {
        const { data } = await instance.get<ExtendedCategory>(`/categories/${id}`)
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}

export async function createCategory(formData: FormData): Promise<Category | ApiError> {
    try {
        const { data } = await instance.post<Category>('/categories', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}

export async function updateCategory(id: string, formData: FormData): Promise<Category | ApiError> {
    try {
        const { data } = await instance.put<Category>(`/categories/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}

export async function deleteCategory(id: string): Promise<Category | ApiError> {
    try {
        const { data } = await instance.delete<Category>(`/categories/${id}`)
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}

export async function createItem(formData: FormData): Promise<Item | ApiError> {
    try {
        const { data } = await instance.post<Item>('/items', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}

export async function updateItem(id: string, formData: FormData): Promise<Item | ApiError> {
    try {
        const { data } = await instance.put<Item>(`/items/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}

export async function deleteItem(id: string): Promise<Item | ApiError> {
    try {
        const { data } = await instance.delete<Item>(`/items/${id}`)
        return data
    } catch (ex: any) {
        return isAxiosError(ex) ? { errors: [ex.message] } as ApiError : ex
    }
}