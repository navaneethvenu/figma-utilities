import { addHistory } from './history';
import parameterRouting from './param-routing';
import parseParameters from './parse-params';
import { ErrorType } from '../utils/errorType';
import { applyModifiedCommand } from './modifiers/apply-modified-token';
import { applyScopedScaleCommand } from './modifiers/apply-scoped-scale-token';
import { parseOriginToken, TransformOrigin } from './origin';
import applyTextCommand from './utils/text/apply-text-command';
import { flattenCommands, propList } from './prop-list';
import { ParsedParameter } from './parse-params';

interface LoopScope {
  length: number;
  index: number;
  name: string;
  id: string;
}

interface EachSpec {
  start?: number;
  end?: number;
  body: string;
}

const flatCommands = flattenCommands(propList, {});

function asActiveNode(node: SceneNode): SceneNode | null {
  return 'removed' in node && node.removed ? null : node;
}

function dedupeSelection(nodes: readonly SceneNode[]) {
  const unique = new Map<string, SceneNode>();
  for (const node of nodes) {
    const activeNode = asActiveNode(node);
    if (!activeNode) continue;
    if (!unique.has(activeNode.id)) unique.set(activeNode.id, activeNode);
  }
  return Array.from(unique.values());
}

function parseEachToken(token: string): EachSpec | null {
  if (!token.startsWith('each')) return null;

  let index = 4;
  let start: number | undefined;
  let end: number | undefined;

  if (token[index] !== '(') {
    const rangeMatch = token.slice(index).match(/^(-?\d+)\.\.(-?\d+)\(/);
    if (!rangeMatch) return null;
    start = Number(rangeMatch[1]);
    end = Number(rangeMatch[2]);
    index += rangeMatch[0].length - 1;
  }

  if (token[index] !== '(' || !token.endsWith(')')) return null;

  let inQuotes = false;
  let escaped = false;
  let depth = 0;
  let closeIndex = -1;

  for (let i = index; i < token.length; i++) {
    const ch = token[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;

    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) {
        closeIndex = i;
        break;
      }
      if (depth < 0) return null;
    }
  }

  if (closeIndex !== token.length - 1) return null;
  const body = token.slice(index + 1, closeIndex).trim();
  if (body === '') return null;

  return { start, end, body };
}

function resolveLoopVariable(dollarCount: number, key: keyof LoopScope | 'n' | 'i', stack: readonly LoopScope[]) {
  const target = stack[stack.length - dollarCount];
  if (!target) return '';
  const scopeKey: keyof LoopScope = key === 'n' ? 'name' : key === 'i' ? 'index' : key;
  return String(target[scopeKey]);
}

function substituteLoopVariables(input: string, stack: readonly LoopScope[]) {
  if (stack.length === 0) return input;
  return input.replace(/(\$+)(n|i|name|id)\b/g, (_whole, dollars: string, key: keyof LoopScope) =>
    resolveLoopVariable(dollars.length, key, stack)
  );
}

