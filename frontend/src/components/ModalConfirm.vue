<template>
    <VueFinalModal class="vue-final-modal" content-class="vue-final-modal__content" overlay-transition="vfm-fade" content-transition="vfm-fade">
        <h1 class="vue-final-modal__content__title">
            {{ title }}
        </h1>
        <div class="vue-final-modal__content__body">
            <slot />
        </div>
        <div class="vue-final-modal__content__controls">
            <FormButton class="vue-final-modal__content__controls__left" color="white" text="Закрыть" :disabled="false" @click="emit('close')" />
            <FormButton class="vue-final-modal__content__controls__right" color="accent" text="Подтверждаю" :disabled="false" @click="emit('confirm')" />
        </div>
    </VueFinalModal>
</template>

<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
import FormButton from './FormButton.vue'

defineProps<{ title?: string }>()
const emit = defineEmits<{ (e: 'confirm'): void, (e: 'close'): void }>()
</script>

<style lang="scss">
.vue-final-modal {
    &__content {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        max-width: 320px;
        padding: 32px 32px 24px 32px;
        border-radius: 8px;

        &__title {
            margin-top: 0;
        }

        &__body {
            font-size: 16px;
            margin-bottom: 32px;
            text-align: center;
        }

        &__controls {
            display: flex;
            justify-content: space-between;
            align-items: center;

            &__left {
                margin-right: 16px;
            }
        }
    }
}
</style>