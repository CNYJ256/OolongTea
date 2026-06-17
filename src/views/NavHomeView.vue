<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4 py-12">
    <div class="max-w-4xl w-full text-center mb-12">
      <h1 class="text-3xl font-bold text-gray-900 mb-3">乌龙茶选课社区</h1>
      <p class="text-gray-500 text-base">同济大学课程评价与导师评价社区</p>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-4xl">
      <!-- Course card -->
      <div
        class="w-full sm:w-[350px] bg-white border border-gray-200 rounded-xl p-8
               cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        @click="goToCourses"
      >
        <div class="text-4xl mb-4">📚</div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">课程评价</h2>
        <p class="text-sm text-gray-500 mb-4">搜索课程、查看评价与成绩分布</p>
        <p class="text-sm text-gray-400">
          <template v-if="courseCount !== null">{{ courseCount.toLocaleString() }} 门课程</template>
          <template v-else>加载中...</template>
        </p>
      </div>

      <!-- Mentor card -->
      <div
        class="w-full sm:w-[350px] bg-white border border-gray-200 rounded-xl p-8
               cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        @click="goToMentors"
      >
        <div class="text-4xl mb-4">👨‍🏫</div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">导师评价</h2>
        <p class="text-sm text-gray-500 mb-4">查看导师评价、选择合适导师</p>
        <p class="text-sm text-gray-400">
          <template v-if="mentorCount !== null">{{ mentorCount.toLocaleString() }} 位导师</template>
          <template v-else>加载中...</template>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const mentorCount = ref(null)
const courseCount = ref(null)

onMounted(async () => {
  try {
    const [mentorRes, courseRes] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/mentor-index.min.json`),
      fetch(`${import.meta.env.BASE_URL}data/courses-index.min.json`),
    ])

    if (mentorRes.ok) {
      const data = await mentorRes.json()
      mentorCount.value = data.length
    }

    if (courseRes.ok) {
      const data = await courseRes.json()
      courseCount.value = data.length
    }
  } catch {
    // Card still works without the count
  }
})

function goToCourses() {
  router.push({ name: 'home' })
}

function goToMentors() {
  router.push({ name: 'mentor-list' })
}
</script>
