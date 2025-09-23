#!/usr/bin/env node

/**
 * Quiz Quest Development Servers Launcher
 * 
 * This script starts both the API server (TypeScript) and client server (React/Vite)
 * concurrently with proper signal handling for clean shutdown.
 * 
 * Usage: npm run dev:servers
 * 
 * Features:
 * - Starts API server on port 3000 (api-ts)
 * - Starts client dev server on port 5173 (client)
 * - Proper process cleanup on Ctrl+C
 * - Color-coded output [API] and [CLIENT]
 * - Graceful shutdown with timeout protection
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Quiz Quest Development Servers...');
console.log('📡 API Server: http://localhost:3000');
console.log('🌐 Client Server: http://localhost:5173');
console.log('');

// Track process state
let apiClosed = false;
let clientClosed = false;

// Start API server
const apiProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'api-ts'),
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

// Start client server
const clientProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

// Handle API output
apiProcess.stdout.on('data', (data) => {
  console.log(`[API] ${data.toString().trim()}`);
});

apiProcess.stderr.on('data', (data) => {
  console.error(`[API ERROR] ${data.toString().trim()}`);
});

// Handle Client output
clientProcess.stdout.on('data', (data) => {
  console.log(`[CLIENT] ${data.toString().trim()}`);
});

clientProcess.stderr.on('data', (data) => {
  console.error(`[CLIENT ERROR] ${data.toString().trim()}`);
});

// Handle process termination
function cleanup() {
  console.log('\n🛑 Shutting down servers...');

  // Try graceful shutdown first
  console.log('Sending SIGTERM...');
  apiProcess.kill('SIGTERM');
  clientProcess.kill('SIGTERM');

  // Check if processes are still alive after 3 seconds
  setTimeout(() => {
    if (!apiClosed && !apiProcess.killed) {
      console.log('Force killing API process...');
      apiProcess.kill('SIGKILL');
    }
    if (!clientClosed && !clientProcess.killed) {
      console.log('Force killing client process...');
      clientProcess.kill('SIGKILL');
    }
  }, 3000);

  // Final force exit after 5 seconds
  setTimeout(() => {
    console.log('Force exit after timeout');
    process.exit(0);
  }, 5000);
}

// Handle Ctrl+C
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Handle process exits
apiProcess.on('exit', (code) => {
  console.log(`[API] Process exited with code ${code}`);
  apiClosed = true;
  if (code !== 0) {
    cleanup();
  }
});

clientProcess.on('exit', (code) => {
  console.log(`[CLIENT] Process exited with code ${code}`);
  clientClosed = true;
  if (code !== 0) {
    cleanup();
  }
});

console.log('✅ Development servers are starting...');
console.log('💡 Press Ctrl+C to stop both servers');
console.log('📋 API logs prefixed with [API], Client logs with [CLIENT]');
console.log('');