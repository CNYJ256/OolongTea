import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths relative to project root
const rootDir = path.resolve(__dirname, '..');
const coursesPath = path.join(rootDir, 'wlc.courses.json');
const ratingsPath = path.join(rootDir, 'wlc.ratings.json');
const outputDir = path.join(rootDir, 'public', 'data');
const detailDir = path.join(outputDir, 'course-detail');

// Read and parse inputs
const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf-8'));
const ratings = JSON.parse(fs.readFileSync(ratingsPath, 'utf-8'));

// Build course lookup map: id -> course object
const courseMap = new Map();
for (const c of courses) {
  courseMap.set(c.id, c);
}

// --- Output 1: courses-index.min.json ---
// Fields: i=id, n=name, t=teacher, d=department, o=code, g=categories, r=ratingAvg, c=ratingCount
const indexData = courses.map(c => {
  const entry = {
    i: c.id,
    n: c.name,
    t: c.teacher,
    d: c.department,
    o: c.code,
    g: c.categories,
    r: c.rating ? c.rating.avg : 0,
    c: c.rating ? c.rating.count : 0
  };
  // Remove g if empty array to save space
  if (entry.g && entry.g.length === 0) {
    delete entry.g;
  }
  return entry;
});

// --- Output 2: course-detail/{bucket}.json ---
// Group courses into buckets by Math.floor(id / 1000)
// Each bucket file is an object keyed by course id string
const buckets = {};

// Initialize every course in its bucket (even courses with no reviews)
for (const c of courses) {
  const bucket = Math.floor(c.id / 1000);
  if (!buckets[bucket]) {
    buckets[bucket] = {};
  }
  buckets[bucket][String(c.id)] = {
    n: c.name,
    t: c.teacher,
    d: c.department,
    o: c.code,
    g: c.categories && c.categories.length > 0 ? c.categories : undefined,
    cr: c.credit,
    rv: []
  };
}

// Match reviews to courses
let matched = 0;
let orphaned = 0;

for (const r of ratings) {
  const courseId = r.course && r.course.id;
  if (courseMap.has(courseId)) {
    matched++;
    const bucket = Math.floor(courseId / 1000);
    const reviewEntry = {
      i: r.id,
      r: r.rating,
      c: r.comment,
      s: r.score,
      se: r.semester,
      a: r.reactions ? r.reactions.approves : 0,
      ca: r.created_at
    };
    buckets[bucket][String(courseId)].rv.push(reviewEntry);
  } else {
    orphaned++;
  }
}

// Clean up empty g fields in detail entries
for (const bucketKey of Object.keys(buckets)) {
  for (const courseId of Object.keys(buckets[bucketKey])) {
    const entry = buckets[bucketKey][courseId];
    if (entry.g === undefined) {
      delete entry.g;
    }
  }
}

// --- Output 3: filter-options.min.json ---
// Fields: g=unique sorted categories, d=unique sorted departments (excluding null)
const categorySet = new Set();
const departmentSet = new Set();

for (const c of courses) {
  if (c.categories) {
    for (const cat of c.categories) {
      categorySet.add(cat);
    }
  }
  if (c.department != null) {
    departmentSet.add(c.department);
  }
}

const filterOptions = {
  g: Array.from(categorySet).sort(),
  d: Array.from(departmentSet).sort()
};

// --- Write output files ---

// Ensure output directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(detailDir)) {
  fs.mkdirSync(detailDir, { recursive: true });
}

// Write courses-index.min.json
fs.writeFileSync(
  path.join(outputDir, 'courses-index.min.json'),
  JSON.stringify(indexData),
  'utf-8'
);

// Write bucket detail files
for (const [bucketKey, data] of Object.entries(buckets)) {
  fs.writeFileSync(
    path.join(detailDir, `${bucketKey}.json`),
    JSON.stringify(data),
    'utf-8'
  );
}

// Write filter-options.min.json
fs.writeFileSync(
  path.join(outputDir, 'filter-options.min.json'),
  JSON.stringify(filterOptions),
  'utf-8'
);

// --- Build summary ---
console.log('Build Summary');
console.log(`Courses:    ${courses.length}`);
console.log(`Reviews:    ${ratings.length}`);
console.log(`Matched:    ${matched}`);
console.log(`Orphaned:   ${orphaned}`);
