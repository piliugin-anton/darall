import { defineStore } from 'pinia'
//import { useRoute } from 'vue-router'
import { UserWithoutPassword } from '../../../backend/jwt'
import { login, LoginForm, signup, SignupForm, getPrivileges } from '../api'
//import router from '../router'

export interface AuthState {
  user: UserWithoutPassword | null
  token: string | null
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    /* Initialize state from local storage to enable user to stay logged in */
    const userData = localStorage.getItem('user')

    return {
        user: userData ? JSON.parse(userData) : null,
        token: localStorage.getItem('token'),
    } as AuthState
  },
  actions: {
    _updateUser(user: UserWithoutPassword) {
      this.user = user
      if (!user) {
        localStorage.removeItem('user')
      } else {
        localStorage.setItem('user', JSON.stringify(this.user))
      }
    },
    _updateToken(token: string) {
      this.token = token
      if (!token) {
        localStorage.removeItem('token')
      } else {
        localStorage.setItem('token', this.token)
      }
    },
    async login(form: LoginForm) {
      const result = await login(form)
      if (!result.errors) {
        this._updateUser(result.user)
        this._updateToken(result.token)
      }

      return result
    },
    async signup(form: SignupForm) {
      const result = await signup(form)
      if (!result.errors) {
        this._updateUser(result.user)
        this._updateToken(result.token)
      }

      return result
    },
    logout() {
      this._updateUser(null)
      this._updateToken(null)
    },
    refresh(token: string) {
      this._updateToken(token)
    },
    async getPrivileges() {
      if (!this.token) return

      const result = await getPrivileges()
      if (!result.errors) {
        this._updateUser(result)
      }
    }
  }
})