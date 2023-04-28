<template>
    <section class="login">
        <FormInput class="mb-8" v-model="state.email" type="email" text="E-mail" :errors="v$.email.$errors" @blur="v$.email.$touch" />
        <FormInput class="mb-16" v-model="state.password" type="password" text=" Пароль" :errors="v$.password.$errors" @blur="v$.password.$touch" />
        <div v-if="loginErrors.length">Ошибка входа: {{ loginErrors }}</div>
        <FormButton class="mb-8" text="Войти" color="accent" :disabled="v$.$invalid" @click="handleSubmit" />
        <router-link class="signup-link" :to="`/sign-up${$route.query.redirect ? '?redirect=' + $route.query.redirect : ''}`">Зарегистрироваться</router-link>
    </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useVuelidate } from '@vuelidate/core'
import { required, email } from '@vuelidate/validators'
import { useSnackbar } from 'vue3-snackbar'
import router from '../router'
import { useAuthStore } from '../store'
import { errorsList } from '../helpers'
import FormInput from '../components/FormInput.vue'
import FormButton from '../components/FormButton.vue'
import { FieldValidationError } from '../../../backend/node_modules/express-validator'

const loginErrors = ref<string[] | FieldValidationError[]>([])
const route = useRoute()
const snackbar = useSnackbar()

const state = reactive({
  email: '',
  password: ''
})
const rules = {
  email: { required, email }, // Matches state.email
  password: { required }
}

const onError = () => snackbar.add({
    type: 'error',
    text: 'Ошибка при попытке входа'
})

const onSuccess = () => snackbar.add({
    type: 'info',
    text: 'Авторизация прошла успешно'
})

const v$ = useVuelidate(rules, state)

async function handleSubmit() {
    const auth = useAuthStore()
    
    try {
        const result = await auth.login({ email: state.email, password: state.password })
        if (!('errors' in result)) {
            onSuccess()
            const to = route.query.redirect as string || { name: 'Home' }
            router.push(to)
        } else {
            console.log(result.errors)
            onError()
            loginErrors.value = errorsList(result.errors)
        }
    } catch (ex: any) {
        snackbar.add({
            type: 'error',
            text: 'Ошибка при попытке входа'
        })
        console.log(ex.message)
    }
}
</script>

<style lang="scss">
.login {
    max-width: 320px;
    margin: 0 auto;
}

.signup-link {
    display: block;
}
</style>