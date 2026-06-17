<template>
  <div>
    <!-- Row 1: Back button -->
    <button
      class="text-sm text-blue-600 hover:text-blue-800 transition-colors mb-4"
      @click="$emit('back')"
    >
      ← 返回
    </button>

    <!-- Row 2: Course name + code -->
    <div class="flex items-start justify-between gap-4 mb-3">
      <h1 class="text-2xl font-bold text-gray-900">{{ course.n }}</h1>
      <span class="text-sm text-gray-400 shrink-0 mt-1">{{ course.o }}</span>
    </div>

    <!-- Row 3: Teacher | Department | Credit -->
    <p class="text-sm text-gray-500 mb-3">
      <template v-if="course.t">{{ course.t }}</template>
      <span v-if="course.t && course.d"> | </span>
      <template v-if="course.d">{{ course.d }}</template>
      <span v-if="(course.t || course.d) && course.cr != null"> | </span>
      <template v-if="course.cr != null">{{ course.cr }} 学分</template>
    </p>

    <!-- Row 4: Category tags -->
    <div v-if="course.g && course.g.length" class="flex flex-wrap gap-1.5 mb-4">
      <span
        v-for="tag in course.g"
        :key="tag"
        class="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Row 5: Statistics -->
    <div
      v-if="reviewsCount > 0"
      class="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-3 gap-4"
    >
      <!-- Avg rating -->
      <div>
        <p class="text-xs text-gray-500 mb-1">平均评分</p>
        <StarRating :rating="avgRating" />
      </div>

      <!-- Review count -->
      <div>
        <p class="text-xs text-gray-500 mb-1">评价数量</p>
        <p class="text-lg font-semibold text-gray-800">{{ reviewsCount }} 条</p>
      </div>

      <!-- Score distribution -->
      <div>
        <p class="text-xs text-gray-500 mb-1">成绩分布</p>
        <p class="text-sm text-gray-700 leading-relaxed">
          <template v-for="(item, idx) in scoreDist" :key="item.label">
            <span v-if="idx > 0" class="text-gray-300 mx-0.5">/</span>
            {{ item.label }} {{ item.pct }}%
          </template>
        </p>
      </div>
    </div>

    <!-- No reviews fallback -->
    <div
      v-else
      class="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-4"
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
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StarRating from './StarRating.vue'

const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
})

defineEmits(['back'])

const reviewsCount = computed(() => {
  return (props.course.rv && props.course.rv.length) || 0
})

const avgRating = computed(() => {
  const rv = props.course.rv
  if (!rv || rv.length === 0) return 0
  const sum = rv.reduce((acc, r) => acc + (r.r || 0), 0)
  return sum / rv.length
})

const scoreDist = computed(() => {
  const rv = props.course.rv
  if (!rv || rv.length === 0) return []

  const counts = { '优': 0, '良': 0, '中': 0, '及格': 0, '不及格': 0, '未知': 0 }
  const known = new Set(['优', '良', '中', '及格', '不及格'])

  rv.forEach((r) => {
    const s = r.s
    if (known.has(s)) {
      counts[s]++
    } else {
      counts['未知']++
    }
  })

  const total = rv.length
  return Object.entries(counts)
    .filter(([, cnt]) => cnt > 0)
    .map(([label, cnt]) => ({
      label,
      pct: Math.round((cnt / total) * 100),
    }))
})
</script>
