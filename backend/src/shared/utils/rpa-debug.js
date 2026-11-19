import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_DIR = path.resolve(__dirname, '../../../debug-screenshots');

// Saves a screenshot + logs the current URL whenever an RPA step fails
// unexpectedly — a bare "not found"/timeout otherwise gives zero context on
// what page was actually loaded (blank page? bot-check? rate-limited? a
// page that genuinely has no data?). Never throws itself — a failure here
// shouldn't mask the real error. Shared across RPA files (originally
// login.rpa.js-only, pulled out here once extract-job-post.rpa.js needed
// the exact same thing).
export async function captureDebugContext(page, label) {
  try {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
    const stamp = Date.now();
    const screenshotPath = path.join(DEBUG_DIR, `${label}-${stamp}.png`);
    const htmlPath = path.join(DEBUG_DIR, `${label}-${stamp}.html`);
    const html = await page.content();
    await Promise.all([
      page.screenshot({ path: screenshotPath }),
      fs.promises.writeFile(htmlPath, html),
    ]);
    console.error(`[rpa-debug] ${label} — url=${page.url()} screenshot=${screenshotPath} html=${htmlPath}`);
  } catch (captureErr) {
    console.error(`[rpa-debug] ${label} — and debug capture also failed:`, captureErr.message);
  }
}
