/**
 * publish.mjs — one command to put your latest edits on the live site.
 *
 *   npm run publish
 *
 * Pulls fresh CV data out of ResumeApp, type-checks and builds so a broken
 * change is caught here rather than in CI, then commits and pushes. GitHub
 * Actions takes it from there.
 *
 * Stops before committing if the build fails, and does nothing at all if there
 * is nothing to publish.
 */
import { execSync } from 'node:child_process';

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  amber: (s) => `\x1b[38;5;214m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const quiet = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

function step(n, total, label) {
  console.log(`\n${c.amber(`[${n}/${total}]`)} ${c.bold(label)}`);
}

try {
  const TOTAL = 5;

  step(1, TOTAL, 'Syncing CV data from ResumeApp');
  run('node scripts/sync-resume.mjs');

  step(2, TOTAL, 'Checking uploaded files');
  try {
    run('node scripts/check-assets.mjs');
  } catch {
    // the checker has already printed what is missing and how to fix it
    console.error(`\n${c.red('✗ Stopped.')} Some content points at files that were deleted.`);
    console.error(c.dim('  Publishing now would put broken images on the live site.\n'));
    process.exit(1);
  }

  step(3, TOTAL, 'Building');
  run('npm run build');

  step(4, TOTAL, 'Committing');
  const dirty = quiet('git status --porcelain');
  if (!dirty) {
    console.log(c.dim('  nothing changed — already published'));
    process.exit(0);
  }
  console.log(c.dim(dirty.split('\n').slice(0, 12).map((l) => '  ' + l).join('\n')));

  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  run('git add -A');
  run(`git commit -q -m "Update portfolio — ${stamp}"`);

  step(5, TOTAL, 'Pushing');
  run('git push -q origin main');

  const url = 'https://mohammed-amine-talhi.github.io';
  console.log(`\n${c.green('✓ Published.')} Live in a minute or two at ${c.bold(url)}`);
  console.log(c.dim('  Watch the deploy:  gh run watch --repo Mohammed-Amine-TALHI/Mohammed-amine-talhi.github.io\n'));
} catch (err) {
  console.error(`\n${c.red('✗ Stopped.')} ${err.message.split('\n')[0]}`);
  console.error(c.dim('  Nothing was pushed. Fix the problem above and run `npm run publish` again.\n'));
  process.exit(1);
}
