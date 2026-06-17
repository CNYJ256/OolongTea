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
      <!-- Back button — preserves query -->
      <button
        class="text-sm text-blue-600 hover:text-blue-800 transition-colors mb-4"
        @click="router.push({ name: 'yourtj-list', query: route.query })"
      >
        &larr; 返回
      </button>

      <!-- Course name + code -->
      <div class="flex items-start justify-between gap-4 mb-3">
        <h1 class="text-2xl font-bold text-gray-900">{{ course.n }}</h1>
        <span class="text-sm text-gray-400 shrink-0 mt-1">{{ course.o }}</span>
      </div>

      <!-- Teacher | Department | Credit -->
      <p class="text-sm text-gray-500 mb-3">
        <template v-if="course.t">{{ course.t }}</template>
        <span v-if="course.t && course.d"> | </span>
        <template v-if="course.d">{{ course.d }}</template>
        <span v-if="(course.t || course.d) && course.cr != null"> | </span>
        <template v-if="course.cr != null">{{ course.cr }} 学分</template>
      </p>

      <!-- Semesters -->
      <p v-if="course.se && course.se.length" class="text-xs text-gray-400 mb-4">
        开课学期：{{ course.se.join('、') }}
      </p>

      <!-- Link to original site -->
      <p class="mb-4">
        <a
          :href="`https://jcourse.yourtj.de/course/${courseId}`"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          查看原站课程 &rarr;
        </a>
      </p>

      <!-- Rating and review count -->
      <div
        v-if="sortedReviews.length > 0"
        class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-6"
      >
        <div>
          <p class="text-xs text-gray-500 mb-1">平均评分</p>
          <StarRating :rating="avgRating" />
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">评价数量</p>
          <p class="text-lg font-semibold text-gray-800">{{ sortedReviews.length }} 条</p>
        </div>
      </div>

      <!-- No reviews fallback -->
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
            v-for="review in sortedReviews"
            :key="review.i"
            class="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div class="flex items-center justify-between mb-3">
              <StarRating :rating="review.r" :showNumeric="false" />
              <span class="text-xs text-gray-400">{{ review.se }}</span>
            </div>
            <!-- Rendered Markdown comment -->
            <div
              v-if="review.c"
              class="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
              v-html="renderMarkdown(review.c)"
            ></div>
            <!-- Footer: approve count -->
            <div v-if="review.a > 0" class="mt-3 flex items-center gap-1 text-xs text-gray-400">
              <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span>{{ review.a }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="course && !loading" class="mt-8">
        <EmptyState type="empty" message="暂无评价" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import StarRating from '../components/StarRating.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()

const courseId = computed(() => Number(route.params.id))
const bucket = computed(() => Math.floor(courseId.value / 1000))

const loading = ref(true)
const fetchError = ref(false)
const course = ref(null)

// ── Markdown rendering ─────────────────────────────────────────────────────

// DOMPurify whitelist configuration
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td']
const ALLOWED_ATTR = ['href']

function renderMarkdown(text) {
  if (!text) return ''

  // Parse Markdown to HTML (options per-call, setOptions removed in marked v12+)
  const rawHtml = marked.parse(text, { breaks: false, gfm: true })

  // Sanitize with DOMPurify
  const clean = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'style', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['style', 'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeypress', 'onkeyup', 'ondblclick', 'onmousedown', 'onmouseup', 'onmousemove', 'ontouchstart', 'ontouchend', 'ontouchmove'],
  })

  // Strip javascript: protocol links
  return clean.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
}

// ── Data loading ───────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    if (!Number.isFinite(courseId.value)) {
      fetchError.value = true
      return
    }

    const res = await fetch(`${import.meta.env.BASE_URL}data/yourtj/yourtj-detail/${bucket.value}.json`)
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

// ── Computed ───────────────────────────────────────────────────────────────

const avgRating = computed(() => {
  const rv = course.value?.rv
  if (!rv || rv.length === 0) return 0
  const sum = rv.reduce((acc, r) => acc + (r.r || 0), 0)
  return sum / rv.length
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
