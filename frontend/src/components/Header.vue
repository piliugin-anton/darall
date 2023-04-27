<template>
    <header class="header">
        <div v-if="$route.name !== 'Home' || $route.query.category" class="header__controls">
            <router-link :to="{ name: 'Home' }" class="header__controls__go-home">
                На главную страницу
            </router-link>
        </div>
        <div v-if="showControls" class="header__controls">
            <router-link v-if="!$route.query.category" :to="{ name: 'Edit' }" class="header__controls__new-category">
                + Добавить категорию
            </router-link>
            <router-link v-else :to="{ name: 'Edit', query: { category: $route.query.category } }" class="header__controls__new-item">
                + Добавить позицию
            </router-link>
            <Switch :states="Object.keys(MODE).filter((v) => isNaN(Number(v)))" :active="applicationStore.mode" @click="handleChangeMode" />
        </div>
        <div v-else-if="auth.token && auth.user?.role === 'USER'">
            <FormButton text="Стать администратором" color="white" :disabled="disablePrivelegesButton" @click="handleGetPrivileges" />
        </div>
        <router-link v-else-if="!auth.token && $route.name !== 'Login' && $route.name !== 'Sign-Up'" :to="{ name: 'Login', query: { redirect: $route.fullPath } }" class="header__controls__login">
            Авторизоваться
        </router-link>
    </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Switch from '../components/Switch.vue'
import FormButton from '../components/FormButton.vue'
import { useApplicationStore, useAuthStore } from '../store'
import { MODE } from '../store/application'

const applicationStore = useApplicationStore()
const auth = useAuthStore()
const route = useRoute()

const showControls = computed(() => route.name !== 'Edit' && auth.token && auth.user?.role === 'ADMIN')
const disablePrivelegesButton = ref(false)

function handleChangeMode(mode: number) {
    applicationStore.changeMode(mode)
}

async function handleGetPrivileges() {
    disablePrivelegesButton.value = true
    await auth.getPrivileges()
    disablePrivelegesButton.value = false
}
</script>

<style lang="scss">
.header {
    display: flex;
    justify-content: space-between;
    margin: 0 auto;
    max-width: 992px;
    height: 64px;
    text-align: right;
    line-height: 64px;

    &__controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 16px;
        height: 100%;
        width: 100%;

        &__new-item {
            margin-left: auto;
        }
    }
}
</style>