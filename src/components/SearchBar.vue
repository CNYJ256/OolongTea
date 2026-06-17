<template>
  <div class="relative w-full">
    <!-- Search icon -->
    <svg
      class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
      />
    </svg>

    <!-- Input -->
    <input
      :value="localValue"
      @input="onInput"
      type="text"
      placeholder="搜索课程名、教师、代码..."
      class="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
             placeholder-gray-400 transition-shadow"
    />

    <!-- Clear button -->
    <button
      v-if="localValue"
      @click="clear"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      aria-label="清除搜索"
    >
      <svg
        class="w-4 h-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)

let debounceTimer = null

watch(
  () => props.modelValue,
  (newVal) => {
    localValue.value = newVal
  }
)

function onInput(e) {
  localValue.value = e.target.value
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:modelValue', localValue.value)
  }, 200)
}

function clear() {
  localValue.value = ''
  clearTimeout(debounceTimer)
  emit('update:modelValue', '')
}
</script>
