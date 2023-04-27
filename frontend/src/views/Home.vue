<template>
    <section class="categories">
        <div class="categories__container">
            <Suspense v-if="selectedCategory && computedItems.length">
                <template #default>
                    <div class="categories__container__content">
                        <h1>Категория <span class="categories__container__content__text">{{ selectedCategory.title }}</span></h1>
                        <div class="categories__container__content__list">
                            <ItemCard v-for="(item, index) in computedItems" :key="`item-${index}`" class="edit__container__items__item" :title="item.state.title" :description="item.state.description" :price="item.state.price" :quantity="item.quantity" :image="item.state.image" :editable="applicationStore.mode === MODE.Редактирование" :created="item.state.created" @focus="item.handleFocus" @blur="item.handleBlur" @input="item.handleInput" @imageChange="item.handleImageChange" @delete="item.handleDelete" />
                        </div>
                    </div> 
                </template>
                <template #fallback>
                    <span>Загрузка...</span>
                </template>
            </Suspense>
            <Suspense v-else-if="!selectedCategory && computedCategories.length">
                <template #default>
                    <div class="categories__container__content">
                        <h1>Категории</h1>
                        <div class="categories__container__content__list">
                            <ItemCard v-for="data in computedCategories" :key="`category-${data.categoryId.value}`" :title="data.state.title" :image="data.state.image" :editable="applicationStore.mode === MODE.Редактирование" :created="data.state.created" @focus="data.handleFocus" @blur="data.handleBlur" @input="data.handleInput" @imageChange="data.handleImageChange" @click="handleClick" @delete="data.handleDelete" />
                        </div>
                    </div>
                </template>
                <template #fallback>
                    <span>Загрузка...</span>
                </template>
            </Suspense>
            <div v-else class="categories__container__no-data">Нет данных для отображения</div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue'
import { useRoute } from 'vue-router'
import ItemCard from '../components/ItemCard.vue'
import router from '../router'
import { Category } from '../../../backend/node_modules/.prisma/client/index'
import { useApplicationStore, MODE, CartItem } from '../store'
import { Item } from '../../../backend/node_modules/.prisma/client/index'
import useEdit from '../helpers/useEdit'

const applicationStore = useApplicationStore()
const route = useRoute()
const selectedCategory = computed(() => applicationStore.categories.find((category: Category) => category.id === Number(route.query.category)))
const computedCategories = computed(() => applicationStore.categories.map((category: Category) => useEdit({ data: category, isItem: false })))
const computedItems = computed(() => {
    const selected = unref(selectedCategory) as Category & { items: Item[] }
    if (!Array.isArray(selected.items)) return []

    return selected.items.map((item: Item) => {
        const data = useEdit({ data: item, isItem: true })
        const inCart = applicationStore.cart.find((cartItem: CartItem) => cartItem.id === item.id)
        const dataItem = data as typeof data & { quantity: number }
        dataItem.quantity = inCart ? inCart.quantity : 0

        return dataItem
    })
})

function handleClick() {
    if (applicationStore.mode !== MODE.Просмотр || !route.params.category) return

    router.push({ name: 'Home', query: { category: route.params.category } })
}
</script>

<style lang="scss">
.categories {
    padding: 32px 8px;

    &__container {
        margin: 0 auto;
        max-width: 992px;

        &__controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }

        &__content {

            &__text {
                color: $accent;
            }

            &__list {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
        
                margin: -8px;

                & > * {
                    margin: 8px;
                    flex: 33.3%;
                    min-width: 314px;
                }
            }
        }

        &__no-data {
            text-align: center;
            font-weight: bold;
        }
    }
}
</style>