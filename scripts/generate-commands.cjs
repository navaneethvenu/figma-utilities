#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(repoRoot, 'src/plugin/set-properties/prop-list.ts');
const outputPath = path.join(repoRoot, 'docs/generated/commands.json');

function readSource(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function getObjectProp(node, propName) {
  const prop = node.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ((ts.isIdentifier(p.name) && p.name.text === propName) ||
        (ts.isStringLiteral(p.name) && p.name.text === propName))
  );
  return prop ? prop.initializer : undefined;
}

function toStringLiteral(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

function toBooleanLiteral(node) {
  if (!node) return undefined;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  return undefined;
}

function keyText(name) {
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name)) return name.text;
  return name.getText();
}

function findObjectVariableInitializer(sourceFile, variableName) {
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== variableName) continue;
      if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
        return decl.initializer;
      }
    }
  }
  return null;
}

function parseExamplesArray(node) {
  if (!node || !ts.isArrayLiteralExpression(node)) return [];
  const out = [];
  for (const el of node.elements) {
    if (!ts.isObjectLiteralExpression(el)) continue;
    const token = toStringLiteral(getObjectProp(el, 'token'));
    const help = toStringLiteral(getObjectProp(el, 'help'));
    if (!token) continue;
    out.push(compactObject({ token, help: help || null }));
  }
  return out;
}

function findShortcutExamplesMap(sourceFile) {
  const out = {};
  for (const stmt of sourceFile.statements) {
    if (!ts.isFunctionDeclaration(stmt) || !stmt.name || stmt.name.text !== 'byShortcutExamples') continue;
    if (!stmt.body) continue;

    for (const bodyStmt of stmt.body.statements) {
      if (!ts.isVariableStatement(bodyStmt)) continue;
      for (const decl of bodyStmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || decl.name.text !== 'examples') continue;
        if (!decl.initializer || !ts.isObjectLiteralExpression(decl.initializer)) continue;

        for (const prop of decl.initializer.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const key = keyText(prop.name);
          out[key] = parseExamplesArray(prop.initializer);
        }
      }
    }
  }
  return out;
}

function groupIdFromPath(groupPath) {
  return groupPath.length ? groupPath.join('/') : null;
}

function compactObject(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined));
}

function toValueLabel(hasValue) {
  if (hasValue === true) return 'required';
  if (hasValue === false) return 'none';
  return 'unknown';
}

function toSyntax(shortcut, hasValue) {
  if (hasValue === true) return `${shortcut}<value>`;
  if (hasValue === false) return `${shortcut}`;
  return shortcut;
}

