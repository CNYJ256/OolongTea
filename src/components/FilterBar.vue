<template>
  <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
    <!-- Category filter -->
    <div v-if="categories.length > 0" class="flex-1">
      <label class="block text-xs text-gray-500 mb-1 font-medium">{{ filterLabels.first }}</label>
      <select
        :value="category"
        @change="$emit('update:category', ($event.target).value)"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
               bg-white transition-shadow"
      >
        <option value="">全部</option>
        <option v-for="cat in categories" :key="cat" :value="cat">
          {{ cat }}
        </option>
      </select>
    </div>

    <!-- Department filter -->
    <div v-if="departments.length > 0" class="flex-1">
      <label class="block text-xs text-gray-500 mb-1 font-medium">{{ filterLabels.second }}</label>
      <select
        :value="department"
        @change="$emit('update:department', ($event.target).value)"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
               bg-white transition-shadow"
      >
        <option value="">全部</option>
        <option v-for="dep in departments" :key="dep" :value="dep">
          {{ dep }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  departments: {
    type: Array,
    default: () => [],
  },
  category: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    default: '',
  },
  filterLabels: {
    type: Object,
    default: () => ({ first: '分类', second: '院系' }),
  },
})

defineEmits(['update:category', 'update:department'])
</script>
