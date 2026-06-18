#!/usr/bin/env node

/**
 * sync-yourtj.mjs — Sync YourTJ course + review data to public/data/yourtj/
 *
 * Zero external dependencies (Node.js built-ins only).
 *
 * Usage:
 *   node scripts/sync-yourtj.mjs
 *
 * Environment:
 *   YOURTJ_API_BASE — override API base (default https://jcourse.yourtj.de)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, rmSync, readdirSync, cpSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const API_BASE = process.env.YOURTJ_API_BASE || 'https://jcourse.yourtj.de'
const PUBLIC_DIR = join(ROOT, 'public', 'data', 'yourtj')
const TMP_DIR = join(ROOT, 'tmp', 'yourtj')
const SYNC_COUNT_FILE = join(PUBLIC_DIR, '.sync-count')
const DETAIL_DIR = 'yourtj-detail'

const REQUEST_DELAY_MS = 200
const REQUEST_TIMEOUT_MS = 15000
const MAX_PAGES = 1000
const MAX_DETAIL_FETCHES = 10000
const MAX_RETRIES = 3
const RETRY_BASE_MS = 1000

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args)
}

function warn(...args) {
  console.warn(`[${new Date().toISOString()}] WARN:`, ...args)
}

function error(...args) {
  console.error(`[${new Date().toISOString()}] ERROR:`, ...args)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex')
}

function roundRating(r) {
  return Math.round((r ?? 0) * 10) / 10
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function readJsonOrNull(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)
    return data
  } catch {
    return null
  }
}

function writeJsonAtomic(dir, fname, data) {
  ensureDir(dir)
  const tmpPath = join(dir, `.${fname}.tmp`)
  writeFileSync(tmpPath, JSON.stringify(data), 'utf-8')
  const finalPath = join(dir, fname)
  renameSync(tmpPath, finalPath)
}

// ── HTTP client (built-in https) ─────────────────────────────────────────────

/**
 * Perform an HTTPS GET and return parsed JSON.
 * Retries on 429 / 5xx with exponential backoff.
 */
function httpsGetJson(url, retries = MAX_RETRIES) {
  return new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      const req = https.get(
        url,
        { timeout: REQUEST_TIMEOUT_MS },
        (res) => {
          let body = ''
          res.on('data', (chunk) => {
            body += chunk
          })
          res.on('end', () => {
            // Retry on 429 or 5xx
            if ((res.statusCode === 429 || (res.statusCode >= 500 && res.statusCode <= 599)) && remaining > 0) {
              const delay = Math.min(RETRY_BASE_MS * Math.pow(2, MAX_RETRIES - remaining), 8000)
              warn(`HTTP ${res.statusCode} for ${url}, retrying in ${delay}ms (${remaining} retries left)`)
              setTimeout(() => attempt(remaining - 1), delay)
              return
            }
            if (res.statusCode < 200 || res.statusCode >= 300) {
              reject(new Error(`HTTP ${res.statusCode} for ${url}: ${body.slice(0, 500)}`))
              return
            }
            try {
              const json = JSON.parse(body)
              resolve({ data: json, rawBody: body })
            } catch (e) {
              reject(new Error(`JSON parse error for ${url}: ${e.message}`))
            }
          })
        }
      )

      req.on('error', (e) => {
        if (['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'].some((c) => e.message.includes(c)) && remaining > 0) {
          const delay = Math.min(RETRY_BASE_MS * Math.pow(2, MAX_RETRIES - remaining), 8000)
          warn(`Network error (${e.message}) for ${url}, retrying in ${delay}ms (${remaining} retries left)`)
          setTimeout(() => attempt(remaining - 1), delay)
          return
        }
        reject(e)
      })

      req.on('timeout', () => {
        req.destroy()
        if (remaining > 0) {
          const delay = Math.min(RETRY_BASE_MS * Math.pow(2, MAX_RETRIES - remaining), 8000)
          warn(`Timeout for ${url}, retrying in ${delay}ms (${remaining} retries left)`)
          setTimeout(() => attempt(remaining - 1), delay)
        } else {
          reject(new Error(`Timeout after all retries for ${url}`))
        }
      })
    }

    attempt(retries)
  })
}