function lowerFirst(value) {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function buildGeneratedDescription({ name, shortcut, hasValue, isGroup, examples, childShortcuts }) {
  if (isGroup) {
    if (!Array.isArray(childShortcuts) || childShortcuts.length === 0) {
      return `Command group for ${name}.`;
    }
    const preview = childShortcuts
      .slice(0, 4)
      .map((entry) => `\`${entry}\``)
      .join(', ');
    return `Command group for ${name}. Start with: ${preview}.`;
  }

  const syntax = hasValue === false ? `\`${shortcut}\`` : `\`${shortcut}<value>\``;
  const preview = (examples || [])
    .slice(0, 2)
    .map((entry) => `\`${entry.token}\``)
    .join(', ');

  if (hasValue === false) {
    return `Use ${syntax} to ${lowerFirst(name)}. Common usage: ${preview}.`;
  }

  return `Use ${syntax} to ${lowerFirst(name)}. Try: ${preview}.`;
}

function buildFlags(item) {
  const flags = [];
  if (item.hasValue === true) flags.push('value');
  if (item.supportsModifiers === true) flags.push('modifiers');
  if (item.supportsOrigin === true) flags.push('origin');
  if (item.allowsNegative === true) flags.push('negative');
  return flags;
}

function buildFallbackExamples({ token, name, hasValue, unit }) {
  if (hasValue === false) {
    return [
      { token, help: `Run ${name}` },
      { token: `${token} w160`, help: `Run ${name}, then set width to 160px` },
      { token: `${token} h96`, help: `Run ${name}, then set height to 96px` },
      { token: `${token} op80`, help: `Run ${name}, then set opacity to 80%` },
    ];
  }

  const normalizedUnit = (unit || '').toLowerCase();

  if (normalizedUnit === 'hex') {
    return [
      { token: `${token}#1A73E8`, help: `Use ${name} with a hex value` },
      { token: `${token}#FF6D00@60`, help: `Use ${name} with opacity` },
      { token: `${token}#00C853:m:on`, help: `Use ${name} with blend and visibility` },
      { token: `${token}#111111:o:off`, help: `Use ${name} with overlay options` },
    ];
  }

  if (normalizedUnit === '%') {
    return [
      { token: `${token}100`, help: `Set ${name} to 100%` },
      { token: `${token}80`, help: `Set ${name} to 80%` },
      { token: `+${token}5`, help: `Increase ${name} by 5%` },
      { token: `--${token}100-10`, help: `Progressively reduce ${name}` },
    ];
  }

  if (normalizedUnit === 'deg') {
    return [
      { token: `${token}0`, help: `Reset ${name} to 0 degrees` },
      { token: `${token}45`, help: `Set ${name} to 45 degrees` },
      { token: `+${token}15`, help: `Increase ${name} by 15 degrees` },
      { token: `--${token}90-10`, help: `Progressively reduce ${name}` },
    ];
  }

  return [
    { token: `${token}100`, help: `Set ${name} to 100` },
    { token: `${token}50%`, help: `Set ${name} to 50%` },
    { token: `+${token}8`, help: `Increase ${name} by 8` },
    { token: `++${token}8+2`, help: `Progressively increase ${name}` },
  ];
}

function ensureAtLeastFourExamples(baseExamples) {
  const deduped = [];
  const seen = new Set();

  for (const example of baseExamples) {
    const token = example?.token;
    const help = example?.help;
    if (!token) continue;
    const key = `${token}::${help || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(compactObject({ token, help: help || null }));
  }

  return deduped.slice(0, 4);
}

function parseCommandObject(
  itemKey,
  objNode,
  parentShortcutPath,
  parentNamePath,
  groups,
  commands,
  ordinal,
  examplesByShortcut
) {
  const shortcut = toStringLiteral(getObjectProp(objNode, 'shortcut')) || itemKey;
  const name = toStringLiteral(getObjectProp(objNode, 'name')) || shortcut;
  const description = toStringLiteral(getObjectProp(objNode, 'description'));
  const notes = toStringLiteral(getObjectProp(objNode, 'notes'));
  const unit = toStringLiteral(getObjectProp(objNode, 'unit'));
  const type = toStringLiteral(getObjectProp(objNode, 'type'));
  const hasValue = toBooleanLiteral(getObjectProp(objNode, 'hasValue'));
  const supportsModifiers = toBooleanLiteral(getObjectProp(objNode, 'supportsModifiers'));
  const supportsOrigin = toBooleanLiteral(getObjectProp(objNode, 'supportsOrigin'));
  const allowsNegative = toBooleanLiteral(getObjectProp(objNode, 'allowsNegative'));

  const hasAction = Boolean(getObjectProp(objNode, 'action'));
  const subcommandsNode = getObjectProp(objNode, 'subcommands');
  const hasSubcommands = Boolean(subcommandsNode && ts.isObjectLiteralExpression(subcommandsNode));
  const childShortcuts =
    hasSubcommands && ts.isObjectLiteralExpression(subcommandsNode)
      ? subcommandsNode.properties
          .filter((prop) => ts.isPropertyAssignment(prop))
          .map((prop) => {
            if (!ts.isPropertyAssignment(prop)) return null;
            if (!ts.isObjectLiteralExpression(prop.initializer)) return keyText(prop.name);
            return toStringLiteral(getObjectProp(prop.initializer, 'shortcut')) || keyText(prop.name);
          })
          .filter(Boolean)
      : [];
  const inlineExamples = parseExamplesArray(getObjectProp(objNode, 'examples'));
  const mappedExamples = examplesByShortcut[shortcut] || [];

  const thisPath = [...parentShortcutPath, shortcut];
  const isGroup = type === 'GROUP' || hasSubcommands;

  if (isGroup) {
    groups.push(
      compactObject({
      id: groupIdFromPath(thisPath),
      shortcut,
      name,
      description:
        description ||
        buildGeneratedDescription({
          name,
          shortcut,
          hasValue,
          isGroup: true,
          examples: [],
          childShortcuts,
        }),
      notes: notes || null,
      parent: groupIdFromPath(parentShortcutPath),
      depth: thisPath.length - 1,
      order: ordinal.value++,
      })
    );
  }

  if (hasAction) {
    const pathLabel = parentNamePath.length ? parentNamePath.join(' / ') : 'Top Level';
    const item = {
      id: shortcut,
      token: shortcut,
      name,
      group: parentShortcutPath[0] || null,
      groupName: parentNamePath[0] || null,
      groupPath: parentShortcutPath,
      parent: parentShortcutPath.length ? parentShortcutPath[parentShortcutPath.length - 1] : null,
      path: pathLabel,
      hasValue: hasValue ?? null,
      value: toValueLabel(hasValue),
      supportsModifiers: supportsModifiers ?? null,
      supportsOrigin: supportsOrigin ?? null,
      allowsNegative: allowsNegative ?? null,
      flags: [],
      syntax: toSyntax(shortcut, hasValue),
      unit: unit || null,
      description: null,
      notes: notes || null,
      type: type || 'ACTION',
      examples: [],
      order: ordinal.value++,
    };
    const fallbackExamples = buildFallbackExamples(item);
    item.examples = ensureAtLeastFourExamples([
      ...(inlineExamples.length ? inlineExamples : mappedExamples),
      ...fallbackExamples,
    ]);
    item.description =
      description ||
      buildGeneratedDescription({
        name,
        shortcut,
        hasValue,
        isGroup: false,
        examples: item.examples,
        childShortcuts,
      });
    item.flags = buildFlags(item);
    commands.push(compactObject(item));
  }

  if (hasSubcommands) {
    const thisNamePath = [...parentNamePath, name];
    for (const child of subcommandsNode.properties) {
      if (!ts.isPropertyAssignment(child)) continue;
      if (!ts.isObjectLiteralExpression(child.initializer)) continue;
      parseCommandObject(
        keyText(child.name),
        child.initializer,
        thisPath,
        thisNamePath,
        groups,
        commands,
        ordinal,
        examplesByShortcut
      );
    }
  }
}

function generate() {
  const sourceText = readSource(sourcePath);
  const sourceFile = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true);
  const propListObj =
    findObjectVariableInitializer(sourceFile, 'rawPropList') ||
    findObjectVariableInitializer(sourceFile, 'propList');
  const examplesByShortcut = findShortcutExamplesMap(sourceFile);

  if (!propListObj) {
    throw new Error('Could not find `propList` object literal in prop-list.ts');
  }

  const groups = [];
  const commands = [];
  const ordinal = { value: 1 };

  for (const prop of propListObj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (!ts.isObjectLiteralExpression(prop.initializer)) continue;
    parseCommandObject(keyText(prop.name), prop.initializer, [], [], groups, commands, ordinal, examplesByShortcut);
  }

  for (const cmd of commands) {
    if (Array.isArray(cmd.examples) && cmd.examples.length > 0) continue;
    cmd.examples = ensureAtLeastFourExamples(buildFallbackExamples(cmd));
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        generatedFrom: 'src/plugin/set-properties/prop-list.ts',
        generatedAt: new Date().toISOString(),
        counts: {
          groups: groups.length,
          commands: commands.length,
        },
        groups,
        commands,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  process.stdout.write(
    `Generated ${commands.length} commands and ${groups.length} groups -> ${path.relative(
      repoRoot,
      outputPath
    )}\n`
  );
}

generate();
