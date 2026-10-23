const fs = require('fs');
const path = require('path');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

global.figma = new Proxy({}, { get: () => () => undefined });
const suggestions = require(path.join(__dirname, '../src/plugin/set-properties/suggestions.ts')).default;

const expected = {
  'b:h12': 'b:h12 - Set Height to 12px (origin: Bottom)',
  h12: 'h12 - Set Height to 12px',
  c: 'c - Stretch all Constraints',
  'c:': 'c: - Set transform origin to Center',
  text: 'fw - Set Font Weight to (Enter Value)',
  ts: 'ts - Set Text Size to (Enter Value)',
  fs: 'esb - Exclude Boolean Operations from Selection',
  prepend: 'pr100 - Set Right Padding to 100',
};

for (const [query, expectedTop] of Object.entries(expected)) {
  const top = suggestions({ query }).slice(0, 5).map((item) => `${item.data} - ${item.name.split(' - ')[1]}`);
  console.log(`QUERY ${JSON.stringify(query)}`);
  top.forEach((item, index) => console.log(`${index + 1}. ${item}`));
  if (top[0] !== expectedTop) {
    throw new Error(`Expected ${JSON.stringify(expectedTop)} first for ${JSON.stringify(query)}, got ${JSON.stringify(top[0])}`);
  }
}

console.log('PASS: exact-value ranking and regression cases');
