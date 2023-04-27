<template>
    <div class="input">
        <label for="login-email" class="input__label">{{ text }}</label>
        <div class="input__field-container">
            <input id="login-email" :type="type" :value="modelValue" @input="updateValue" @blur="$emit('blur')" class="input__field-container__input" :class="{ error: errors.length }" :placeholder="text">
            <div v-if="errors.length" class="input__field-container__errors">
                <div class="input__field-container__errors__error" v-for="error of errors" :key="error.$uid">
                    {{ error.$message }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { ErrorObject } from '@vuelidate/core'

    defineProps<{ text: string, modelValue: string, type: string, errors: ErrorObject[] }>()
    const emit = defineEmits(['update:modelValue', 'blur'])
    const updateValue = (e: Event) => {
        emit('update:modelValue', (e.target as HTMLInputElement).value)
    }
</script>

<style lang="scss">
.input {
    &__label {
        font-weight: 600;
        display: block;
        margin-bottom: 2px;
    }

    &__field-container {
        &__input {
            height: 40px;
            padding: 0 8px;
            border-radius: 8px;
            border: 2px solid white;
            background-color: $secondary;

            &:focus {
                outline: none;
                border: 2px solid $accent;
                background-color: rgba(220, 71, 18, 0.1 );
            }

            &.error {
                border: 2px solid #ff0000;
                background-color: rgba(255, 0, 0, 0.1);
            }
        }

        &__errors {
            color: #ff0000;
            font-weight: bold;
        }
    }
}
</style>