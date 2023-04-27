<template>
    <button type="button" @click="handleClick" :class="['button', color]" :disabled="disabled">{{ text }}</button>
</template>

<script setup lang="ts">
    defineProps<{ text: string, disabled: boolean, color: string }>()
    const emit = defineEmits(['click'])
    const handleClick = (ev: Event) => {
        emit('click', ev)
    }
</script>

<style scoped lang="scss">
.button {
    height: 40px;
    border-radius: 8px;
    min-width: 80px;
    cursor: pointer;
    font-size: 14px;
    padding: 0 16px;
    &.accent {
        background-color: $accent;
        color: white;
        border: none;

        &:hover {
            background-color: $light-accent;
        }
    }

    &.white {
        background-color: white;
        color: $accent;
        border: 2px solid $light-accent;

        &:hover {
            color: $light-accent;
        }
    }

    &:disabled, &:disabled:hover {
        background-color: rgba(0, 0, 0, 0.33);
    }
}
</style>