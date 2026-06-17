# 导航页 + 导师评价 — 实现计划

**日期：** 2026-06-17
**规格：** `docs/superpowers/specs/2026-06-17-mentor-nav-design.md`

## 依赖图

```
Phase 1: 数据管线
  ├─ [T1] 安装 xlsx npm 包
  ├─ [T2] 创建 scripts/build-mentor-data.js
  ├─ [T3] 更新 package.json build:data 脚本链
  ├─ [T4] 更新 .gitignore
  └─ [T5] 运行 build:data 验证输出
         │
         ▼
Phase 2: 基础设施 + 导航首页
  ├─ [T6] SearchBar 添加 placeholder prop
  ├─ [T7] FilterBar 改为可配置 filterLabels
  ├─ [T8] 更新路由（新路由 + 现有路由调整）
  └─ [T9] 创建 NavHomeView.vue
         │
         ▼
Phase 3: 导师列表模块
  ├─ [T10] 创建 MentorCard.vue
  └─ [T11] 创建 MentorListView.vue（数据加载 + Fuse.js + 搜索/筛选/排序）
         │
         ▼
Phase 4: 导师详情模块
  └─ [T12] 创建 MentorDetailView.vue
         │
         ▼
Phase 5: 集成验证
  ├─ [T13] npm run build 完整构建
  └─ [T14] 手动验证所有页面和功能
```

## 组件复用分析

| 现有组件 | 变更 |
|---|---|
| `SearchBar.vue` | 添加 `placeholder` prop（默认值 "搜索课程名、教师、代码..."） |
| `FilterBar.vue` | 添加 `filterLabels` prop 配置下拉标签；第二个筛选项可选 |
| `StarRating.vue` | 不变 |
| `EmptyState.vue` | 不变 |
| `ReviewCard.vue` | 不变（导师评价不需要 score badge 和 semester，不直接复用） |

## 导师评价卡片 vs 课程评价卡片

导师评价不需要 `ReviewCard.vue`（课程评价特有字段：score badge, semester, approves），导师评价条目在详情页用简单的内联列表展示。

## 分桶策略

导师 ID 从 1 自增。分桶 `Math.floor(id / 1000)`。预估去重后导师数 < 2 万，bucket 文件约 20 个。

## 数据文件结构

```
public/data/
  mentor-index.min.json       — [{i, n, s, d, r, c}, ...]
  mentor-detail/
    0.json                    — {id: {n, s, d, rv: [{r, c}, ...]}, ...}
    1.json
    ...
  mentor-filter-options.min.json — {s: [...], d: [...]}
```

## 搜索配置

Fuse.js 配置：`keys: ['n', 's', 'd']`, `threshold: 0.4`

## 排序

默认可信度排序：`r × ln(c + 1)`

## 路由变更摘要

| 原来 | 变为 |
|---|---|
| `/` → HomeView | `/` → NavHomeView |
| — | `/courses` → HomeView（原首页逻辑） |
| — | `/mentors` → MentorListView |
| — | `/mentor/:id` → MentorDetailView |
