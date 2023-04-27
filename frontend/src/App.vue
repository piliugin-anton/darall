<template>
  <main>
    <Header />
    <RouterView v-slot="{ Component, route }">
      <transition :name="route.meta.transition || 'fade'" mode="out-in" :duration="250">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
    <vue3-snackbar bottom right :duration="4000"></vue3-snackbar>
    <ModalsContainer />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Vue3Snackbar } from 'vue3-snackbar'
import { ModalsContainer } from 'vue-final-modal'
import { useApplicationStore } from './store'
import Header from './components/Header.vue'
const applicationStore = useApplicationStore()

onMounted(() => {
  applicationStore.fetchCategories()
})
</script>