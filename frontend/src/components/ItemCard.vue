<template>
  <article class="item" :class="{ clickable: !editable, 'no-hover': isItem }" @click="!editable && emit('click', $event)">
    <div class="item__image" :style="`background-image: url('${image}')`">
      <label v-if="editable" class="item__image__label" :class="{ 'with-image' : image }">
        <input class="item__image__file" type="file" @change="$emit('imageChange', ($event.target as HTMLInputElement & EventTarget).files)" accept=".jpg, .jpeg, .png" />
      </label>
    </div>
    <div ref="titleRef" v-text="title" class="item__title" :contenteditable="editable" @focus="() => titleRef && handleFocus(titleRef, 'title')" @blur="() => titleRef && handleBlur(titleRef, 'title')" @input="() => titleRef && handleInput(titleRef, 'title')"></div>
    <div v-if="description !== undefined" ref="descriptionRef" v-text="description" class="item__description" :contenteditable="editable" @focus="() => descriptionRef && handleFocus(descriptionRef, 'description')" @blur="() => descriptionRef && handleBlur(descriptionRef, 'description')" @input="() => descriptionRef && handleInput(descriptionRef, 'description')"></div>
    <div v-if="price !== undefined" class="item__price">
      <div ref="priceRef" v-text="priceFormatted" :contenteditable="editable" class="item__price__text" @keypress="!$event.key.match(/^[0-9]{1}$/) && $event.preventDefault()" @focus="() => priceRef && handleFocus(priceRef, 'price')" @blur="() => priceRef && handleBlur(priceRef, 'price')" @input="() => priceRef && handleInput(priceRef, 'price')"></div>
      <div>&nbsp;&#8381;</div>
    </div>
    <div v-if="!editable && quantity !== undefined" class="item__controls">
      <button type="button" class="item__controls__button" :disabled="quantity < 1" @click.stop="$emit('qtyChange', -1)">-</button>
      <span class="item__controls__qty">{{ quantity }}</span>
      <button type="button" class="item__controls__button" @click.stop="$emit('qtyChange', 1)">+</button>
    </div>
    <button v-if="editable && created" class="item__remove" @click.stop="emit('delete')">X</button>
  </article>
</template>

<script setup lang="ts">
  import { ref, onUpdated, computed } from 'vue'
  import { getCaretPosition, setCaretPosition, numberWithSpaces } from '../helpers'

  const props = defineProps<{ title: string, image: string, editable: boolean, description?: string, price?: string | number, quantity?: number, created?: boolean }>()

  const titleRef = ref<HTMLDivElement | null>(null)
  const descriptionRef = ref<HTMLDivElement | null>(null)
  const priceRef = ref<HTMLDivElement | null>(null)
  const focusElement = ref<HTMLDivElement | null>(null)
  const caretPosition = ref(0)
  const emit = defineEmits(['input', 'blur', 'focus', 'imageChange', 'qtyChange', 'delete', 'click'])

  const priceFormatted = computed(() => props.editable ? props.price : numberWithSpaces(Number(props.price) || 0))
  const isItem = computed(() => props.description || props.price || props.quantity)

  function handleFocus(reference: HTMLDivElement, key: string) {
    focusElement.value = reference
    emit('focus', key)
  }

  function handleBlur(_reference: HTMLDivElement, key: string) {
    focusElement.value = null
    emit('blur', key)
  }

  function handleInput(_reference: HTMLDivElement, key: string) {
    if (!focusElement.value) return

    caretPosition.value = getCaretPosition(focusElement.value)

    emit('input', focusElement.value.innerText, key)
  }

  onUpdated(() => {
    if (focusElement.value) setCaretPosition(focusElement.value, caretPosition.value)
  })
</script>

<style scoped lang="scss">
.item {
  display: flex;
  flex-direction: column;
  position: relative;
  border: 2px solid $primary;
  border-radius: 16px;
  max-width: 314px;
  box-shadow: 4px 4px 16px 0px rgba(34, 60, 80, 0.25);
  background-color: $secondary;
  overflow: hidden;
  transition: all 250ms ease;

  &__remove {
    display: block;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
    height: 42px;
    width: 80px;
    cursor: pointer;
    background-color: rgb(255, 0, 0);
    color: white;
    font-size: 24px;
    font-weight: bold;
    border-left: 2px solid white;
    border-bottom: 2px solid white;
    border-right: none;
    border-top: none;

    &:hover {
      background-color: rgb(180, 0, 0);
    }
  }

  &:not(.no-hover).clickable {
    cursor: pointer;

    &__remove {
      display: none;
    }

    &:hover {
      transform: scale(1.1);
      z-index: 5;
      box-shadow: 8px 8px 24px 16px rgba(34, 60, 80, 0.2);

      .item__image {
        filter: brightness(110%);
      }
    }
  }

  &__image {
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    height: 240px;

    &__label {
      display: inline-block;
      width: 100%;
      height: 100%;
      cursor: pointer;
      background-image: url('/images/upload-image.svg');
      background-repeat: no-repeat;
      background-size: 80px;
      background-position: center center;

      &.with-image {
        background-size: 0 0;

        &:hover {
          background-size: 80px;
          background-color: rgba(255, 255, 255, 0.75);
        }
      }

      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
    }

    &__file {
      display: none;
    }
  }

  &__title {
    padding: 8px 16px;
    background-color: white;
    color: rgba(0, 0, 0, 0.75);
    font-size: 14px;
    font-weight: bold;

    &:focus {
      outline: none;
    }
  }

  &__description {
    flex: 1 0;
    padding: 8px 16px;
    background-color: $primary;

    &:focus {
      outline: none;
    }
  }

  &__price {
    padding: 4px 16px;
    background-color: white;
    text-align: right;
    font-size: 18px;
    font-weight: bold;
    display: flex;

    &__text {
      flex: 1 0;
      text-align: right;

      &:focus {
        outline: none;
      }
    }
  }

  &__controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: white;
    border-top: 1px solid $secondary;
    
    &__button {
      border: none;
      height: 42px;
      width: 80px;
      background-color: $accent;
      color: white;
      cursor: pointer;
      font-size: 24px;
      font-weight: bold;

      &:disabled {
        background-color: rgba(0, 0, 0, 0.33);
      }

      &:not(:disabled):hover {
        background-color: $light-accent;
      }
    }

    &__qty {
      font-size: 24px;
      font-weight: bold;
    }
  }
}
</style>
