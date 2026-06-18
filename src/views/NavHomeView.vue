<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4 py-12">
    <div class="max-w-4xl w-full text-center mb-12">
      <h1 class="text-3xl font-bold text-gray-900 mb-3">选课社区备份</h1>
      <p class="text-gray-500 text-base">数据来源旧乌龙茶社区、YourTJ社区API和个人收集</p>
      <p class="text-gray-500 text-base">欢迎前往
        <a
          href="https://github.com/cnyj256/"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
        >
          Github
        </a>
        提供相关数据。
      </p>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-4xl">
      <!-- Course card -->
      <div
        class="w-full sm:w-[350px] bg-white border border-gray-200 rounded-xl p-8
               cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        @click="goToCourses"
      >
        <div class="text-4xl mb-4">📚</div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">乌龙茶社区(旧)</h2>
        <p class="text-sm text-gray-500 mb-4">2024-2026.5评价数据</p>
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
        <p class="text-sm text-gray-500 mb-4">查看导师评价、选择合适导师，2024年数据</p>
        <p class="text-sm text-gray-400">
          <template v-if="mentorCount !== null">{{ mentorCount.toLocaleString() }} 位导师</template>
          <template v-else>加载中...</template>
        </p>
      </div>

      <!-- YourTJ card -->
      <div
        class="w-full sm:w-[350px] bg-white border border-gray-200 rounded-xl p-8
               cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        @click="goToYourTJ"
      >
        <div class="text-4xl mb-4">🔗</div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">YourTJ(新)</h2>
        <p class="text-sm text-gray-500 mb-4">查看 YourTJ 课程评价，每周更新抓取</p>
        <p class="text-sm text-gray-400">
          <template v-if="yourtjCount !== null">{{ yourtjCount.toLocaleString() }} 门课程</template>
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
const yourtjCount = ref(null)

onMounted(async () => {
  try {
    const [mentorRes, courseRes, yourtjRes] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/mentor-index.min.json`),
      fetch(`${import.meta.env.BASE_URL}data/courses-index.min.json`),
      fetch(`${import.meta.env.BASE_URL}data/yourtj/yourtj-index.min.json`),
    ])

    if (mentorRes.ok) {
      const data = await mentorRes.json()
      mentorCount.value = data.length
    }

    if (courseRes.ok) {
      const data = await courseRes.json()
      courseCount.value = data.length
    }

    if (yourtjRes.ok) {
      const data = await yourtjRes.json()
      yourtjCount.value = data.length
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

function goToYourTJ() {
  router.push({ name: 'yourtj-list' })
}
</script>
