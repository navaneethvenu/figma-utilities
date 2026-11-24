// Deterministic engine audit: no Figma document is modified by this script.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
      fileName: filename,
    }).outputText,
    filename
  );
global.figma = new Proxy(
  { currentPage: { selection: [] }, editorType: 'figma' },
  { get: (o, k) => o[k] ?? (() => undefined) }
);
const root = path.join(__dirname, '../src/plugin/set-properties');
const { propList, flattenCommands } = require(path.join(root, 'prop-list.ts'));
const commands = Object.values(flattenCommands(propList, {}));
const parse = require(path.join(root, 'parse-params.ts')).default;
const suggest = require(path.join(root, 'suggestions.ts')).default;
const valid = (query) => {
  try {
    return parse({ audit: query }).length > 0;
  } catch {
    return false;
  }
};
const origins = ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br'];
const ops = ['', '+', '-', '*', '/', '++', '--', '**', '//'];
let cases = 0,
  labels = 0,
  examples = 0;
function check(query) {
  cases++;
  const results = suggest({ query });
  assert(Array.isArray(results));
  for (const result of results) {
    labels++;
    assert(typeof result.data === 'string' && typeof result.name === 'string');
    if (!valid(result.data))
      assert(
        /error:|enter value|\(Enter Value\)|complete|use |invalid|cannot|requires|needs/i.test(result.name),
        `Non-executable suggestion presented as normal: ${query} -> ${result.name}`
      );
  }
  return results;
}
for (const command of commands) {
  assert(command.action, `Catalog entry has no action: ${command.shortcut}`);
  assert.strictEqual(check(command.shortcut)[0]?.data, command.shortcut, `Bare shortcut ${command.shortcut}`);
  for (const example of command.examples ?? []) {
    examples++;
    assert(valid(example.token), `Invalid catalog example ${example.token}`);
    check(example.token);
  }
  const example = command.examples.find((entry) => valid(entry.token) && !entry.token.includes(' '));
  assert(example, `No single-command valid fixture for ${command.shortcut}`);
  const token = command.hasValue ? example.token : command.shortcut;
  for (const op of ops) {
    const modified = op + token;
    for (const query of [
      modified,
      `w12 ${modified}`,
      ...origins.flatMap((origin) => [`${origin}:${modified}`, `${origin}: ${modified}`]),
    ])
      check(query);
  }
  for (let i = 1; i <= command.shortcut.length; i++) check(command.shortcut.slice(0, i));
  for (const word of command.name.toLowerCase().match(/[a-z]+/g) ?? []) {
    for (let i = 1; i <= word.length; i++) check(word.slice(0, i));
  }
  const byName = check(command.name.toLowerCase());
  assert(
    byName.length > 0 && (byName[0].data === command.shortcut || byName[0].data.startsWith(command.shortcut)),
    `Full name did not resolve: ${command.name}`
  );
  for (const before of ['zzzz', 'wabc', '+aa', 'f#nothex']) {
    const results = check(`${before} ${token}`);
    assert(
      results.every((entry) => /Error:/.test(entry.name)),
      `Invalid context survived: ${before} ${token}`
    );
  }
  const next = check(token + ' ');
  assert(next.length > 0 && !next[0].data.endsWith('t""'), `Text hijacked continuation: ${token}`);
}
// Prefixes of complete examples also cover partially entered command chains.
for (const command of commands)
  for (const example of command.examples) {
    for (let index = 1; index <= example.token.length; index++) check(example.token.slice(0, index));
  }
const first = {
  DB: 'DB',
  DBL: 'DBL',
  DBR: 'DBR',
  DL: 'DL',
  DR: 'DR',
  DT: 'DT',
  DTL: 'DTL',
  DTR: 'DTR',
  c: 'c',
  cs: 'cs',
  'c:': 'c:',
  'b:h12': 'b:h12',
  width: 'w100',
  height: 'h100',
  'dock out bottom': 'DB',
  'w12 ': 'w12 fit',
  'w12 h ': 'w12 h100',
  'w10..50': 'w10..50',
  '+w10..50': '+w10..50',
  'rot-15': 'rot-15',
};
for (const [query, data] of Object.entries(first)) assert.strictEqual(check(query)[0]?.data, data, query);
for (const query of ['+aa', '+wh24,48', 'fit0', 'fill0', 'hug0', 'wabc h24', 'zzzz t"hi"', 'zzzz upper']) {
  assert(!valid(query), `Expected rejected input ${query}`);
  assert(/Error:/.test(check(query)[0]?.name), query);
}
for (const query of [
  '++w8+2',
  '--w100-10',
  '**w2*1.5',
  '//w100/2',
  '++w10..20+2',
  'sc:w10..50',
  'sc:+w10',
  '+sc:w10',
]) {
  assert(valid(query), `Expected accepted input ${query}`);
  check(query);
}
assert(
  !commands.some((command) => ['al', 'fa', 'fd', 's', 'fw', 'ts', 'nr', 'lha'].includes(command.shortcut)),
  'Extra dev catalog entries'
);
for (const query of [
  'al',
  'alx',
  'aly',
  'fa#123456',
  'fi1#123456',
  's#123456',
  'sa#123456',
  'si1#123456',
  'sd',
  'fw700',
  'ts14',
  'taL',
  'ttupper',
  'uc',
  'lha',
  'nr',
  'each(w100)',
  't"hello"',
])
  assert(!valid(query), `Feature leaked from dev: ${query}`);
check('each(');
check('t"unfinished');
console.log(
  `PASS: ${commands.length} executable catalog entries; ${examples} executable examples; ${cases} generated cases; ${labels} suggestion labels checked`
);
console.log('Boundary: suggestion/parser audit with mocked selection, not live Figma action or editor coverage.');
