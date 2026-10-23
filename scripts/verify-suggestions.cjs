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

for (const query of ['rad', 'ali', 'sli', 'ncb', '', 'zzzz-unmatched']) {
  console.log(`\n${query || '<empty>'}`);
  console.log(suggestions({ query }).slice(0, 12).map((item) => `${item.data} | ${item.name}`).join('\n'));
}
