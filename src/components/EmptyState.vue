<template>
  <div class="flex flex-col items-center justify-center py-16 px-4">
    <!-- Loading state -->
    <div v-if="type === 'loading'" class="flex flex-col items-center gap-4">
      <div
        class="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
      ></div>
      <p class="text-gray-500 text-base">{{ resolvedMessage }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="type === 'empty'" class="flex flex-col items-center gap-4">
      <svg
        class="w-16 h-16 text-gray-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p class="text-gray-400 text-base">{{ resolvedMessage }}</p>
      <slot />
    </div>

    <!-- Error state -->
    <div v-else class="flex flex-col items-center gap-4">
      <svg
        class="w-16 h-16 text-red-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p class="text-red-500 text-base">{{ resolvedMessage }}</p>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'empty',
    validator: (v) => ['loading', 'empty', 'error'].includes(v),
  },
  message: {
    type: String,
    default: null,
  },
})

const defaults = {
  loading: '加载中...',
  empty: '没有找到相关内容',
  error: '加载失败，请稍后重试',
}

const resolvedMessage = computed(() => {
  return props.message ?? defaults[props.type]
})
</script>
