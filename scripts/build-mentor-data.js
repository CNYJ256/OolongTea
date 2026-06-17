import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const xlsxPath = path.join(rootDir, '2024导师评价数据V2.0.xlsx');
const outputDir = path.join(rootDir, 'public', 'data');
const detailDir = path.join(outputDir, 'mentor-detail');

// Sheet names and their department column mappings
const sheets = [
  { name: '导师评价_1', deptKey: '学院' },
  { name: '导师评价_0', deptKey: '专业' },
];

// Read workbook
const workbook = XLSX.readFile(xlsxPath);

// --- Step 1: Parse all rows from both sheets into unified structure ---
const allRows = [];

for (const sheet of sheets) {
  const worksheet = workbook.Sheets[sheet.name];
  if (!worksheet) {
    console.warn(`Warning: Sheet "${sheet.name}" not found, skipping.`);
    continue;
  }

  // Convert to array of arrays (header row + data rows)
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (data.length < 2) {
    console.warn(`Warning: Sheet "${sheet.name}" has insufficient rows, skipping.`);
    continue;
  }

  // Headers are in the first row
  const headers = data[0];
  const schoolIdx = headers.indexOf('学校');
  const deptIdx = headers.indexOf(sheet.deptKey);
  const nameIdx = headers.indexOf('姓名');
  const ratingIdx = headers.indexOf('评分');
  const commentIdx = headers.indexOf('评价');

  if (schoolIdx === -1 || nameIdx === -1 || ratingIdx === -1) {
    console.warn(`Warning: Sheet "${sheet.name}" missing required columns, skipping.`);
    continue;
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = row[nameIdx];
    const rating = row[ratingIdx];
    const school = row[schoolIdx];
    const department = deptIdx !== -1 ? row[deptIdx] : '';
    const comment = commentIdx !== -1 ? row[commentIdx] : '';

    // Skip rows with empty/whitespace-only names
    if (!name || String(name).trim() === '') continue;

    // Skip rows with missing or invalid ratings
    const parsedRating = parseFloat(rating);
    if (isNaN(parsedRating)) continue;

    allRows.push({
      school: String(school || '').trim(),
      department: String(department || '').trim(),
      name: String(name).trim(),
      rating: parsedRating,
      comment: String(comment || ''),
    });
  }
}

// --- Step 2: Group by school + name ---
const mentorMap = new Map();

for (const row of allRows) {
  const key = `${row.school}::${row.name}`;

  if (!mentorMap.has(key)) {
    mentorMap.set(key, {
      school: row.school,
      department: row.department,
      name: row.name,
      ratings: [],
      comments: [],
    });
  }

  const mentor = mentorMap.get(key);
  mentor.ratings.push(row.rating);
  mentor.comments.push(row.comment);

  // Update department if current row has a non-empty department and
  // the stored one is empty (take first non-empty department encountered)
  if (row.department && !mentor.department) {
    mentor.department = row.department;
  }
}

// --- Step 3: Assign IDs and build output structures ---
const indexData = [];
const buckets = {};
const schoolSet = new Set();
const departmentSet = new Set();

let idCounter = 1;

for (const [, mentor] of mentorMap) {
  const id = idCounter++;
  const ratingAvg = mentor.ratings.reduce((a, b) => a + b, 0) / mentor.ratings.length;
  const ratingCount = mentor.ratings.length;

  // Build index entry
  indexData.push({
    i: id,
    n: mentor.name,
    s: mentor.school,
    d: mentor.department,
    r: Math.round(ratingAvg * 10) / 10, // Round to 1 decimal
    c: ratingCount,
  });

  // Build detail entry
  const bucket = Math.floor(id / 1000);
  if (!buckets[bucket]) {
    buckets[bucket] = {};
  }

  buckets[bucket][String(id)] = {
    n: mentor.name,
    s: mentor.school,
    d: mentor.department,
    rv: mentor.ratings.map((r, idx) => ({
      r: r,
      c: mentor.comments[idx],
    })),
  };

  // Collect filter options
  if (mentor.school) {
    schoolSet.add(mentor.school);
  }
  if (mentor.department) {
    departmentSet.add(mentor.department);
  }
}

// --- Step 4: Write output files ---

// Ensure output directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(detailDir)) {
  fs.mkdirSync(detailDir, { recursive: true });
}

// Write mentor-index.min.json
fs.writeFileSync(
  path.join(outputDir, 'mentor-index.min.json'),
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

// Write mentor-filter-options.min.json
const filterOptions = {
  s: Array.from(schoolSet).sort(),
  d: Array.from(departmentSet).sort(),
};

fs.writeFileSync(
  path.join(outputDir, 'mentor-filter-options.min.json'),
  JSON.stringify(filterOptions),
  'utf-8'
);

// --- Step 5: Print summary ---
console.log('Mentor Build Summary');
console.log(`Total rows processed: ${allRows.length}`);
console.log(`Unique mentors:       ${mentorMap.size}`);
console.log(`Bucket files:         ${Object.keys(buckets).length}`);
console.log(`Schools:              ${schoolSet.size}`);
console.log(`Departments:          ${departmentSet.size}`);
