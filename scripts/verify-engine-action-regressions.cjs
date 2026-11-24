// Mocked action regressions only. Does not connect to a Figma document.
const fs = require('fs'),
  ts = require('typescript'),
  assert = require('assert');
require.extensions['.ts'] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
    }).outputText,
    f
  );
const notes = [];
global.figma = {
  currentPage: { selection: [] },
  mixed: Symbol('mixed'),
  notify: (m) => notes.push(m),
  commitUndo: () => {},
  clientStorage: { getAsync: async () => [], setAsync: async () => {} },
  loadFontAsync: async () => {},
};
const root = require('path').join(__dirname, '../src/plugin/set-properties/');
const execute = require(root + 'set-properties.ts').default;
const nodes = () =>
  Array.from({ length: 3 }, (_, i) => ({
    id: 'n' + i,
    name: 'Node ' + i,
    type: 'RECTANGLE',
    width: 100,
    height: 50,
    rotation: 0,
    x: 0,
    y: 0,
    resize(w, h) {
      this.width = w;
      this.height = h;
    },
    rescale(f) {
      this.width *= f;
      this.height *= f;
    },
  }));
(async () => {
  for (const [q, expected] of [
    ['w10..50', [10, 30, 50]],
    ['+w10..50', [110, 130, 150]],
    ['sc:w10..50', [10, 30, 50]],
    ['++w8+2', [108, 118, 130]],
  ]) {
    figma.currentPage.selection = nodes();
    await execute({ q });
    assert.deepStrictEqual(
      figma.currentPage.selection.map((n) => n.width),
      expected,
      q
    );
    console.log('PASS', q, expected);
  }
  figma.currentPage.selection = nodes();
  await execute({ q: 'rot-15' });
  assert(figma.currentPage.selection.every((n) => n.rotation === -15));
  console.log('PASS negative rotation');
  assert(notes.every((message) => message === 'Properties set successfully.'));
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
