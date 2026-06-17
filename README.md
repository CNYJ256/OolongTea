# 乌龙茶选课社区

同济大学课程评价与导师评价社区，基于「乌龙茶」选课社区数据构建的静态站点。

## 功能

| 模块 | 路径 | 说明 |
|------|------|------|
| 课程评价 | `/courses` | 搜索课程、查看评价与成绩分布 |
| 导师评价 | `/mentors` | 搜索导师、查看导师评价 |
| YourTJ | `/yourtj` | YourTJ 公开课程评价数据镜像 |

- 🔍 **模糊搜索** — 按名称、教师、代码、院系搜索
- 📊 **可信度排序** — 基于 `评分 × ln(评价数+1)` 排序，避免少量高分霸榜
- 📝 **评价浏览** — 课程详情、成绩分布、真实评价
- 🔗 **可分享** — 搜索条件保存在 URL 中，可直接复制分享
- 📱 **移动端适配**

## 技术栈

Vite + Vue 3 + Vue Router + Fuse.js + Tailwind CSS  
GitHub Actions → GitHub Pages 自动部署

## 数据

| 数据集 | 条目数 | 来源 |
|--------|--------|------|
| 课程评价 | 8,451 课程 · 7,323 评价 | 乌龙茶社区备份 |
| 导师评价 | 15,109 导师 · 28,282 评价 | 2024 导师评价数据 |
| YourTJ | ~9,271 课程 | [YourTJ](https://jcourse.yourtj.de) 公开 API |

## 本地开发

```bash
npm install
npm run dev            # 开发服务器（需先有 public/data/）
npm run build:data     # 课程 + 导师数据预处理
npm run sync:yourtj    # YourTJ 数据同步
npm run build          # 完整构建
```

## 自动同步

- **deploy.yml**：push 到 main 时构建并部署到 GitHub Pages
- **sync-yourtj.yml**：每周日自动同步 YourTJ 数据，有变更时自动提交

## 许可证

- **代码**：[GNU AGPL-3.0](LICENSE-CODE)
- **数据**：[ODbL-1.0](LICENSE-DATA)（Open Database License）

数据来源：乌龙茶社区备份数据、[YourTJ](https://jcourse.yourtj.de) 公开课程评价数据。本站仅做静态索引与展示。
