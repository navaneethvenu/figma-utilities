const assert = require('assert');
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

const notifications = [];
global.figma = {
  mixed: Symbol('mixed'),
  currentPage: { selection: [], selectedTextRange: null },
  loadFontAsync: async () => undefined,
  notify: (message) => notifications.push(message),
  commitUndo: () => undefined,
  clientStorage: { getAsync: async () => [], setAsync: async () => undefined },
};

const parseParameters = require(path.join(__dirname, '../src/plugin/set-properties/parse-params.ts')).default;
const applyTextCommand = require(path.join(__dirname, '../src/plugin/set-properties/utils/text/apply-text-command.ts')).default;
const setStrokeWidth = require(path.join(__dirname, '../src/plugin/set-properties/utils/stroke/set-stroke-width.ts')).default;
const setAutolayoutBehavior = require(path.join(__dirname, '../src/plugin/set-properties/utils/autolayout/set-autolayout-behavior.ts')).default;
const { fitToParent } = require(path.join(__dirname, '../src/plugin/set-properties/utils/fit/fit.ts'));
const setProperties = require(path.join(__dirname, '../src/plugin/set-properties/set-properties.ts')).default;

function record(family, label, output) {
  console.log(`[${family}] ${label}: ${JSON.stringify(output)}`);
}

async function main() {
  const failures = [];
  const parse = (family, label, token) => {
    const output = parseParameters({ smoke: token });
    record(family, label, output);
    return output;
  };

  const each = parse('each-loop', 'parse each range', 'each(1..3(h$n))');
  assert.strictEqual(each[0].eachCommand, true);
  assert.strictEqual(each[0].raw, 'each(1..3(h$n))');

  const eachNode = { id: 'n1', name: 'Node', type: 'RECTANGLE', width: 10, height: 10, resize(w, h) { this.width = w; this.height = h; } };
  figma.currentPage.selection = [eachNode];
  try {
    await setProperties({ smoke: 'each(1..3(h$n))' });
    record('each-loop', 'range expansion heights', { height: eachNode.height, notifications });
    assert.strictEqual(eachNode.height, 3);
  } catch (error) {
    failures.push(`each-loop execution: ${error.message}`);
    console.log(`[each-loop] FAIL-REAL-BUG: ${error.message}`);
  }

  const textNode = {
    id: 'text1', name: 'Text', type: 'TEXT', characters: 'Hello world', fontName: { family: 'Inter', style: 'Regular' },
    getRangeAllFontNames: () => [{ family: 'Inter', style: 'Regular' }],
  };
  for (const [token, expected] of [
    ['pre:+t:"Say "', 'Say Hello world'],
    ['+t:"!"', 'Say Hello world!'],
    ['t:"world"=>"there"', 'Say Hello there!'],
  ]) {
    if (token.startsWith('pre:')) textNode.characters = 'Hello world';
    await applyTextCommand(token, [textNode]);
    record('text-edit', token, textNode.characters);
    assert.strictEqual(textNode.characters, expected);
  }
  parse('text-edit', 'parse text commands', 'pre:+t:"x" +t:"y" t:"x"=>"z"');

  const rewriteNode = { ...textNode, characters: 'Hello WORLD.' };
  for (const [token, expected] of [['upper', 'HELLO WORLD.'], ['lower', 'hello world.'], ['title', 'Hello World.'], ['sentence', 'Hello world.']]) {
    rewriteNode.characters = 'Hello WORLD.';
    await applyTextCommand(token, [rewriteNode]);
    record('text-style', token, rewriteNode.characters);
    assert.strictEqual(rewriteNode.characters, expected);
  }
  for (const token of ['fw700', 'lh24', 'lhp', 'lc', 'lcr', 'ts16']) parse('text-style', `parse ${token}`, token);
  console.log('[text-style] fw/lh/ts application: UNTESTED-BY-DESIGN (font loading and Figma text properties)');

  for (const token of ['sw2', 'swl3', 'sai', 'fa#ff0000', 'sa#00ff00']) parse('paint', `parse ${token}`, token);
  const strokeNode = { type: 'RECTANGLE', strokes: [], strokeTopWeight: 0, strokeRightWeight: 0, strokeBottomWeight: 0, strokeLeftWeight: 0 };
  setStrokeWidth({ param: 'swx', value: '3px', nodes: [strokeNode] });
  record('paint', 'swx3px computation', { left: strokeNode.strokeLeftWeight, right: strokeNode.strokeRightWeight });
  assert.deepStrictEqual([strokeNode.strokeLeftWeight, strokeNode.strokeRightWeight], [3, 3]);
  console.log('[paint] fill/stroke paint mutation: UNTESTED-BY-DESIGN (Figma Paint API semantics)');

  const autoNode = { type: 'FRAME', layoutMode: 'HORIZONTAL', layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED' };
  for (const [command, value, expected] of [['fill', 'w', ['FILL', 'FIXED']], ['hug', 'h', ['FILL', 'HUG']]]) {
    setAutolayoutBehavior({ command, value, nodes: [autoNode] });
    record('axis', `${command}${value}`, { horizontal: autoNode.layoutSizingHorizontal, vertical: autoNode.layoutSizingVertical });
    assert.deepStrictEqual([autoNode.layoutSizingHorizontal, autoNode.layoutSizingVertical], expected);
  }
  parse('axis', 'parse fit/fill/hug', 'fitw fillh hug');
  console.log('[axis] fit geometry mutation: UNTESTED-BY-DESIGN (parent/node geometry and Figma layout APIs)');

  if (failures.length > 0) {
    console.log(`FAIL: command/parse smoke suite (${failures.length} real failure(s))`);
    failures.forEach((failure) => console.log(`REAL BUG: ${failure}`));
    process.exitCode = 1;
    return;
  }
  console.log('PASS: command/parse smoke suite');
}

main().catch((error) => {
  console.error(`FAIL: ${error.stack || error}`);
  process.exitCode = 1;
});
