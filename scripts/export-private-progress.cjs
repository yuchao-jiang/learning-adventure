// Run locally in a git checkout. Output contains children's records: never commit it.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const ref = process.argv[2];
if (!ref || !/^[a-f0-9]{40}$/.test(ref)) {
 console.error('Usage: node scripts/export-private-progress.cjs <full pre-migration commit SHA>');
 process.exit(1);
}
const documents = ['emily', 'jason'].map(child => {
 const document = JSON.parse(execFileSync('git', ['show', ref + ':data/' + child + '.json'], { encoding: 'utf8' }));
 if (document?.version !== 1 || document.child !== child || !document.data || typeof document.data !== 'object' || Array.isArray(document.data)) throw Error('Invalid ' + child + ' backup');
 return { child, document };
});
const directory = path.resolve('.private-backup');
fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
const quote = value => "'" + value.replace(/'/g, "''") + "'";
const sql = documents.map(({ child, document }) =>
 'INSERT INTO progress (child, document, revision) VALUES (' + [child, JSON.stringify(document), randomUUID()].map(quote).join(', ') + ') ON CONFLICT(child) DO NOTHING;'
).join('\n');
// Exclusive creation avoids overwriting an earlier backup; inserts never replace private saves.
fs.writeFileSync(path.join(directory, 'progress-backup.json'), JSON.stringify(documents, null, 2), { flag: 'wx', mode: 0o600 });
fs.writeFileSync(path.join(directory, 'private-import.sql'), sql + '\n', { flag: 'wx', mode: 0o600 });
console.log('Private backup and D1 import created in .private-backup/. No answers printed.');
