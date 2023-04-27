<template>
    <div ref="switchRef" class="switch">
        <div class="switch__active-bg" :style="activeBgStyle"></div>
        <div class="switch__state" :class="{ active: active === index }" v-for="(state, index) in states" :key="`switch-${index}`" @click.stop="$emit('click', index)">
            {{ state }}
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue'

    const switchRef = ref<HTMLDivElement | null>(null)
    const props = defineProps<{ states: string[], active: number }>()

    const activeBgStyle = computed(() => {
        const style = {
            left: '0px',
            width: '0px'
        }

        if (switchRef?.value?.children) {
            const activeElement = switchRef.value.children[props.active + 1] as HTMLDivElement
            const rect = activeElement.getBoundingClientRect()
            style.left = `${activeElement.offsetLeft}px`
            style.width = `${rect.width + 8}px`
        }

        return style
    })
</script>

<style lang="scss">
.switch {
    display: inline-flex;
    position: relative;
    flex-direction: row;
    justify-content: flex-end;
    min-width: 240px;
    height: 40px;
    background-color: $secondary;
    border: 2px solid transparent;
    border-radius: 8px;
    overflow: hidden;
    margin-left: auto;

    &__active-bg {
        position: absolute;
        top: 0;
        z-index: 0;
        border-radius: 5px;
        background-color: $primary;
        height: 100%;
        transition: left 250ms ease-in-out;
    }

    &__state {
        display: flex;
        position: relative;
        justify-content: flex-start;
        align-items: center;
        flex-grow: 1;
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.5);
        padding-left: 16px;
        padding-right: 8px;
        z-index: 1;
        cursor: pointer;
        transition: left 250ms ease-in-out;

        &:hover {
            color: rgba(0, 0, 0, 0.75);
        }

        &.active, &.active:hover {
            color: $accent;
            cursor: default;
        }
    }
}
</style>