<template>
    <section class="edit">
        <h1 class="edit__title">Редактирование категории <span class="edit__title__text">{{ data.state.title }}</span></h1>
        <ItemCard class="edit__category" :title="data.state.title" :image="data.state.image" :editable="true" :created="data.state.created" @focus="data.handleFocus" @blur="data.handleBlur" @input="data.handleInput" @imageChange="data.handleImageChange" @delete="data.handleDelete" />
        <div v-if="data.state.created" class="edit__container">
            <h2 class="edit__container__title">
                <span class="edit__container__title__text">Позиции в категории</span>
                <FormButton class="edit__container__add" text="Добавить позицию" color="accent" :disabled="false" @click="handleAddItem" />
            </h2>
            <div v-if="computedItems.length" class="edit__container__items">
                <ItemCard v-for="(item, index) in computedItems" :key="`item-${index}`" class="edit__container__items__item" :title="item.state.title" :description="item.state.description" :price="item.state.price" :quantity="0" :image="item.state.image" :editable="true" :created="item.state.created" @focus="item.handleFocus" @blur="item.handleBlur" @input="item.handleInput" @imageChange="item.handleImageChange" @delete="item.handleDelete" />
            </div>
            <div v-else class="edit__container__no-data">
                Нет данных для отображения
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue'
import ItemCard from '../components/ItemCard.vue'
import FormButton from '../components/FormButton.vue'
import useEdit from '../helpers/useEdit'
import { useApplicationStore } from '../store'
import { Item, Category } from '../../../backend/node_modules/.prisma/client/index'

const applicationStore = useApplicationStore()
const data = useEdit()
const selectedCategory = computed(() => applicationStore.categories.find((category: Category) => category.id === Number(data.categoryId.value)))
const computedItems = computed(() => {
    const selected = unref(selectedCategory) as Category & { items: Item[] }
    if (!Array.isArray(selected.items)) return []

    return selected.items.map((item: Item) => useEdit({ data: item, isItem: true }))
})

function handleAddItem() {
    const selected = unref(selectedCategory) as Category & { items: Item[] }
    const lastItem = selected?.items[selected.items.length - 1]

    if (lastItem && !lastItem.title && !lastItem.description && !lastItem.price) return

    applicationStore._updateItems({
        categoryId: selected.id,
        title: '',
        description: '',
        price: 0,
        _added: true
    })
}
</script>

<style lang="scss">
.edit {
    max-width: 992px;
    margin: 0 auto;
    padding-bottom: 64px;

    &__title {
        margin-bottom: 32px;

        &__text {
            color: $accent;
        }
    }

    &__category {
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 24px;
    }

    &__container {
        position: relative;

        &__title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        &__items {
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

        &__no-data {
            text-align: center;
            font-weight: bold;
        }
    }
}
</style>