// ── Paginated fetch ──────────────────────────────────────────────────────────

async function fetchAllCourses() {
  const courses = []
  let page = 1
  let consecutiveEmpty = 0

  while (page <= MAX_PAGES) {
    const url = `${API_BASE}/api/courses?page=${page}`
    log(`Fetching page ${page}...`)
    const { data: body } = await httpsGetJson(url)

    const items = body.data || body.courses || []
    if (!Array.isArray(items) || items.length === 0) {
      consecutiveEmpty++
      if (consecutiveEmpty >= 3) {
        error(`Consecutive empty pages (3). Stopping at page ${page}.`)
        break
      }
      if (body.hasMore === false) {
        log(`hasMore is false, stopping at page ${page}.`)
        break
      }
      if (body.totalPages && page >= body.totalPages) {
        log(`Reached totalPages=${body.totalPages}, stopping at page ${page}.`)
        break
      }
      page++
      await sleep(REQUEST_DELAY_MS)
      continue
    }

    consecutiveEmpty = 0
    const seenIds = new Set(courses.map((c) => c.id))
    let duplicates = 0
    for (const item of items) {
      if (seenIds.has(item.id)) {
        duplicates++
        continue
      }
      seenIds.add(item.id)
      courses.push(item)
    }

    if (duplicates > 0) {
      warn(`Page ${page}: ${duplicates} duplicate(s) ignored.`)
    }

    log(`Page ${page}: got ${items.length} items (total so far: ${courses.length})`)

    if (body.hasMore === false) {
      log(`hasMore is false, stopping at page ${page}.`)
      break
    }
    if (body.totalPages && page >= body.totalPages) {
      log(`Reached totalPages=${body.totalPages}, stopping at page ${page}.`)
      break
    }

    page++
    await sleep(REQUEST_DELAY_MS)
  }

  return courses
}

// ── Index building ───────────────────────────────────────────────────────────

function buildIndex(courses, existingIndex) {
  const existingMap = new Map()
  if (existingIndex && Array.isArray(existingIndex)) {
    for (const c of existingIndex) {
      existingMap.set(c.i, c)
    }
  }

  const index = courses.map((c) => ({
    i: c.id,
    o: c.code ?? '',
    n: c.name ?? '',
    t: c.teacher_name ?? '',
    d: c.department ?? '',
    cr: c.credit ?? 0,
    r: roundRating(c.rating),
    c: c.review_count ?? 0,
  }))

  // Build filter options
  const departments = [...new Set(courses.map((c) => c.department).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'zh-CN')
  )

  return { index, departments, existingMap }
}

// ── Incremental check ────────────────────────────────────────────────────────

function needsDetailRefresh(course, existingMap, existingDetailMap, syncCount) {
  // New course
  if (!existingMap.has(course.id)) return true

  // No detail data
  const bucket = Math.floor(course.id / 1000)
  if (!existingDetailMap[bucket] || !existingDetailMap[bucket][course.id]) return true

  // Rotation refresh: ~25% each run
  if (course.id % 4 === (syncCount % 4)) return true

  const oldIndex = existingMap.get(course.id)

  // review_count changed
  if ((oldIndex.c ?? 0) !== (course.review_count ?? 0)) return true

  // review_avg changed
  if (roundRating(oldIndex.r) !== roundRating(course.rating)) return true

  // Basic field changes
  if ((oldIndex.n ?? '') !== (course.name ?? '')) return true
  if ((oldIndex.o ?? '') !== (course.code ?? '')) return true
  if ((oldIndex.t ?? '') !== (course.teacher_name ?? '')) return true
  if ((oldIndex.d ?? '') !== (course.department ?? '')) return true
  if ((oldIndex.cr ?? 0) !== (course.credit ?? 0)) return true

  return false
}

// ── Detail fetching ──────────────────────────────────────────────────────────

