import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the minimal app
const child = spawn('node', [join(__dirname, 'src', 'app-minimal.js')], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  child.kill();
  process.exit();
});

console.log('Backend server starting...');