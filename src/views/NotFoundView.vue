<template>
  <div class="max-w-lg mx-auto px-4 py-20">
    <EmptyState type="error" message="页面不存在" />
    <div class="text-center mt-4">
      <router-link to="/" class="text-blue-600 hover:text-blue-800 text-sm">
        ← 返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup>
import EmptyState from '../components/EmptyState.vue'
</script>
