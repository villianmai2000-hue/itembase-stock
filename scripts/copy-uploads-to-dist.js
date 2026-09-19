import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', 'server', 'uploads');
const targetDir = path.join(__dirname, '..', 'dist', 'uploads');

if (fs.existsSync(sourceDir)) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const files = fs.readdirSync(sourceDir);
  let count = 0;
  for (const file of files) {
    const srcFile = path.join(sourceDir, file);
    const destFile = path.join(targetDir, file);
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, destFile);
      count++;
    }
  }
  console.log(`✅ [Build] Copied ${count} upload files to dist/uploads for static CDN hosting.`);
} else {
  console.log('ℹ️ [Build] No server/uploads directory found to copy.');
}


