<template>
    <section class="signup">
        <FormInput class="mb-8" v-model="state.email" type="email" text="E-mail" :errors="v$.email.$errors" @blur="v$.email.$touch" />
        <FormInput class="mb-8" v-model="state.name" type="text" text="Имя" :errors="v$.name.$errors" @blur="v$.name.$touch" />
        <FormInput class="mb-16" v-model="state.password" type="password" text=" Пароль" :errors="v$.password.$errors" @blur="v$.password.$touch" />
        <div v-if="signupError">Ошибка регистрации: {{ signupError }}</div>
        <FormButton class="mb-8" text="Зарегистрироваться" color="accent" :disabled="v$.$invalid" @click="handleSubmit" />
        <router-link class="login-link" :to="{ name: 'Login' }">Авторизоваться</router-link>
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
import FormInput from '../components/FormInput.vue'
import FormButton from '../components/FormButton.vue'

const signupError = ref(null)
const route = useRoute()
const snackbar = useSnackbar()

const state = reactive({
  email: '',
  name: '',
  password: ''
})
const rules = {
  email: { required, email }, // Matches state.email
  name: { required },
  password: { required }
}

const v$ = useVuelidate(rules, state)

async function handleSubmit() {
    const auth = useAuthStore()
    
    try {
        await auth.signup(state)
        const to = route.query.redirect as string || { name: 'Home' }
        router.push(to)
    } catch (ex: any) {
        snackbar.add({
            type: 'error',
            text: 'Ошибка при регистрации'
        })
        console.log(ex.message)
    }
}
</script>

<style lang="scss">
.signup {
    max-width: 320px;
    margin: 0 auto;
}

.login-link {
    display: block;
}
</style>