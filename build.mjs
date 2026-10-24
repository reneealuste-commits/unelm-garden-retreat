import fs from 'node:fs';
import path from 'node:path';

for (const bfile of ['bundle_code.json', 'bundle_assets.json']) {
  const bpath = path.join(process.cwd(), bfile);
  if (!fs.existsSync(bpath)) continue;
  const entries = JSON.parse(fs.readFileSync(bpath, 'utf8'));
  for (const [relPath, info] of Object.entries(entries)) {
    const outPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    if (info.enc === 'base64') {
      fs.writeFileSync(outPath, Buffer.from(info.data, 'base64'));
    } else {
      fs.writeFileSync(outPath, info.data, 'utf8');
    }
  }
  fs.unlinkSync(bpath);
  console.log('Unpacked and removed', bfile);
}
