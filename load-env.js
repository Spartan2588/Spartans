/**
 * Load environment variables from .env.local file
 * This is a simple loader for development
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envPath = join(__dirname, '.env.local');
  const envFile = readFileSync(envPath, 'utf-8');
  
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
          console.log(`[Env] Loaded ${key} from .env.local`);
        }
      }
    }
  });
} catch (error) {
  // .env.local file doesn't exist or can't be read - that's okay
  // Environment variables can be set manually
}