async function fetchCourseDetails(courses, existingMap, existingDetailMap, syncCount, isFullRefresh) {
  const { syncedAt } = getSyncMeta()

  // Determine which courses need detail refresh
  const toFetch = []
  for (const course of courses) {
    if (isFullRefresh || needsDetailRefresh(course, existingMap, existingDetailMap, syncCount)) {
      toFetch.push(course)
    }
  }

  // Cap at MAX_DETAIL_FETCHES
  const capped = toFetch.slice(0, MAX_DETAIL_FETCHES)
  if (toFetch.length > MAX_DETAIL_FETCHES) {
    warn(`Detail fetches capped: ${toFetch.length} → ${MAX_DETAIL_FETCHES}. ${toFetch.length - MAX_DETAIL_FETCHES} courses skipped this run.`)
  }

  log(`Fetching details for ${capped.length} courses (${isFullRefresh ? 'full refresh' : 'incremental'}), syncCount=${syncCount}`)

  // Prepare detail buckets — start from existing (if any)
  const detailMap = {}
  for (const key of Object.keys(existingDetailMap)) {
    detailMap[key] = { ...existingDetailMap[key] }
  }

  let fetched = 0
  let failed = 0

  for (const course of capped) {
    try {
      const url = `${API_BASE}/api/course/${course.id}`
      const { data: detailData, rawBody } = await httpsGetJson(url)

      const sourceHash = sha256(rawBody).slice(0, 16)

      const courseData = {
        n: detailData.name ?? course.name ?? '',
        o: detailData.code ?? course.code ?? '',
        t: detailData.teacher_name ?? course.teacher_name ?? '',
        d: detailData.department ?? course.department ?? '',
        cr: detailData.credit ?? course.credit ?? 0,
        se: detailData.semesters ?? [],
        _synced_at: syncedAt,
        _source_hash: sourceHash,
        rv: (detailData.reviews ?? []).map((rv) => ({
          i: rv.id,
          r: rv.rating ?? 0,
          se: rv.semester ?? '',
          c: rv.comment ?? '',
          a: rv.approve_count ?? 0,
          ca: rv.created_at ?? 0,
        })),
      }

      const bucket = Math.floor(course.id / 1000)
      const bucketKey = String(bucket)
      if (!detailMap[bucketKey]) {
        detailMap[bucketKey] = {}
      }
      detailMap[bucketKey][course.id] = courseData

      fetched++
      if (fetched % 100 === 0) {
        log(`Detail progress: ${fetched}/${capped.length}`)
      }

      await sleep(REQUEST_DELAY_MS)
    } catch (e) {
      warn(`Failed to fetch detail for course ${course.id}: ${e.message}`)
      failed++
    }
  }

  log(`Detail fetching complete: ${fetched} succeeded, ${failed} failed, ${toFetch.length - capped.length} skipped (cap)`)
  return detailMap
}

// ── Sync count tracking ──────────────────────────────────────────────────────

function getSyncMeta() {
  const syncedAt = Math.floor(Date.now() / 1000)
  let syncCount = 1

  const raw = readJsonOrNull(SYNC_COUNT_FILE)
  if (raw && typeof raw.count === 'number') {
    syncCount = raw.count + 1
  }

  return { syncCount, syncedAt }
}

function writeSyncMeta(syncCount) {
  ensureDir(dirname(SYNC_COUNT_FILE))
  writeFileSync(SYNC_COUNT_FILE, JSON.stringify({ count: syncCount, updated_at: Math.floor(Date.now() / 1000) }), 'utf-8')
}

// ── Output writing (atomic) ──────────────────────────────────────────────────

