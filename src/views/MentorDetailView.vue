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

    <!-- Mentor not found -->
    <div v-else-if="!mentor">
      <EmptyState type="error" message="导师不存在" />
    </div>

    <!-- Mentor found -->
    <div v-else>
      <!-- Back button -->
      <button
        class="text-sm text-blue-600 hover:text-blue-800 transition-colors mb-4"
        @click="router.push({ name: 'mentor-list' })"
      >
        ← 返回
      </button>

      <!-- Mentor name -->
      <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ mentor.n }}</h1>

      <!-- School | Department -->
      <p class="text-sm text-gray-500 mb-4">
        {{ mentor.s }}<span v-if="mentor.s && mentor.d"> | </span>{{ mentor.d }}
      </p>

      <!-- Rating and review count -->
      <div
        v-if="mentor.rv && mentor.rv.length > 0"
        class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-6"
      >
        <div>
          <p class="text-xs text-gray-500 mb-1">平均评分</p>
          <StarRating :rating="avgRating" />
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">评价数量</p>
          <p class="text-lg font-semibold text-gray-800">{{ mentor.rv.length }} 条</p>
        </div>
      </div>

      <div
        v-else
        class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-6"
      >
        <div>
          <p class="text-xs text-gray-500 mb-1">平均评分</p>
          <p class="text-sm text-gray-400">暂无评价</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">评价数量</p>
          <p class="text-lg font-semibold text-gray-400">0 条</p>
        </div>
      </div>

      <!-- Reviews section -->
      <div v-if="sortedReviews.length > 0" class="mt-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          评价 ({{ sortedReviews.length }})
        </h2>
        <div class="space-y-3">
          <div
            v-for="(review, idx) in sortedReviews"
            :key="idx"
            class="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div class="flex items-center gap-2 mb-3">
              <StarRating :rating="review.r" />
            </div>
            <div
              class="text-sm text-gray-700 leading-relaxed"
              v-html="review.c"
            ></div>
          </div>
        </div>
      </div>

      <div v-else-if="mentor && !loading" class="mt-8">
        <EmptyState type="empty" message="暂无评价" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StarRating from '../components/StarRating.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()

const mentorId = computed(() => Number(route.params.id))
const bucket = computed(() => Math.floor(mentorId.value / 1000))

const loading = ref(true)
const fetchError = ref(false)
const mentor = ref(null)

onMounted(async () => {
  try {
    if (!Number.isFinite(mentorId.value)) {
      fetchError.value = true
      return
    }

    const res = await fetch(`${import.meta.env.BASE_URL}data/mentor-detail/${bucket.value}.json`)
    if (!res.ok) {
      fetchError.value = true
      return
    }

    const data = await res.json()
    mentor.value = data[mentorId.value] ?? null
  } catch {
    fetchError.value = true
  } finally {
    loading.value = false
  }
})

const avgRating = computed(() => {
  const rv = mentor.value?.rv
  if (!rv || rv.length === 0) return 0
  const sum = rv.reduce((acc, r) => acc + (r.r || 0), 0)
  return sum / rv.length
})

const sortedReviews = computed(() => {
  const rv = mentor.value?.rv
  if (!rv || rv.length === 0) return []
  return [...rv].sort((a, b) => b.r - a.r)
})
</script>
