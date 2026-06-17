<template>
  <div
    class="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer
           transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    @click="goToDetail"
  >
    <!-- Course name -->
    <h3 class="text-lg font-semibold text-gray-900 mb-1.5 truncate">
      {{ course.n }}
    </h3>

    <!-- Teacher | Department -->
    <p class="text-sm text-gray-500 mb-2.5 truncate">
      {{ course.t }}<span v-if="course.t && course.d"> | </span>{{ course.d }}
    </p>

    <!-- Credit -->
    <p v-if="course.cr != null && course.cr > 0" class="text-xs text-gray-400 mb-2">
      {{ course.cr }} 学分
    </p>

    <!-- Rating and review count -->
    <div class="flex items-center gap-2">
      <StarRating :rating="course.r" />
      <span v-if="course.c > 0" class="text-xs text-gray-400">
        ({{ course.c }}条)
      </span>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import StarRating from './StarRating.vue'

const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const route = useRoute()

function goToDetail() {
  router.push({ name: 'yourtj-detail', params: { id: props.course.i }, query: route.query })
}
</script>
