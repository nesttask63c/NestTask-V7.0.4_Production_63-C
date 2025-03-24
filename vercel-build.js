import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Create __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// First run the debug script to check environment
try {
  console.log('Running build debug script...');
  execSync('node build-debug.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running debug script:', error);
  // Continue with build even if debug script fails
}

// Log build environment info
console.log('== Build Environment Info ==');
console.log(`Node version: ${process.version}`);
console.log(`PWD: ${process.cwd()}`);
console.log(`VERCEL: ${process.env.VERCEL || 'Not set'}`);
console.log('== Environment Variables ==');
console.log(`VITE_SUPABASE_URL set: ${process.env.VITE_SUPABASE_URL ? 'Yes' : 'No'}`);
console.log(`VITE_SUPABASE_ANON_KEY set: ${process.env.VITE_SUPABASE_ANON_KEY ? 'Yes' : 'No'}`);

// Copy production env file
try {
  if (fs.existsSync('.env.production')) {
    const envProdContent = fs.readFileSync('.env.production', 'utf8');
    fs.writeFileSync('.env', envProdContent);
    console.log('Successfully copied .env.production to .env');
  } else {
    console.warn('.env.production file not found');
  }
} catch (error) {
  console.error('Error copying .env.production:', error);
}

// Run build
try {
  console.log('Starting build process...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

// Copy _headers file to dist if it exists
if (fs.existsSync('_headers')) {
  try {
    fs.copyFileSync('_headers', path.join('dist', '_headers'));
    console.log('Successfully copied _headers to dist directory');
  } catch (error) {
    console.error('Error copying _headers file:', error);
  }
}

// Check dist directory
try {
  const distFiles = fs.readdirSync('dist');
  console.log('== Dist Directory Contents ==');
  console.log(distFiles);
  
  // Check if index.html exists
  if (distFiles.includes('index.html')) {
    console.log('index.html found in dist directory');
    const indexContent = fs.readFileSync(path.join('dist', 'index.html'), 'utf8');
    console.log(`index.html size: ${indexContent.length} bytes`);
  } else {
    console.error('index.html NOT FOUND in dist directory!');
  }
} catch (error) {
  console.error('Error checking dist directory:', error);
} 