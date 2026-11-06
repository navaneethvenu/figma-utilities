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
const createdProbes = [];
global.figma = {
  mixed: Symbol('mixed'),
  currentPage: { selection: [], selectedTextRange: null },
  loadFontAsync: async () => undefined,
  createText: () => {
    const probe = {
      fontName: null,
      fontSize: 12,
      textAutoResize: 'WIDTH_AND_HEIGHT',
      removed: false,
      _characters: '',
      get characters() { return this._characters; },
      set characters(v) { this._characters = v; },
      get height() { return this._characters ? this.fontSize * 1.2 : 0; },
      remove() { this.removed = true; },
    };
    createdProbes.push(probe);
    return probe;
  },
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

  const each = parse('each-loop', 'parse each range', 'each1..3(h$n)');
  assert.strictEqual(each[0].eachCommand, true);
  assert.strictEqual(each[0].raw, 'each1..3(h$n)');

  const eachNode = { id: 'n1', name: 'Node', type: 'RECTANGLE', width: 10, height: 10, resize(w, h) { this.width = w; this.height = h; } };
  figma.currentPage.selection = [eachNode];
  try {
    await setProperties({ smoke: 'each1..3(h$n)' });
    record('each-loop', 'range expansion heights', { height: eachNode.height, notifications });
    assert.strictEqual(eachNode.height, 3);
  } catch (error) {
    failures.push(`each-loop execution: ${error.message}`);
    console.log(`[each-loop] FAIL-REAL-BUG: ${error.message}`);
  }
  for (const [variable, expected] of [['$i', 2], ['$name', 3], ['$id', 3]]) {
    eachNode.height = 10;
    await setProperties({ smoke: `each1..3(h${variable})` });
    record('each-loop', `${variable} range expansion`, eachNode.height);
    assert.strictEqual(eachNode.height, expected);
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

  const smokeFont = { family: 'Inter', style: 'Regular' };
  const mkText = (overrides) => Object.assign({
    id: 'lt1', name: 'Label', type: 'TEXT', characters: 'hello',
    fontSize: 10, fontName: smokeFont, lineHeight: { unit: 'AUTO' },
    getRangeAllFontNames: () => [smokeFont],
  }, overrides);

  const autoPercent = mkText();
  figma.currentPage.selection = [autoPercent];
  await setProperties({ smoke: 'lhp' });
  record('lineheight', 'AUTO lhp pins measured percent', autoPercent.lineHeight);
  assert.deepStrictEqual(autoPercent.lineHeight, { value: 120, unit: 'PERCENT' });

  const autoPixels = mkText();
  figma.currentPage.selection = [autoPixels];
  await setProperties({ smoke: 'lhpx' });
  record('lineheight', 'AUTO lhpx pins measured pixels', autoPixels.lineHeight);
  assert.deepStrictEqual(autoPixels.lineHeight, { value: 12, unit: 'PIXELS' });
  assert.strictEqual(createdProbes.length, 2);
  assert.ok(createdProbes.every((probe) => probe.removed), 'every measurement probe removed');
  record('lineheight', 'probe cleanup verified', { created: createdProbes.length, removed: createdProbes.filter((probe) => probe.removed).length });

  const autoExplicit = mkText();
  figma.currentPage.selection = [autoExplicit];
  await setProperties({ smoke: 'lh150' });
  record('lineheight', 'AUTO lh150 explicit percent', autoExplicit.lineHeight);
  assert.deepStrictEqual(autoExplicit.lineHeight, { value: 150, unit: 'PERCENT' });

  const autoExplicitPx = mkText();
  figma.currentPage.selection = [autoExplicitPx];
  await setProperties({ smoke: 'lh24px' });
  record('lineheight', 'AUTO lh24px explicit pixels', autoExplicitPx.lineHeight);
  assert.deepStrictEqual(autoExplicitPx.lineHeight, { value: 24, unit: 'PIXELS' });

  const explicitConvert = mkText({ lineHeight: { value: 50, unit: 'PIXELS' } });
  figma.currentPage.selection = [explicitConvert];
  await setProperties({ smoke: 'lhp' });
  record('lineheight', 'PIXELS to PERCENT conversion', explicitConvert.lineHeight);
  assert.deepStrictEqual(explicitConvert.lineHeight, { value: 500, unit: 'PERCENT' });

  const noteBeforeMixed = notifications.length;
  const mixedLh = mkText({ lineHeight: figma.mixed });
  figma.currentPage.selection = [mixedLh];
  await setProperties({ smoke: 'lhp' });
  record('lineheight', 'mixed line height still errors', notifications.slice(noteBeforeMixed));
  assert.ok(notifications.slice(noteBeforeMixed).some((n) => String(n).includes('mixed line height')));
  assert.ok(mixedLh.lineHeight === figma.mixed, 'mixed line height node left unmutated');

  const noteBeforeFont = notifications.length;
  const mixedFont = mkText({ fontName: figma.mixed });
  figma.currentPage.selection = [mixedFont];
  await setProperties({ smoke: 'lhp' });
  record('lineheight', 'mixed font AUTO errors without mutating', { lineHeight: mixedFont.lineHeight, notifications: notifications.slice(noteBeforeFont) });
  assert.deepStrictEqual(mixedFont.lineHeight, { unit: 'AUTO' });
  assert.ok(notifications.slice(noteBeforeFont).some((n) => String(n).includes('cannot be measured')));

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
