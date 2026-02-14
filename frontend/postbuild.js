// Post-build script to ensure files are copied for Vercel
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, 'dist');
const vercelOutput = path.join(__dirname, '..', '.vercel', 'output', 'static');

// Only run in Vercel environment
if (process.env.VERCEL && fs.existsSync(distPath)) {
  console.log('Vercel detected, checking output directory...');
  
  if (fs.existsSync(vercelOutput)) {
    console.log('Vercel output directory exists, files should be copied automatically');
  } else {
    console.log('Vercel output directory does not exist yet (this is normal during build)');
  }
}
