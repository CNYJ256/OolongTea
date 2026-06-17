<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- Search -->
    <SearchBar v-model="searchQuery" />

    <div class="mt-4">
      <!-- Filters -->
      <FilterBar
        :categories="filterOptions.g"
        :departments="filterOptions.d"
        :category="selectedCategory"
        :department="selectedDepartment"
        @update:category="selectedCategory = $event"
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
        共 {{ filteredCourses.length }} 个结果，按可信度排序
      </p>

      <!-- Empty results -->
      <div v-if="filteredCourses.length === 0">
        <EmptyState type="empty" message="没有找到匹配的课程" />
      </div>

      <!-- Course cards -->
      <div v-else class="space-y-3">
        <CourseCard
          v-for="course in filteredCourses"
          :key="course.i"
          :course="course"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, shallowRef, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Fuse from 'fuse.js'

import SearchBar from '../components/SearchBar.vue'
import FilterBar from '../components/FilterBar.vue'
import CourseCard from '../components/CourseCard.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()

// --- State ---
const allCourses = ref([])
const filterOptions = ref({ g: [], d: [] })
const fuse = shallowRef(null)
const loading = ref(true)
const error = ref(false)

// --- Search & Filter — initialized from URL query params ---
const searchQuery = ref(route.query.q || '')
const selectedCategory = ref(route.query.g || '')
const selectedDepartment = ref(route.query.d || '')

// --- Data loading ---
onMounted(async () => {
  try {
    const [coursesRes, filterRes] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/courses-index.min.json`),
      fetch(`${import.meta.env.BASE_URL}data/filter-options.min.json`),
    ])

    if (!coursesRes.ok || !filterRes.ok) {
      throw new Error('Failed to load data')
    }

    allCourses.value = await coursesRes.json()
    filterOptions.value = await filterRes.json()

    // Initialize Fuse.js index
    fuse.value = new Fuse(allCourses.value, {
      keys: ['n', 't', 'o', 'd', 'g'],
      threshold: 0.4,
    })
  } catch (e) {
    console.error('Failed to load course data:', e)
    error.value = true
  } finally {
    loading.value = false
  }
})

// --- Filtered + sorted results ---
const filteredCourses = computed(() => {
  let results = allCourses.value

  // Fuse.js search
  if (searchQuery.value && fuse.value) {
    results = fuse.value.search(searchQuery.value).map((r) => r.item)
  }

  // Category filter (exact match on g array)
  if (selectedCategory.value) {
    results = results.filter((c) => c.g && c.g.includes(selectedCategory.value))
  }

  // Department filter (exact string match, d may be null)
  if (selectedDepartment.value) {
    results = results.filter((c) => c.d === selectedDepartment.value)
  }

  // Sort by credibility score: r * log(c + 1)
  return [...results].sort((a, b) => {
    const scoreA = a.r * Math.log((a.c || 0) + 1)
    const scoreB = b.r * Math.log((b.c || 0) + 1)
    return scoreB - scoreA
  })
})

// --- Sync state to URL ---
watch([searchQuery, selectedCategory, selectedDepartment], ([q, g, d]) => {
  router.replace({
    query: {
      q: q || undefined,
      g: g || undefined,
      d: d || undefined,
    },
  })
})
</script>
