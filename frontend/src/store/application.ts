import { defineStore } from 'pinia'
import { Category, Item } from '../../../backend/node_modules/.prisma/client/index'
import * as API from '../api/index'

export enum MODE {
  Просмотр = 0,
  Редактирование = 1
}

export interface ApplicationState {
  mode: MODE
  categories: Category[],
  cart: CartItem[]
}

export interface CartItem {
  id: number
  quantity: number
}

export const useApplicationStore = defineStore('application', {
  state: () => ({
    mode: MODE.Просмотр,
    _initialLoad: false,
    categories: [],
    cart: []
  } as ApplicationState),
  actions: {
    _updateItems(item: Item, remove: boolean = false) {
      const category = this.categories.find((cat: Category) => cat.id === item.categoryId)
      if (category) {
        const findInArray = category.items.findIndex((itemInArray: Item) => itemInArray.id === item.id || itemInArray._added)

        if (remove && findInArray > -1) {
          category.items.splice(findInArray, 1)
          return
        }

        if (findInArray > -1) {
          category.items.splice(findInArray, 1, item)
        } else {
          category.items.push(item)
        }
      }
    },
    changeMode(mode: MODE) {
      this.mode = mode
    },
    async fetchCategories(force: boolean) {
      if (!this._initialLoad || force) {
        const result = await API.getCategories()
        if (!result.errors) {
          this.categories = result
          this._initialLoad = true
        }
      }
    },
    async getCategory(id: string) {
      let category = this.categories.find((category: Category) => category.id === Number(id))
      let updateCategories = false
      if (!category) {
        category = await API.getCategory(id)
        if (category && !category.errors) updateCategories = true
      }
      
      if (updateCategories) this.categories.push(category)

      return category
    },
    async createCategory(data: FormData) {
      const result = await API.createCategory(data)
      if (!result.errors) {
        if (!Array.isArray(result.items)) result.items = []
        this.categories.push(result)
      }

      return result
    },
    async updateCategory(id: string, data: FormData) {
      const result = await API.updateCategory(id, data)
      if (!result.errors) {
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
      if (!result.errors) {
        const categoryIndex = this.categories.findIndex((category: Category) => category.id === Number(id))
        if (categoryIndex > -1) this.categories.splice(categoryIndex, 1)
      }

      return result
    },
    async createItem(data: FormData) {
      const result = await API.createItem(data)
      if (!result.errors) {
        this._updateItems(result)
      }

      return result
    },
    async updateItem(id: string, data: FormData) {
      const result = await API.updateItem(id, data)
      if (!result.errors) {
        this._updateItems(result)
      }

      return result
    },
    async deleteItem(id: string) {
      const result = await API.deleteItem(id)
      if (!result.errors) {
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