async function executeParsedParams(parsedParams: ParsedParameter[], scopes: readonly LoopScope[]): Promise<number> {
  let currentOrigin: TransformOrigin | undefined;
  let executableCount = 0;

  for (const {
    param,
    value,
    raw,
    modified,
    scopedScaleModifier,
    originModifier,
    textCommand,
    eachCommand,
  } of parsedParams) {
    const currentSelection = figma.currentPage.selection ?? [];

    if (originModifier) {
      const parsedOrigin = parseOriginToken(raw ?? param);
      if (!parsedOrigin) {
        throw new Error(`${ErrorType.INVALID_VAL}: ${raw ?? param}`);
      }
      currentOrigin = parsedOrigin;
      continue;
    }

    if (eachCommand) {
      const eachToken = raw ?? param;
      const parsedEach = parseEachToken(eachToken);
      if (!parsedEach) {
        throw new Error(`${ErrorType.INVALID_VAL}: ${eachToken}`);
      }

      const selectionSnapshot = dedupeSelection(currentSelection);
      const loopValues =
        parsedEach.start !== undefined && parsedEach.end !== undefined
          ? (() => {
              const values: number[] = [];
              const step = parsedEach.start <= parsedEach.end ? 1 : -1;
              for (let n = parsedEach.start; step > 0 ? n <= parsedEach.end : n >= parsedEach.end; n += step) {
                values.push(n);
              }
              return values;
            })()
          : null;

      if (!loopValues && selectionSnapshot.length === 0) {
        throw new Error('No nodes selected.');
      }

      const collectedSelection: SceneNode[] = [];
      if (loopValues) {
        const length = loopValues.length;
        for (let i = 0; i < length; i++) {
          const valueAtIndex = loopValues[i];
          const loopScope: LoopScope = {
            length,
            index: i,
            name: String(valueAtIndex),
            id: String(valueAtIndex),
          };

          figma.currentPage.selection = selectionSnapshot;
          const renderedBody = substituteLoopVariables(parsedEach.body, [...scopes, loopScope]);
          const nestedParams = parseParameters({ each: renderedBody });
          const nestedCount = await executeParsedParams(nestedParams, [...scopes, loopScope]);
          if (nestedCount === 0) {
            throw new Error(`${ErrorType.INVALID_CMD}: each body produced no commands`);
          }
          collectedSelection.push(...(figma.currentPage.selection ?? []));
        }
      } else {
        const length = selectionSnapshot.length;
        for (let i = 0; i < length; i++) {
          const loopNode = selectionSnapshot[i];
          const activeNode = asActiveNode(loopNode);
          if (!activeNode) continue;

          const loopScope: LoopScope = {
            length,
            index: i,
            name: activeNode.name,
            id: activeNode.id,
          };

          figma.currentPage.selection = [activeNode];
          const renderedBody = substituteLoopVariables(parsedEach.body, [...scopes, loopScope]);
          const nestedParams = parseParameters({ each: renderedBody });
          const nestedCount = await executeParsedParams(nestedParams, [...scopes, loopScope]);
          if (nestedCount === 0) {
            throw new Error(`${ErrorType.INVALID_CMD}: each body produced no commands`);
          }
          collectedSelection.push(...(figma.currentPage.selection ?? []));
        }
      }

      figma.currentPage.selection = dedupeSelection(collectedSelection);
      executableCount++;
      continue;
    }

    if (modified) {
      if (currentSelection.length === 0) throw new Error('No nodes selected.');
      await applyModifiedCommand(raw ?? param, currentSelection, currentOrigin);
      executableCount++;
      continue;
    }

    if (scopedScaleModifier) {
      if (currentSelection.length === 0) throw new Error('No nodes selected.');
      await applyScopedScaleCommand(raw ?? param, currentSelection, currentOrigin);
      executableCount++;
      continue;
    }

    if (textCommand) {
      if (currentSelection.length === 0) throw new Error('No nodes selected.');
      await applyTextCommand(raw ?? param, currentSelection);
      executableCount++;
      continue;
    }

    const commandDef = flatCommands[param];
    const requiresSelection = commandDef ? commandDef.requiresSelection !== false : true;
    if (requiresSelection && currentSelection.length === 0) throw new Error('No nodes selected.');

    const matched = await parameterRouting({ param, value, nodes: currentSelection, origin: currentOrigin });
    if (!matched) {
      throw new Error(`${ErrorType.INVALID_CMD}: ${param}${value}`);
    }
    executableCount++;
  }

  return executableCount;
}

export default async function setProperties(parameters: { [key: string]: string }) {
  try {
    const parsedParams = parseParameters(parameters);
    const executableCount = await executeParsedParams(parsedParams, []);

    if (executableCount === 0) {
      throw new Error(`${ErrorType.INVALID_CMD}: origin modifier requires a following command`);
    }

    await addHistory(parsedParams);
    figma.commitUndo();

    figma.notify('Properties set successfully.');
  } catch (e: any) {
    console.log(e);
    figma.notify(e.message);
  }
}
