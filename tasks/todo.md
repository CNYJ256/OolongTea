# 任务清单

## Phase 1: 数据管线

### T1 — 安装 xlsx npm 包
**状态：** pending
**依赖：** 无

- [ ] `npm install xlsx --save-dev`
- **验证：** `node -e "const XLSX = require('xlsx'); console.log('ok')"` 成功

### T2 — 创建 scripts/build-mentor-data.js
**状态：** pending
**依赖：** T1

**做什么：**
1. 用 `xlsx` 包读取项目根目录的 `2024导师评价数据V2.0.xlsx`
2. 读取前两个 sheet（`导师评价_1` 和 `导师评价_0`）
3. 统一字段映射：每行 → `{ school, department, name, rating, comment }`
   - `导师评价_1` headers: 学校/学院/姓名/评分/评价
   - `导师评价_0` headers: 学校/专业/姓名/评分/评价
4. 按 `school + name` 分组聚合：
   - `ratingAvg = mean(rating)`
   - `ratingCount = count`
   - `reviews = [{r, c}, ...]` 保留所有原始评价
5. 分配 ID（从 1 自增）
6. 输出三个文件：
   - `public/data/mentor-index.min.json` — `[{i, n, s, d, r, c}, ...]`
   - `public/data/mentor-detail/{bucket}.json` — `{id: {n, s, d, rv: [{r, c}, ...]}}`
   - `public/data/mentor-filter-options.min.json` — `{s: [...], d: [...]}`
7. 打印构建摘要（导师数、评价数、bucket 数）

**注意：**
- 确保输出目录存在
- 去除空白/纯空格 name，去除无评价内容的记录
- 字段缩写对齐课程数据风格：`i`/`n`/`s`/`d`/`r`/`c`/`rv`

**验证：**
- `node scripts/build-mentor-data.js` 成功运行，输出摘要
- `public/data/mentor-index.min.json` 存在且是有效 JSON
- `public/data/mentor-detail/` 下有 bucket 文件
- `public/data/mentor-filter-options.min.json` 存在

### T3 — 更新 package.json build:data 脚本
**状态：** pending
**依赖：** T2

- [ ] 将 `"build:data"` 改为依次运行 `build-mentor-data.js` 和 `build-data.js`
  ```
  "build:data": "node scripts/build-mentor-data.js && node scripts/build-data.js"
  ```
- **验证：** `npm run build:data` 运行成功

### T4 — 更新 .gitignore
**状态：** pending
**依赖：** 无

- [ ] 添加 `2024导师评价数据V2.0.xlsx`
- **验证：** `git status` 不显示 xlsx 为新增文件

### T5 — 运行 build:data 验证全链路
**状态：** pending
**依赖：** T3, T4

- [ ] `npm run build:data` 成功完成
- [ ] 三个 mentor JSON 文件 + 现有课程 JSON 文件全部存在
- [ ] 抽查一个 mentor-detail bucket 文件内容结构正确
- **验证：** 所有文件存在且格式正确

---

## Phase 2: 基础设施 + 导航首页

### T6 — SearchBar 添加 placeholder prop
**状态：** pending
**依赖：** 无（可与其他 T6-T9 并行）

- [ ] 添加 `placeholder` prop（String, 默认值 "搜索课程名、教师、代码..."）
- [ ] 模板中用 `:placeholder` 绑定 prop 替代硬编码
- **验证：** 课程页搜索框仍显示正确 placeholder

### T7 — FilterBar 改为可配置
**状态：** pending
**依赖：** 无

- [ ] 添加 `filterLabels` prop：`{ first: '分类', second: '院系' }`（默认值保持现有行为）
- [ ] 模板中用 `filterLabels.first` / `filterLabels.second` 替代硬编码标签
- [ ] 当某个选项列表为空数组时隐藏该下拉
- **验证：** 课程页筛选栏显示 "分类" 和 "院系" 标签，行为不变

### T8 — 更新路由
**状态：** pending
**依赖：** 无

- [ ] `/` → NavHomeView（新）
- [ ] `/courses` → HomeView（原 `/` 的内容）
- [ ] `/course/:id` → CourseDetailView（不变）
- [ ] `/mentors` → MentorListView（新 — 可先用占位组件）
- [ ] `/mentor/:id` → MentorDetailView（新 — 可先用占位组件）
- [ ] `/:pathMatch(.*)*` → NotFoundView（不变）
- **验证：** 运行 `npm run dev`，能在各路由间导航（新页面可为占位）

