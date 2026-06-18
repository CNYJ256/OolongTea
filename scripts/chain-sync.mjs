// Run sync repeatedly until coverage is sufficient.
import { execSync } from 'child_process'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const DETAIL_DIR = 'public/data/yourtj/yourtj-detail'

function getDetailCount() {
  if (!existsSync(DETAIL_DIR)) return 0
  let n = 0
  for (const f of readdirSync(DETAIL_DIR)) {
    if (f.endsWith('.json')) {
      n += Object.keys(JSON.parse(readFileSync(join(DETAIL_DIR, f), 'utf8'))).length
    }
  }
  return n
}

async function main() {
  const TARGET = 9000
  const MAX_ROUNDS = 6

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const before = getDetailCount()
    console.log(`\n=== Round ${round} (current details: ${before}) ===`)

    execSync('node scripts/sync-yourtj.mjs', { stdio: 'inherit' })

    const after = getDetailCount()
    console.log(`After round ${round}: ${after} details (Δ${after - before})`)

    if (after >= TARGET) {
      console.log(`Target ${TARGET} reached. Done.`)
      return
    }
  }

  console.log(`Max rounds reached. Final count: ${getDetailCount()}`)
}

main().catch(e => { console.error(e); process.exit(1) })
