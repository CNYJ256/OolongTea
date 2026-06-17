<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- Search -->
    <SearchBar v-model="searchQuery" placeholder="搜索课程名、教师、代码..." />

    <div class="mt-4">
      <!-- Filters -->
      <FilterBar
        :categories="[]"
        :departments="filterOptions.d"
        :category="''"
        :department="selectedDepartment"
        :filterLabels="{ first: '分类', second: '院系' }"
        @update:category="() => {}"
        @update:department="selectedDepartment = $event"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading">
      <EmptyState type="loading" />
    </div>

    <!-- Error state -->
    <div v-else-if="error">
      <EmptyState type="error" />
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Result count -->
      <p class="text-sm text-gray-500 mt-4 mb-3">
        <template v-if="searchQuery">
          共 {{ filteredCourses.length }} 个结果，按匹配度排序
        </template>
        <template v-else>
          共 {{ filteredCourses.length }} 个结果，按可信度排序
        </template>
      </p>

      <!-- Empty results -->
      <div v-if="filteredCourses.length === 0">
        <EmptyState type="empty" message="没有找到匹配的课程" />
      </div>

      <!-- Course cards -->
      <div v-else class="space-y-3">
        <YourTJCard
          v-for="course in filteredCourses"
          :key="course.i"
          :course="course"
        />
      </div>

      <!-- Footer: data source attribution -->
      <p class="text-xs text-gray-400 text-center mt-12 pb-6">
        数据来源：<a
          href="https://jcourse.yourtj.de"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-500 hover:text-blue-600 transition-colors"
        >YourTJ 公开课程评价数据</a>。本站仅做静态索引与展示，如需查看原始数据或提交评价，请访问原站。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, shallowRef, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Fuse from 'fuse.js'

import SearchBar from '../components/SearchBar.vue'
import FilterBar from '../components/FilterBar.vue'
import YourTJCard from '../components/YourTJCard.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()

// --- State ---
const allCourses = ref([])
const filterOptions = ref({ d: [] })
const fuse = shallowRef(null)
const loading = ref(true)
const error = ref(false)

// --- Search & Filter — initialized from URL query params ---
const searchQuery = ref(route.query.q || '')
const selectedDepartment = ref(route.query.d || '')

// --- Data loading ---
onMounted(async () => {
  try {
    const [coursesRes, filterRes] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/yourtj/yourtj-index.min.json`),
      fetch(`${import.meta.env.BASE_URL}data/yourtj/yourtj-filter-options.min.json`),
    ])

    if (!coursesRes.ok || !filterRes.ok) {
      throw new Error('Failed to load data')
    }

    allCourses.value = await coursesRes.json()
    filterOptions.value = await filterRes.json()

    // Initialize Fuse.js index with weighted keys
    fuse.value = new Fuse(allCourses.value, {
      keys: [
        { name: 'n', weight: 0.45 },
        { name: 'o', weight: 0.30 },
        { name: 't', weight: 0.20 },
        { name: 'd', weight: 0.05 },
      ],
      threshold: 0.4,
      useExtendedSearch: true,
    })
  } catch (e) {
    console.error('Failed to load YourTJ data:', e)
    error.value = true
  } finally {
    loading.value = false
  }
})

// --- Multi-keyword search with $and ---
function searchWithKeywords(query) {
  if (!query || !fuse.value) return allCourses.value

  const keywords = query.trim().split(/\s+/)
  if (keywords.length === 0) return allCourses.value

  if (keywords.length === 1) {
    return fuse.value.search(keywords[0]).map((r) => r.item)
  }

  // Multi-keyword: join with $and for Fuse.js extended search
  const fuseQuery = { $and: keywords.map((kw) => ({ n: kw, o: kw, t: kw, d: kw })) }

  return fuse.value.search(fuseQuery).map((r) => r.item)
}

// --- Filtered + sorted results ---
const filteredCourses = computed(() => {
  let results = searchWithKeywords(searchQuery.value)

  // Department filter
  if (selectedDepartment.value) {
    results = results.filter((c) => c.d === selectedDepartment.value)
  }

  if (searchQuery.value && fuse.value) {
    // Search active sort: Fuse score → review count desc → rating desc → localeCompare
    const fuseResults = fuse.value.search(
      searchQuery.value.trim().split(/\s+/).length > 1
        ? { $and: searchQuery.value.trim().split(/\s+/).map((kw) => ({ n: kw, o: kw, t: kw, d: kw })) }
        : searchQuery.value
    )
    const scoreMap = new Map()
    fuseResults.forEach((r) => {
      scoreMap.set(r.item.i, r.score)
    })

    return [...results].sort((a, b) => {
      const scoreA = scoreMap.get(a.i) ?? 999
      const scoreB = scoreMap.get(b.i) ?? 999
      if (scoreA !== scoreB) return scoreA - scoreB
      // Same score → review count desc
      if ((b.c || 0) !== (a.c || 0)) return (b.c || 0) - (a.c || 0)
      // Same review count → rating desc
      if (b.r !== a.r) return b.r - a.r
      // Same rating → localeCompare
      return (a.n || '').localeCompare(b.n || '', 'zh-CN')
    })
  }

  // Default sort: credibility score r * log(c + 1) descending
  return [...results].sort((a, b) => {
    const scoreA = a.r * Math.log((a.c || 0) + 1)
    const scoreB = b.r * Math.log((b.c || 0) + 1)
    return scoreB - scoreA
  })
})

// --- Sync state to URL ---
watch([searchQuery, selectedDepartment], ([q, d]) => {
  router.replace({
    query: {
      q: q || undefined,
      d: d || undefined,
    },
  })
})
</script>
