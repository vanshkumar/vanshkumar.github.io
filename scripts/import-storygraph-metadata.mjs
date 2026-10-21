// Apply an audited, local snapshot once. This script never contacts StoryGraph,
// creates books, changes completion history, or replaces locally edited metadata.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import matter from 'gray-matter';

const [snapshotPath, flag] = process.argv.slice(2);
if (!snapshotPath || (flag && flag !== '--apply')) throw new Error('Usage: node scripts/import-storygraph-metadata.mjs <snapshot.json> [--apply]');
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
const fields = new Set(['pageCount','publicationYear','bookType','genres','moods','pace']);
// The archive preserves the original import, including fields since retired.
const retiredFields = new Set(['audioMinutes','language','series','format']);
const seen = new Set();
const updates = [];
for (const record of snapshot.records) {
  if (!/^[a-z0-9-]+$/.test(record.slug) || seen.has(record.slug)) throw new Error(`Invalid or repeated slug: ${record.slug}`);
  seen.add(record.slug);
  const path = resolve('vault/reading-log', `${record.slug}.md`);
  const original = await readFile(path,'utf8');
  const {data,content} = matter(original);
  if (data.title !== record.title || JSON.stringify(data.authors) !== JSON.stringify(record.authors) || data.isbn !== record.isbn)
    throw new Error(`Identity changed since snapshot: ${record.slug}. Review manually.`);
  if (data.finished === undefined) throw new Error(`Not a completed local book: ${record.slug}`);
  const added=[];
  for (const [key,value] of Object.entries(record.metadata)) {
    if (retiredFields.has(key)) continue;
    if (!fields.has(key)) throw new Error(`Unexpected metadata field: ${key}`);
    if (data[key] === undefined) { data[key]=value;added.push(key); }
  }
  if (!added.length) continue;
  const sources=record.sources.map(source=>({...source,fields:source.fields.filter(field=>added.includes(field))})).filter(source=>source.fields.length);
  data.metadataSources=[...(data.metadataSources??[]),...sources];
  let output=matter.stringify(content,data);
  for (const key of ['isbn','amazonAsin']) {
    if (typeof data[key] === 'string') output=output.replace(new RegExp(`^${key}:.*$`,'m'),`${key}: ${JSON.stringify(data[key])}`);
  }
  updates.push({path,output:output.replace(/\n+$/, '\n'),slug:record.slug,added});
}
// Validate all identities before writing any file.
if (flag === '--apply') for (const {path,output} of updates) await writeFile(path,output);
console.log(`${flag==='--apply'?'Updated':'Would update'} ${updates.length} existing books; reading history unchanged.`);
