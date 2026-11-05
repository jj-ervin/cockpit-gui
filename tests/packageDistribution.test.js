'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const allowedFiles = [
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  'docs/PACKAGE-CONTRACTS.md',
  'package.json',
  'src/cockpitGUI.css',
  'src/commandPaletteUI.js',
  'src/workbenchUI.js',
  'src/workspaceUI.js',
].sort();

function runNpm(args, cwd) {
  const npmCli = process.env.npm_execpath;
  assert.ok(npmCli, 'npm_execpath is present when package tests run through npm');
  return childProcess.execFileSync(process.execPath, [npmCli, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('packed package installs offline and exposes only the supported API', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cockpit-gui-package-'));
  try {
    const packDir = path.join(temporaryRoot, 'pack');
    const consumerDir = path.join(temporaryRoot, 'consumer');
    fs.mkdirSync(packDir);
    fs.mkdirSync(consumerDir);
    fs.writeFileSync(path.join(consumerDir, 'package.json'), JSON.stringify({
      name: 'cockpit-gui-consumer-smoke',
      private: true,
      type: 'module',
    }, null, 2));

    const packed = JSON.parse(runNpm([
      'pack', '--json', '--pack-destination', packDir,
    ], projectRoot))[0];
    assert.ok(packed.files.some(file => file.path === 'LICENSE'));
    assert.deepEqual(packed.files.map(file => file.path).sort(), allowedFiles);
    assert.equal(packed.bundled.length, 0);

    const tarball = path.join(packDir, packed.filename);
    runNpm([
      'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
      '--prefix', consumerDir, tarball,
    ], consumerDir);

    const installedDir = path.join(consumerDir, 'node_modules', '@cockpit', 'gui');
    const metadata = JSON.parse(fs.readFileSync(path.join(installedDir, 'package.json'), 'utf8'));
    assert.equal(metadata.name, '@cockpit/gui');
    assert.equal(metadata.version, '0.1.2');
    assert.equal(metadata.private, true);
    assert.equal(metadata.license, 'MIT');
    assert.equal(Object.hasOwn(metadata, 'publishConfig'), false);
    assert.match(
      fs.readFileSync(path.join(installedDir, 'LICENSE'), 'utf8'),
      /Copyright \(c\) 2026 Osprey Strategic Holdings LLC\./,
    );
    assert.deepEqual(metadata.dependencies || {}, {});
    assert.ok(!fs.existsSync(path.join(installedDir, 'node_modules', 'axe-core')));
    assert.ok(!fs.existsSync(path.join(installedDir, 'node_modules', 'playwright')));

    const cjs = [
      "const assert = require('node:assert/strict');",
      "const root = require('@cockpit/gui');",
      "assert.equal(typeof root, 'function');",
      "assert.equal(root, require('@cockpit/gui/command-palette'));",
      "assert.throws(() => root({}), /requires document/);",
      "const createWorkbench = require('@cockpit/gui/workbench');",
      "assert.equal(typeof createWorkbench, 'function');",
      "assert.throws(() => createWorkbench({}), /requires document/);",
      "const createWorkspace = require('@cockpit/gui/workspace');",
      "assert.equal(typeof createWorkspace, 'function');",
      "assert.throws(() => createWorkspace({}), /requires document/);",
      "assert.ok(require.resolve('@cockpit/gui/styles.css').endsWith('cockpitGUI.css'));",
      "class Element {",
      "  constructor(tag) { this.tagName = tag; this.children = []; this.dataset = {}; this.attributes = {}; this.classList = { add() {} }; }",
      "  get firstChild() { return this.children[0] || null; }",
      "  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }",
      "  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; }",
      "  setAttribute(name, value) { this.attributes[name] = String(value); }",
      "  addEventListener() {}",
      "}",
      "const workspace = createWorkspace({ document: { createElement: tag => new Element(tag) }, navigationRoot: new Element('nav'), panelRoot: new Element('main'), items: [{ id: 'activity', label: 'Activity' }] });",
      "assert.equal(workspace.activeId(), 'activity');",
      "assert.equal(workspace.panel('activity').attributes.role, 'tabpanel');",
      "workspace.setPanelState('activity', 'populated', { text: 'Consumer smoke' });",
      "assert.equal(workspace.panel('activity').children[1].children[0].textContent, 'Consumer smoke');",
    ].join('\n');
    childProcess.execFileSync(process.execPath, ['-e', cjs], {
      cwd: consumerDir,
      stdio: 'pipe',
    });

    const esmFile = path.join(consumerDir, 'consumer.mjs');
    fs.writeFileSync(esmFile, [
      "import assert from 'node:assert/strict';",
      "import commandPalette from '@cockpit/gui';",
      "import workspace from '@cockpit/gui/workspace';",
      "import workbench from '@cockpit/gui/workbench';",
      "assert.equal(typeof workbench, 'function');",
      "assert.equal(typeof commandPalette, 'function');",
      "assert.equal(typeof workspace, 'function');",
    ].join('\n'));
    childProcess.execFileSync(process.execPath, [esmFile], { cwd: consumerDir, stdio: 'pipe' });

    for (const [file, globalName] of [
      ['src/commandPaletteUI.js', 'CockpitCommandPaletteUI'],
      ['src/workspaceUI.js', 'CockpitWorkspaceUI'],
      ['src/workbenchUI.js', 'CockpitWorkbenchUI'],
    ]) {
      const browserGlobal = {};
      vm.runInNewContext(fs.readFileSync(path.join(installedDir, file), 'utf8'), {
        window: browserGlobal,
      }, { filename: file });
      assert.equal(typeof browserGlobal[globalName], 'function', globalName + ' UMD global');
    }

    const css = fs.readFileSync(path.join(installedDir, 'src', 'cockpitGUI.css'), 'utf8');
    assert.match(css, /\.cockpit-navigation/);
    assert.match(css, /\.cockpit-navigation__item:focus-visible/);
    assert.match(css, /@media\s*\(forced-colors:\s*active\)/);
    assert.match(
      fs.readFileSync(path.join(installedDir, 'docs', 'PACKAGE-CONTRACTS.md'), 'utf8'),
      /Supported entry points/,
    );
  } finally {
    const tempBase = fs.realpathSync(os.tmpdir());
    const tempTarget = fs.realpathSync(temporaryRoot);
    const relativeTarget = path.relative(tempBase, tempTarget);
    assert.ok(
      relativeTarget && relativeTarget !== '..' &&
      !relativeTarget.startsWith('..' + path.sep) && !path.isAbsolute(relativeTarget),
      'temporary test cleanup target stays below the OS temp directory',
    );
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
