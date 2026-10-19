/** Keep the portfolio on one explicit Tailscale Serve HTTPS port. */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const LOCAL_PORT = Number(process.env.PORT || 5173);
export const HTTPS_PORT = Number(process.env.TAILSCALE_HTTPS_PORT || 8445);

const candidates = [
  process.env.TAILSCALE_CLI,
  'C:\\Program Files\\Tailscale\\tailscale.exe',
  'C:\\Program Files (x86)\\Tailscale IPN\\tailscale.exe',
].filter(Boolean);

export function findTailscale() {
  const executable = candidates.find((candidate) => existsSync(candidate));
  if (!executable) throw new Error('Tailscale CLI was not found');
  return executable;
}

function run(executable, args) {
  return execFileSync(executable, args, { encoding: 'utf8', windowsHide: true }).trim();
}

export function inspectRemote() {
  const executable = findTailscale();
  const status = JSON.parse(run(executable, ['status', '--json']));
  const dnsName = String(status?.Self?.DNSName || '').replace(/\.$/, '');
  if (!dnsName) throw new Error('Tailscale MagicDNS name is unavailable');

  const serveStatus = run(executable, ['serve', 'status']);
  const origin = `https://${dnsName}:${HTTPS_PORT}`;
  const target = `http://127.0.0.1:${LOCAL_PORT}`;
  const configured = serveStatus.includes(origin) && serveStatus.includes(target);

  return {
    configured,
    httpsPort: HTTPS_PORT,
    localPort: LOCAL_PORT,
    origin,
    adminUrl: `${origin}/#/admin`,
  };
}

export function configureRemote() {
  const executable = findTailscale();
  run(executable, ['serve', `--https=${HTTPS_PORT}`, '--bg', '--yes', String(LOCAL_PORT)]);
  const result = inspectRemote();
  if (!result.configured) throw new Error(`Tailscale did not retain HTTPS port ${HTTPS_PORT}`);
  return result;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = configureRemote();
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
