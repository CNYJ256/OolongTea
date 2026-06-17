<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4">
    <!-- Row 1: Rating, score badge, semester -->
    <div class="flex items-center gap-2 mb-2">
      <StarRating :rating="review.r" :show-numeric="false" />
      <span
        v-if="review.s"
        class="inline-block text-xs font-medium px-2 py-0.5 rounded"
        :class="scoreBadgeClass(review.s)"
      >
        {{ review.s }}
      </span>
      <span
        v-if="review.se"
        class="inline-block text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded"
      >
        {{ review.se }}
      </span>
    </div>

    <!-- Row 2: Comment -->
    <p
      v-if="review.c"
      class="text-sm text-gray-700 whitespace-pre-wrap mb-3"
    >
      {{ review.c }}
    </p>

    <!-- Row 3: Approves + created time -->
    <div class="flex items-center justify-between text-xs text-gray-400">
      <span>👍 {{ review.a ?? 0 }}</span>
      <span>{{ review.ca }}</span>
    </div>
  </div>
</template>

<script setup>
import StarRating from './StarRating.vue'

defineProps({
  review: {
    type: Object,
    required: true,
  },
})

function scoreBadgeClass(score) {
  const map = {
    '优': 'bg-green-50 text-green-700',
    '良': 'bg-blue-50 text-blue-700',
    '中': 'bg-yellow-50 text-yellow-700',
    '及格': 'bg-orange-50 text-orange-700',
    '不及格': 'bg-red-50 text-red-700',
  }
  return map[score] || 'bg-gray-100 text-gray-500'
}
</script>
