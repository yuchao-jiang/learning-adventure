const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
test('private export keeps Unicode records, hides answers from logs, and never replaces imports', () => {
 const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'adventure-migration-'));
 try {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  git('init', '-q');fs.mkdirSync(path.join(cwd, 'data'));
  for (const child of ['emily', 'jason']) fs.writeFileSync(path.join(cwd, 'data', child + '.json'), JSON.stringify({ version: 1, child, data: { raw: "🌻 A plant's leaf" } }));
  git('add', 'data');git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Fixture');
  const script = path.join(__dirname, '../scripts/export-private-progress.cjs');
  const ref = git('rev-parse', 'HEAD');
  const stdout = execFileSync(process.execPath, [script, ref], { cwd, encoding: 'utf8' });
  assert.doesNotMatch(stdout, /plant|leaf/);
  const backup = path.join(cwd, '.private-backup/progress-backup.json');
  assert.equal(fs.statSync(backup).mode & 0o777, 0o600);
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(fs.readFileSync(path.join(__dirname, '../cloudflare/schema.sql'), 'utf8'));
  const sql = fs.readFileSync(path.join(cwd, '.private-backup/private-import.sql'), 'utf8');
  sqlite.exec(sql);
  assert.equal(sqlite.prepare('SELECT count(*) n FROM progress').get().n, 2);
  assert.equal(JSON.parse(sqlite.prepare('SELECT document FROM progress WHERE child = ?').get('emily').document).data.raw, "🌻 A plant's leaf");
  sqlite.prepare('UPDATE progress SET revision = ? WHERE child = ?').run('newer', 'emily');
  sqlite.exec(sql);
  assert.equal(sqlite.prepare('SELECT revision FROM progress WHERE child = ?').get('emily').revision, 'newer');
  assert.throws(() => execFileSync(process.execPath, [script, ref], { cwd, stdio: 'pipe' }));
 } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
