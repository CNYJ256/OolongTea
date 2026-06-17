<template>
  <span class="inline-flex items-center gap-1">
    <!-- No rating / falsy -->
    <template v-if="!rating">
      <span class="text-gray-400 text-sm">暂无评价</span>
    </template>

    <!-- Stars displayed -->
    <template v-else>
      <span
        v-for="i in max"
        :key="i"
        class="text-lg leading-none"
        :class="starClass(i)"
      >
        {{ starChar(i) }}
      </span>
      <span v-if="showNumeric" class="text-gray-600 text-sm ml-1">
        {{ formattedRating }}
      </span>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rating: {
    type: Number,
    default: null,
  },
  max: {
    type: Number,
    default: 5,
  },
  showNumeric: {
    type: Boolean,
    default: true,
  },
})

const formattedRating = computed(() => {
  if (props.rating == null) return ''
  return Number(props.rating).toFixed(1)
})

function starClass(position) {
  const rating = props.rating ?? 0
  const remainder = rating % 1
  const whole = Math.floor(rating)

  if (position <= whole) return 'text-yellow-400'
  if (position === whole + 1 && remainder >= 0.25 && remainder < 0.75) return 'text-yellow-400'
  return 'text-gray-300'
}

function starChar(position) {
  const rating = props.rating ?? 0
  const remainder = rating % 1
  const whole = Math.floor(rating)

  if (position <= whole) return '★'
  if (position === whole + 1 && remainder >= 0.25 && remainder < 0.75) return '★'
  return '☆'
}
</script>
