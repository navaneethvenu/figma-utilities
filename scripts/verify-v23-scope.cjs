// Release boundary: compare against the exact published V22 source, not dev ancestry.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
      fileName: filename,
    }).outputText,
    filename
  );
global.figma = new Proxy({}, { get: () => () => undefined });
const repo = path.join(__dirname, '..');
const base = 'e99d5bd336ac68ce9837e983253aae2a697714aa';
const catalogPath = 'src/plugin/set-properties/prop-list.ts';
const { propList, flattenCommands } = require(path.join(repo, catalogPath));
const expected = [
  'DB',
  'DBL',
  'DBR',
  'DL',
  'DR',
  'DT',
  'DTL',
  'DTR',
  'aa',
  'ax',
  'ay',
  'c',
  'cc',
  'clip',
  'count',
  'countn',
  'cs',
  'cx',
  'cxc',
  'cxl',
  'cxr',
  'cxs',
  'cy',
  'cyb',
  'cyc',
  'cys',
  'cyt',
  'db',
  'dbl',
  'dbr',
  'dl',
  'dr',
  'dt',
  'dtl',
  'dtr',
  'dup',
  'esb',
  'esc',
  'escs',
  'ese',
  'esf',
  'esg',
  'esi',
  'esl',
  'esp',
  'esr',
  'ess',
  'est',
  'esv',
  'f',
  'fill',
  'fit',
  'fsb',
  'fsc',
  'fscs',
  'fse',
  'fsf',
  'fsg',
  'fsi',
  'fsl',
  'fsp',
  'fsr',
  'fss',
  'fst',
  'fsv',
  'gap',
  'gapx',
  'gapy',
  'h',
  'hug',
  'leaf',
  'lh',
  'lhp',
  'lhpx',
  'ls',
  'lsp',
  'lspx',
  'op',
  'p',
  'pb',
  'pl',
  'pr',
  'pt',
  'px',
  'py',
  'r',
  'rb',
  'rbl',
  'rbr',
  'rl',
  'root',
  'rot',
  'rr',
  'rt',
  'rtl',
  'rtr',
  'sac',
  'sai',
  'sao',
  'sc:h',
  'sc:w',
  'selb',
  'selc',
  'seli',
  'sell',
  'selns',
  'selp',
  'selps',
  'selr',
  'selt',
  'sw',
  'swap',
  'swapx',
  'swapy',
  'swb',
  'swl',
  'swr',
  'swt',
  'swx',
  'swy',
  'w',
  'wf',
  'wh',
  'x',
  'xy',
  'y',
];
const actual = Object.values(flattenCommands(propList, {}))
  .filter((c) => c.action)
  .map((c) => c.shortcut)
  .sort();
assert.deepStrictEqual(actual, expected, 'Executable command set changed from V22');
function actionBodies(source) {
  const file = ts.createSourceFile('catalog.ts', source, ts.ScriptTarget.Latest, true);
  const printer = ts.createPrinter({ removeComments: true });
  const actions = [];
  function visit(node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(file) === 'action')
      actions.push(printer.printNode(ts.EmitHint.Expression, node.initializer, file));
    ts.forEachChild(node, visit);
  }
  visit(file);
  return actions;
}
const old = cp.execFileSync('git', ['show', `${base}:${catalogPath}`], { cwd: repo, encoding: 'utf8' });
assert.deepStrictEqual(
  actionBodies(fs.readFileSync(path.join(repo, catalogPath), 'utf8')),
  actionBodies(old),
  'Catalog action bodies changed'
);
const changedActions = cp
  .execFileSync(
    'git',
    [
      'diff',
      '--name-only',
      base,
      '--',
      'src/plugin/set-properties/utils',
      'src/plugin/set-properties/set-properties.ts',
      'src/plugin/controller.ts',
    ],
    { cwd: repo, encoding: 'utf8' }
  )
  .trim();
assert.strictEqual(changedActions, '', 'Action/controller implementation changed');
console.log(
  `PASS: same ${actual.length} executable V22 commands, identical catalog action bodies, unchanged action implementations/controller/executor`
);