### T9 — 创建 NavHomeView.vue
**状态：** pending
**依赖：** T8（路由需先更新才能看到效果）

**设计：**
- 居中布局，顶部标题「乌龙茶选课社区」
- 两个卡片并排（移动端上下堆叠）
  - 左：「课程评价」— 副标题 "8,451 门课程 · 7,323 条评价" — 点击跳 `/courses`
  - 右：「导师评价」— 副标题 "{N} 位导师 · {M} 条评价" — 点击跳 `/mentors`
- 卡片 hover 效果（shadow + translate，对齐 CourseCard 风格）
- 浅色渐变或纯色背景
- 导师数据从 `mentor-index.min.json` fetch 以获得总数

**验证：**
- `/` 路由显示导航首页
- 两张卡片可见，hover 有交互效果
- 点击「课程评价」→ `/courses`
- 点击「导师评价」→ `/mentors`
- 移动端（< 640px）卡片上下堆叠

---

## Phase 3: 导师列表模块

### T10 — 创建 MentorCard.vue
**状态：** pending
**依赖：** 无（纯组件，props 驱动）

**设计：**
- Props: `mentor: { i, n, s, d, r, c }` 
- 展示：姓名（主标题）、学校 | 院系（副行）、StarRating + 评价数
- 点击跳转 `/mentor/:id`
- 样式对齐 CourseCard.vue（相同的 border/rounded/hover 效果）

**验证：**
- 用硬编码数据测试，组件正确渲染
- 点击卡片触发 router.push → `/mentor/:id`

### T11 — 创建 MentorListView.vue
**状态：** pending
**依赖：** T6, T7, T10

**做什么：**
1. onMounted：fetch `mentor-index.min.json` + `mentor-filter-options.min.json`
2. 初始化 Fuse.js（`keys: ['n', 's', 'd']`, `threshold: 0.4`）
3. SearchBar（placeholder="搜索导师姓名、学校、院系..."）
4. FilterBar（filterLabels: { first: '学校', second: '院系' }）
5. 计算属性：fuse 搜索 → 筛选 → 可信度排序
6. URL query 双向同步（q / s / d）
7. EmptyState 无结果时显示
8. Loading / Error 状态

**验证：**
- `/mentors` 显示导师列表
- 搜索框输入能过滤导师
- 学校和院系下拉筛选有效
- URL query 同步搜索/筛选条件
- 点击导师卡片跳转详情页
- 刷新页面保持搜索条件

---

## Phase 4: 导师详情模块

### T12 — 创建 MentorDetailView.vue
**状态：** pending
**依赖：** T2（需要 mentor-detail 数据结构）

**做什么：**
1. 从 route params 取 id，计算 bucket
2. Fetch `mentor-detail/{bucket}.json`，取对应 id 的数据
3. 显示：返回按钮、姓名、学校、院系、平均评分 + 评价数
4. 所有评价条目列表（评分星星 + 评价内容 HTML）
5. Loading / Error / Not Found 状态
6. 评价按原始顺序展示（无需排序，因为是按评价录入顺序）

**验证：**
- 从列表页点击导师 → 详情页正确显示
- 显示正确数量的评价条目
- 返回按钮回到列表页
- 无效 ID 显示错误状态

---

## Phase 5: 集成验证

### T13 — npm run build 完整构建
**状态：** pending
**依赖：** 所有 T1-T12

- [ ] `npm run build` 成功（build:data → vite build）
- [ ] `dist/` 目录包含所有 HTML/JS/CSS + data/ 文件
- [ ] 没有 console error

### T14 — 手动验证清单
**状态：** pending
**依赖：** T13

- [ ] `/` — 导航首页正确显示，两个卡片可点击
- [ ] `/courses` — 课程搜索/筛选功能正常
- [ ] `/course/:id` — 课程详情正常（包括返回）
- [ ] `/mentors` — 导师列表，搜索/筛选正常，URL query 同步
- [ ] `/mentor/:id` — 导师详情正常，返回按钮工作
- [ ] `/nonexistent` — 404 页面正常
- [ ] 移动端布局（Chrome DevTools 手机模拟）
