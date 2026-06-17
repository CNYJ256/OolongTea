<template>
  <div
    class="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer
           transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    @click="goToDetail"
  >
    <!-- Mentor name -->
    <h3 class="text-lg font-semibold text-gray-900 mb-1.5 truncate">
      {{ mentor.n }}
    </h3>

    <!-- School | Department -->
    <p class="text-sm text-gray-500 mb-2.5 truncate">
      {{ mentor.s }}<span v-if="mentor.s && mentor.d"> | </span>{{ mentor.d }}
    </p>

    <!-- Rating and review count -->
    <div class="flex items-center gap-2">
      <StarRating :rating="mentor.r" />
      <span v-if="mentor.c > 0" class="text-xs text-gray-400">
        ({{ mentor.c }}条)
      </span>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import StarRating from './StarRating.vue'

const props = defineProps({
  mentor: {
    type: Object,
    required: true,
  },
})

const router = useRouter()

function goToDetail() {
  router.push({ name: 'mentor-detail', params: { id: props.mentor.i } })
}
</script>
