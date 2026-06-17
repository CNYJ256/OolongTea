<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <!-- Loading state -->
    <div v-if="loading">
      <EmptyState type="loading" />
    </div>

    <!-- Fetch error state -->
    <div v-else-if="fetchError">
      <EmptyState type="error" />
    </div>

    <!-- Course not found -->
    <div v-else-if="!course">
      <EmptyState type="error" message="课程不存在" />
    </div>

    <!-- Course found -->
    <div v-else>
      <CourseHeader :course="course" @back="router.back()" />

      <!-- Reviews section -->
      <div v-if="sortedReviews.length > 0" class="mt-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          评价 ({{ sortedReviews.length }})
        </h2>
        <div class="space-y-3">
          <ReviewCard
            v-for="review in sortedReviews"
            :key="review.i"
            :review="review"
          />
        </div>
      </div>

      <div v-else class="mt-8">
        <EmptyState type="empty" message="暂无评价" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CourseHeader from '../components/CourseHeader.vue'
import ReviewCard from '../components/ReviewCard.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()

const courseId = computed(() => Number(route.params.id))
const bucket = computed(() => Math.floor(courseId.value / 1000))

const loading = ref(true)
const fetchError = ref(false)
const course = ref(null)

onMounted(async () => {
  try {
    if (!Number.isFinite(courseId.value)) {
      fetchError.value = true
      return
    }

    const res = await fetch(`${import.meta.env.BASE_URL}data/course-detail/${bucket.value}.json`)
    if (!res.ok) {
      fetchError.value = true
      return
    }

    const data = await res.json()
    course.value = data[courseId.value] ?? null
  } catch {
    fetchError.value = true
  } finally {
    loading.value = false
  }
})

const sortedReviews = computed(() => {
  const rv = course.value?.rv
  if (!rv || rv.length === 0) return []
  return [...rv].sort((a, b) => {
    if (a.ca < b.ca) return 1
    if (a.ca > b.ca) return -1
    return 0
  })
})
</script>
