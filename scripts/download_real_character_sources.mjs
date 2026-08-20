import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const projectRoot = new URL('..', import.meta.url).pathname;
const manifestPath = resolve(projectRoot, 'training/real_character_dataset/source_manifest.json');
const outputRoot = process.argv[2] || '/home/ubuntu/real-character-assets/raw';
const publicRoot = 'https://oldocrlab-ctxmyw2q.manus.space/manus-storage';
const assetKeys = {
  'zyryanskaya-trinity-inscription': 'zyryanskaya-trinity-inscription-preview_2e47a56f.jpg',
  'abur-komi-inscription': 'abur-komi-inscription_5efc4f26.jpg',
  'egor-326-figures-1-2': 'egor326_fig1-2_6e2f6539.png',
  'likh-360-f274-figure-3': 'likh360_f274_fig3_5c8088ee.png',
  'likh-360-f5v-6-figure-5': 'likh360_f5v6_fig5_6c1b7efd.png',
  'likh-360-f66v-figure-6': 'likh360_f66v_fig6_cf2f0d3f.png',
  'likh-360-f213-figure-7': 'likh360_f213_fig7_385977d8.png',
  'likh-360-f215-figure-8': 'likh360_f215_fig8_57be05d0.png',
  'likh-360-f217v-figure-9': 'likh360_f217v_fig9_124bf968.png',
  'volok-9-11-figures-10-11': 'volok9f285v_volok11f271v_fig10-11_b23a3566.png',
  'volok-11-f268-figure-12': 'volok11f268_fig12_5b631f2b.png',
  'volok-11-f268v-figure-13': 'volok11f268v_fig13_b819261f.png',
  'uvar-264-figure-14': 'uvar264_fig14_8a50ee0b.png',
};

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
await mkdir(outputRoot, { recursive: true });
const report = [];

for (const source of manifest.sources) {
  const key = assetKeys[source.id];
  if (!key) throw new Error(`Missing hosted key for ${source.id}`);
  const response = await fetch(`${publicRoot}/${key}`);
  if (!response.ok) throw new Error(`Download failed for ${source.id}: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const destination = resolve(outputRoot, source.file || basename(key));
  await writeFile(destination, bytes);
  report.push({ id: source.id, file: destination, bytes: bytes.byteLength, tier: source.tier });
}

await writeFile(resolve(outputRoot, 'download_report.json'), JSON.stringify({ downloadedAt: new Date().toISOString(), report }, null, 2));
console.log(JSON.stringify(report, null, 2));