function writeOutput(index, departments, detailMap) {
  ensureDir(TMP_DIR)
  ensureDir(join(TMP_DIR, DETAIL_DIR))

  // Write index
  writeFileSync(join(TMP_DIR, 'yourtj-index.min.json'), JSON.stringify(index), 'utf-8')

  // Write filter options
  const filterOpts = { d: departments }
  writeFileSync(join(TMP_DIR, 'yourtj-filter-options.min.json'), JSON.stringify(filterOpts), 'utf-8')

  // Write detail buckets
  for (const [bucket, data] of Object.entries(detailMap)) {
    const bucketPath = join(TMP_DIR, DETAIL_DIR, `${bucket}.json`)
    writeFileSync(bucketPath, JSON.stringify(data), 'utf-8')
  }

  // Validate
  const tmpIndex = readJsonOrNull(join(TMP_DIR, 'yourtj-index.min.json'))
  if (!tmpIndex || !Array.isArray(tmpIndex) || tmpIndex.length === 0) {
    throw new Error('Validation failed: yourtj-index.min.json is empty or not parseable')
  }

  // Count total detail entries
  let totalDetailEntries = 0
  const detailDir = join(TMP_DIR, DETAIL_DIR)
  if (existsSync(detailDir)) {
    for (const f of readdirSync(detailDir)) {
      if (f.endsWith('.json')) {
        const bucketData = readJsonOrNull(join(detailDir, f))
        if (!bucketData || typeof bucketData !== 'object') {
          throw new Error(`Validation failed: bucket file ${f} is not parseable`)
        }
        totalDetailEntries += Object.keys(bucketData).length
      }
    }
  }

  // Validate: must have at least some detail entries (cap may limit first runs)
  if (totalDetailEntries === 0) {
    throw new Error('Validation failed: no detail entries written')
  }
  // If not capped (total detail entries close to index), require 90% coverage
  const coverage = totalDetailEntries / index.length
  if (coverage >= 0.85 && totalDetailEntries < Math.floor(index.length * 0.9)) {
    throw new Error(
      `Validation failed: only ${totalDetailEntries} detail entries for ${index.length} index entries (need >= ${Math.floor(index.length * 0.9)})`
    )
  }

  log(`Validation OK: ${index.length} index entries, ${totalDetailEntries} detail entries across ${Object.keys(detailMap).length} buckets`)

  // Atomic swap: delete old public/data/yourtj/ → copy tmp → remove tmp
  if (existsSync(PUBLIC_DIR)) {
    rmSync(PUBLIC_DIR, { recursive: true, force: true })
  }
  ensureDir(dirname(PUBLIC_DIR))
  cpSync(TMP_DIR, PUBLIC_DIR, { recursive: true, force: true })
  rmSync(TMP_DIR, { recursive: true, force: true })

  log(`Published to ${PUBLIC_DIR}`)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('=== Starting YourTJ sync ===')

  const { syncCount, syncedAt } = getSyncMeta()
  const isFullRefresh = syncCount % 4 === 0
  log(`syncCount=${syncCount}, isFullRefresh=${isFullRefresh}, syncedAt=${syncedAt}`)

  // 1. Fetch all courses (paginated)
  log('Step 1: Fetching course index...')
  const courses = await fetchAllCourses()
  log(`Fetched ${courses.length} courses total`)

  if (courses.length === 0) {
    error('No courses fetched. Exiting.')
    process.exit(1)
  }

  // 2. Load existing data for incremental comparison
  const existingIndex = readJsonOrNull(join(PUBLIC_DIR, 'yourtj-index.min.json'))
  const existingDetailMap = {}

  const existingDetailDir = join(PUBLIC_DIR, DETAIL_DIR)
  if (existsSync(existingDetailDir)) {
    for (const f of readdirSync(existingDetailDir)) {
      if (f.endsWith('.json')) {
        const bucketData = readJsonOrNull(join(existingDetailDir, f))
        if (bucketData) {
          const bucket = f.replace('.json', '')
          existingDetailMap[bucket] = bucketData
        }
      }
    }
  }

  // 3. Build index
  log('Step 2: Building index...')
  const { index, departments, existingMap } = buildIndex(courses, existingIndex)
  log(`Index: ${index.length} courses, ${departments.length} departments`)

  // 4. Fetch details (incremental or full)
  log('Step 3: Fetching course details...')
  const detailMap = await fetchCourseDetails(courses, existingMap, existingDetailMap, syncCount, isFullRefresh)

  // 5. Write output
  log('Step 4: Writing output...')
  writeOutput(index, departments, detailMap)

  // 6. Update sync count
  writeSyncMeta(syncCount)

  log('=== YourTJ sync complete ===')
}

main().catch((e) => {
  error(e)
  process.exit(1)
})
