/**
 * Keep the development/admin server available on this computer's private
 * Tailscale address. The child is restarted if Vite exits unexpectedly.
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const tailscaleCandidates = [
  process.env.TAILSCALE_CLI,
  'C:\\Program Files\\Tailscale\\tailscale.exe',
  'C:\\Program Files (x86)\\Tailscale IPN\\tailscale.exe',
].filter(Boolean);

const tailscale = tailscaleCandidates.find((candidate) => existsSync(candidate));
if (!tailscale) {
  console.error('Tailscale was not found. Install it, sign in, then run `npm run remote` again.');
  process.exit(1);
}

function tailscaleIp() {
  try {
    const output = execFileSync(tailscale, ['ip', '-4'], { encoding: 'utf8', windowsHide: true }).trim();
    const ip = output.split(/\s+/).find((value) => /^100\./.test(value));
    if (!ip) throw new Error('no private IPv4 address returned');
    return ip;
  } catch (error) {
    console.error(`Could not read the Tailscale address: ${error.message}`);
    console.error('Open Tailscale, make sure it is connected, and try again.');
    process.exit(1);
  }
}

const tailscaleAddress = tailscaleIp();
// Tailscale Serve is the only network-facing entry point. Keeping Vite on
// loopback avoids exposing the write-capable admin API to the local Wi-Fi LAN.
const host = process.env.PORTFOLIO_HOST || '127.0.0.1';
const port = process.env.PORT || '5173';
const vite = resolve(process.cwd(), 'node_modules/vite/bin/vite.js');
let child;
let stopping = false;

function start() {
  console.log(`\nPortfolio admin backend: http://${host}:${port}/#/admin`);
  console.log(`Tailscale connected as ${tailscaleAddress}; use the private HTTPS Serve URL on your phone.\n`);
  child = spawn(process.execPath, [vite, '--host', host, '--port', port], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: port },
    stdio: 'inherit',
    windowsHide: true,
  });

  child.once('exit', (code) => {
    if (stopping) process.exit(code ?? 0);
    console.error(`Admin server stopped (${code ?? 'unknown'}). Restarting in 3 seconds…`);
    setTimeout(start, 3000);
  });
}

function stop() {
  stopping = true;
  if (child && !child.killed) child.kill();
  else process.exit(0);
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
start();
