// Redeploys the model to the local SQLite file without losing the rows already in it.
// `cds deploy` recreates the tables from the seed CSVs, so the old file is kept as a backup
// and every table that still exists is copied back (common columns only), replacing seed rows.
const { execFileSync } = require('node:child_process')
const { DatabaseSync } = require('node:sqlite')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const file = path.resolve(root, process.argv[2] || 'db.sqlite')
const backup = `${file}.bak`

const quote = (name) => `"${name.replace(/"/g, '""')}"`
const tables = (db) =>
  db
    .prepare("select name from sqlite_master where type = 'table'")
    .all()
    .map((t) => t.name)
const columns = (db, table) =>
  db
    .prepare(`pragma table_info(${quote(table)})`)
    .all()
    .map((c) => c.name)

if (!fs.existsSync(file)) {
  console.log(`${file} does not exist yet, deploying a fresh database.`)
  execFileSync('npx', ['cds', 'deploy', '--to', `sqlite:${file}`], { cwd: root, stdio: 'inherit' })
  process.exit(0)
}

fs.copyFileSync(file, backup)
fs.rmSync(`${file}-wal`, { force: true })
fs.rmSync(`${file}-shm`, { force: true })
execFileSync('npx', ['cds', 'deploy', '--to', `sqlite:${file}`], { cwd: root, stdio: 'inherit' })

const db = new DatabaseSync(file)
db.exec(`attach database '${backup.replace(/'/g, "''")}' as old`)
db.exec('pragma foreign_keys = off')
const oldTables = new Set(
  db
    .prepare("select name from old.sqlite_master where type = 'table'")
    .all()
    .map((t) => t.name)
)

for (const table of tables(db)) {
  if (!oldTables.has(table) || table === 'cds_model') continue
  const oldCols = new Set(
    db
      .prepare(`pragma old.table_info(${quote(table)})`)
      .all()
      .map((c) => c.name)
  )
  const common = columns(db, table)
    .filter((c) => oldCols.has(c))
    .map(quote)
    .join(', ')
  if (!common) continue
  const { changes } = db
    .prepare(
      `insert or replace into main.${quote(table)} (${common}) select ${common} from old.${quote(table)}`
    )
    .run()
  if (changes) console.log(`restored ${changes} row(s) in ${table}`)
}
db.close()
console.log(`Done. The previous database is kept as ${path.basename(backup)}.`)
