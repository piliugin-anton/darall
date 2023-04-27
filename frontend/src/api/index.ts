import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios'
import mem from 'mem'
import { useAuthStore } from '../store/auth'
import { AuthState } from '../store/auth'
import { Category, Item } from '../../../backend/node_modules/.prisma/client'

const baseURL = 'http://localhost:3000'

const instance = axios.create({ baseURL })

instance.interceptors.request.use((config: AxiosRequestConfig) => {
    const auth = useAuthStore()
    if (auth.token) {
        config.headers = {
            ...config.headers,
            authorization: `Bearer ${auth.token}`,
        }
    }
    return config
}, function(error: AxiosError) {
    return Promise.reject(error)
})

instance.interceptors.response.use((response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const config = error?.config
  
      if (error?.response?.status === 401 && !config?.sent) {
        config.sent = true
  
        const token = await memoizedRefreshToken()
  
        if (token) {
          config.headers = {
            ...config.headers,
            authorization: `Bearer ${token}`,
          }
        }
  
        return axios(config)
      }

      return Promise.reject(error)
    }
)

const refreshTokenFn = async () => {
    const auth = useAuthStore()

    try {
      const { token } = await refreshToken()
  
      if (!token) {
        auth.logout()
      } else {
        auth.refresh(token)
      }
  
      return token
    } catch (error) {
        auth.logout()
    }
};
  
const maxAge = 18000
  
const memoizedRefreshToken = mem(refreshTokenFn, {
    maxAge,
})

export interface SignupForm {
    email: string
    name: string
    password: string
}

export interface LoginForm {
    email: string
    password: string
}

export const signup = (form: SignupForm): Promise<AuthState> => instance
    .post<AuthState>('/user/signup', form, { withCredentials: true })
    .then((response: { data: AuthState }) => response.data)
    .catch((error: AxiosError) => console.error(error))

export const login = (form: LoginForm): Promise<AuthState> => instance
    .post<AuthState>('/user/login', form, { withCredentials: true })
    .then((response: { data: AuthState }) => response.data)
    .catch((error: AxiosError) => console.error(error))

export const refreshToken = (): Promise<AuthState> => instance
    .get('/user/refresh', { withCredentials: true })
    .then((response: { data: AuthState }) => response.data)
    .catch((error: AxiosError) => console.error(error))

export const getPrivileges = (): Promise<AuthState> => instance
    .get('/user/getPrivileges')
    .then((response: { data: AuthState }) => response.data)
    .catch((error: AxiosError) => console.error(error))

export const getCategories = (): Promise<Category[]> => instance
    .get('/categories')
    .then((response: { data: Category[] }) => response.data)
    .catch((error: AxiosError) => console.error(error))

export const getCategory = (id: string): Promise<Category> => instance
    .get(`/categories/${id}`)
    .then((response: { data: Category }) => response.data)
    .catch((error: AxiosError) => {})

export const createCategory = (data: FormData): Promise<Category> => instance
    .post('/categories', data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    .then((response: { data: Category }) => response.data)
    .catch((error: AxiosError) => console.error(error))

export const updateCategory = (id: string, data: FormData): Promise<Category> => instance
    .put(`/categories/${id}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    .then((response: { data: Category }) => response.data)
    .catch((error: AxiosError) => console.error(error))

export const deleteCategory = (id: string): Promise<Category> => instance
    .delete(`/categories/${id}`)
    .then((response: { data: Category }) => response.data)
    .catch((error: AxiosError) => console.error(error))

export const createItem = (data: FormData): Promise<Item> => instance
    .post('/items', data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    .then((response: { data: Item }) => response.data)
    .catch((error: AxiosError) => console.error(error))

export const updateItem = (id: string, data: FormData): Promise<Item> => instance
    .put(`/items/${id}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    .then((response: { data: Item }) => response.data)
    .catch((error: AxiosError) => console.error(error))

export const deleteItem = (id: string): Promise<Item> => instance
    .delete(`/items/${id}`)
    .then((response: { data: Item }) => response.data)
    .catch((error: AxiosError) => console.error(error))