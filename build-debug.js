// Simple ES module script to debug build and deployment
console.log('====== BUILD DEBUG INFO ======');
console.log(`Node version: ${process.version}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`Is Vercel environment: ${process.env.VERCEL ? 'Yes' : 'No'}`);

// Check for specific environment variables
['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].forEach(envVar => {
  console.log(`${envVar}: ${process.env[envVar] ? 'Present' : 'Missing'}`);
});

// Check for important files
import fs from 'fs';
import path from 'path';

const checkFile = (filePath) => {
  const exists = fs.existsSync(filePath);
  console.log(`${filePath}: ${exists ? 'Exists' : 'Missing'}`);
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`  Size: ${stats.size} bytes`);
  }
};

// Check common configuration files
['package.json', 'vercel.json', '.env', '.env.production'].forEach(checkFile);

console.log('====== END DEBUG INFO ======'); 