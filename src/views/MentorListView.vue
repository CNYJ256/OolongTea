<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- Search -->
    <SearchBar v-model="searchQuery" placeholder="搜索导师姓名、学校、院系..." />

    <div class="mt-4">
      <!-- Filters -->
      <FilterBar
        :categories="filterOptions.s"
        :departments="filterOptions.d"
        :category="selectedSchool"
        :department="selectedDepartment"
        :filterLabels="{ first: '学校', second: '院系' }"
        @update:category="selectedSchool = $event"
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
        共 {{ filteredMentors.length }} 个结果，按可信度排序
      </p>

      <!-- Empty results -->
      <div v-if="filteredMentors.length === 0">
        <EmptyState type="empty" message="没有找到匹配的导师" />
      </div>

      <!-- Mentor cards -->
      <div v-else class="space-y-3">
        <MentorCard
          v-for="mentor in filteredMentors"
          :key="mentor.i"
          :mentor="mentor"
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
import MentorCard from '../components/MentorCard.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()

// --- State ---
const allMentors = ref([])
const filterOptions = ref({ s: [], d: [] })
const fuse = shallowRef(null)
const loading = ref(true)
const error = ref(false)

// --- Search & Filter — initialized from URL query params ---
const searchQuery = ref(route.query.q || '')
const selectedSchool = ref(route.query.s || '')
const selectedDepartment = ref(route.query.d || '')

// --- Data loading ---
onMounted(async () => {
  try {
    const [mentorsRes, filterRes] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/mentor-index.min.json`),
      fetch(`${import.meta.env.BASE_URL}data/mentor-filter-options.min.json`),
    ])

    if (!mentorsRes.ok || !filterRes.ok) {
      throw new Error('Failed to load data')
    }

    allMentors.value = await mentorsRes.json()
    filterOptions.value = await filterRes.json()

    // Initialize Fuse.js index
    fuse.value = new Fuse(allMentors.value, {
      keys: ['n', 's', 'd'],
      threshold: 0.4,
    })
  } catch (e) {
    console.error('Failed to load mentor data:', e)
    error.value = true
  } finally {
    loading.value = false
  }
})

// --- Filtered + sorted results ---
const filteredMentors = computed(() => {
  let results = allMentors.value

  // Fuse.js search
  if (searchQuery.value && fuse.value) {
    results = fuse.value.search(searchQuery.value).map((r) => r.item)
  }

  // School filter (exact match on s)
  if (selectedSchool.value) {
    results = results.filter((m) => m.s === selectedSchool.value)
  }

  // Department filter (exact string match, d may be empty)
  if (selectedDepartment.value) {
    results = results.filter((m) => m.d === selectedDepartment.value)
  }

  // Sort by credibility score: r * log(c + 1)
  return [...results].sort((a, b) => {
    const scoreA = a.r * Math.log((a.c || 0) + 1)
    const scoreB = b.r * Math.log((b.c || 0) + 1)
    return scoreB - scoreA
  })
})

// --- Sync state to URL ---
watch([searchQuery, selectedSchool, selectedDepartment], ([q, s, d]) => {
  router.replace({
    query: {
      q: q || undefined,
      s: s || undefined,
      d: d || undefined,
    },
  })
})
</script>
