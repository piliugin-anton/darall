import { defineStore } from 'pinia'
import { Category, Item } from '../../../backend/node_modules/.prisma/client/index'
import * as API from '../api/index'

export enum MODE {
  Просмотр = 0,
  Редактирование = 1
}

export interface ApplicationState {
  mode: MODE
  categories: ExtendedCategory[]
  cart: CartItem[]
  _initialLoad: boolean
}

export interface CartItem {
  id: number
  quantity: number
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
export type NewItem = Optional<Item, 'id' | 'image'> & { _added?: boolean }
export type ExtendedCategory = Category & { items: Item[] | NewItem[] }

export const useApplicationStore = defineStore('application', {
  state: () => ({
    mode: MODE.Просмотр,
    _initialLoad: false,
    categories: [],
    cart: []
  } as ApplicationState),
  actions: {
    _updateItems(item: NewItem | Item, remove: boolean = false) {
      const category = this.categories.find((cat: Category) => cat.id === item.categoryId) as ExtendedCategory
      if (category) {
        const findInArray = category.items.findIndex((itemInArray: any) => itemInArray.id === item.id || itemInArray._added)

        if (remove && findInArray > -1) {
          category.items.splice(findInArray, 1)
          return
        }

        if (findInArray > -1) {
          category.items.splice(findInArray, 1, item)
        } else {
          category.items.push(item as Item)
        }
      }
    },
    changeMode(mode: MODE) {
      this.mode = mode
    },
    async fetchCategories(force?: boolean) {
      if (!this._initialLoad || force) {
        const result = await API.getCategories()
        if (!('errors' in result)) {
          this.categories = result as ExtendedCategory[]
          this._initialLoad = true
        }
      }
    },
    async getCategory(id: string) {
      let category = this.categories.find((category: ExtendedCategory) => category.id === Number(id))

      if (!category) {
        const result = await API.getCategory(id)
        if (!('errors' in result)) {
          category = result
          this.categories.push(category)
        }
      }

      return category
    },
    async createCategory(data: FormData) {
      const result = await API.createCategory(data) as ExtendedCategory
      if (!('errors' in result)) {
        if (!Array.isArray(result.items)) result.items = []
        this.categories.push(result)
      }

      return result
    },
    async updateCategory(id: string, data: FormData) {
      const result = await API.updateCategory(id, data) as ExtendedCategory
      if (!('errors' in result)) {
        const categoryIndex = this.categories.findIndex((category: Category) => category.id === Number(id))
        if (categoryIndex > -1) {
          if (!Array.isArray(result.items)) result.items = []
          this.categories[categoryIndex] = result
        }
      }

      return result
    },
    async deleteCategory(id: string) {
      const result = await API.deleteCategory(id)
      if (!('errors' in result)) {
        const categoryIndex = this.categories.findIndex((category: Category) => category.id === Number(id))
        if (categoryIndex > -1) this.categories.splice(categoryIndex, 1)
      }

      return result
    },
    async createItem(data: FormData) {
      const result = await API.createItem(data)
      if (!('errors' in result)) {
        this._updateItems(result)
      }

      return result
    },
    async updateItem(id: string, data: FormData) {
      const result = await API.updateItem(id, data)
      if (!('errors' in result)) {
        this._updateItems(result)
      }

      return result
    },
    async deleteItem(id: string) {
      const result = await API.deleteItem(id)
      if (!('errors' in result)) {
        this._updateItems(result, true)
      }

      return result
    },
    addToCart(id: number) {
      const inCart = this.cart.find((cartItem: CartItem) => cartItem.id === id)

      if (inCart) inCart.quantity = inCart.quantity + 1
    },
    removeFromCart(id: number) {
      const inCart = this.cart.find((cartItem: CartItem) => cartItem.id === id)

      if (inCart && inCart.quantity > 0) inCart.quantity = inCart.quantity - 1
    }
  }
})