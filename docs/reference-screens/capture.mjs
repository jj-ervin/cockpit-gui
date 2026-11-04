import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const directory = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const cases = [
  ['desktop-workspace-1440x900.png', 1440, 900, 'workspace'],
  ['desktop-workspace-1280x800.png', 1280, 800, 'workspace'],
  ['ai-change-review-1440x900.png', 1440, 900, 'review'],
  ['narrow-workspace-390x844.png', 390, 844, 'workspace'],
];

try {
  for (const [name, width, height, state] of cases) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(`file:///${join(directory, 'workbench-reference.html').replaceAll('\\', '/')}?state=${state}`);
    await page.screenshot({ path: join(directory, name) });
    console.log(`${name}: Chromium ${browser.version()}, ${width}x${height}, scale 1`);
    await page.close();
  }
} finally {
  await browser.close();
}
