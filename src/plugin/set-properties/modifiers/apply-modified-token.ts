import parameterRouting from '../param-routing';
import parseModifiedToken, { ModifiedToken } from './parse-modified-token';
import { ErrorType } from '../../utils/errorType';
import { flattenCommands, propList } from '../prop-list';
import { TransformOrigin } from '../origin';

const flattenedCommands = flattenCommands(propList, {});

function sortSelectionByLayerIndex(nodes: readonly SceneNode[]) {
  const groups = new Map<string, { parent: BaseNode & ChildrenMixin; nodes: SceneNode[] }>();
  const ordered: SceneNode[] = [];

  for (const node of nodes) {
    const parent = node.parent;
    if (!parent || !('children' in parent)) {
      ordered.push(node);
      continue;
    }

    if (!groups.has(parent.id)) groups.set(parent.id, { parent, nodes: [] });
    groups.get(parent.id)!.nodes.push(node);
  }

  for (const group of groups.values()) {
    group.nodes.sort((a, b) => group.parent.children.indexOf(a) - group.parent.children.indexOf(b));
    ordered.push(...group.nodes);
  }

  return ordered;
}

function interpolate(start: number, end: number, i: number, n: number) {
  if (n <= 1) return start;
  return start + ((end - start) * i) / (n - 1);
}

function roundOperand(value: number) {
  // keep stable numeric strings and avoid floating point noise
  return Number(value.toFixed(6));
}

function computeTarget(current: number, i: number, n: number, token: ModifiedToken): number {
  const operand =
    token.operandMode === 'range' ? interpolate(token.start, token.end as number, i, n) : token.start;
  const base = roundOperand(operand);
  const decay = token.decay ?? 1;
  const seqOperand = roundOperand(base / Math.pow(decay, i));

  switch (token.mode) {
    case 'set':
      return base;
    case 'add':
      return current + base;
    case 'sub':
      return current - base;
    case 'mul':
      return current * base;
    case 'div':
      return current / base;
    case 'seq_add':
      return current + seqOperand;
    case 'seq_sub':
      return current - seqOperand;
    case 'seq_mul':
      return current * seqOperand;
    case 'seq_div':
      return current / seqOperand;
  }
}

function rangeTouchesOrCrossesZero(start: number, end: number) {
  if (start === 0 || end === 0) return true;
  return (start < 0 && end > 0) || (start > 0 && end < 0);
}

export async function applyModifiedCommand(
  tokenText: string,
  nodes: readonly SceneNode[],
  origin?: TransformOrigin
) {
  const token = parseModifiedToken(tokenText);
  if (!token) {
    throw new Error(`${ErrorType.INVALID_CMD}: ${tokenText}`);
  }
  const command = flattenedCommands[token.command];
  if (!command?.supportsModifiers || !command.getModifierValue) {
    throw new Error(`${ErrorType.INVALID_CMD}: ${tokenText}`);
  }

  if ((token.mode === 'div' || token.mode === 'seq_div') && token.start === 0) {
    throw new Error(`${ErrorType.INVALID_VAL}: ${tokenText}`);
  }
  if (token.decay !== undefined && token.decay <= 0) {
    throw new Error(`${ErrorType.INVALID_VAL}: ${tokenText}`);
  }
  if (
    token.mode === 'div' &&
    token.operandMode === 'range' &&
    token.end !== undefined &&
    rangeTouchesOrCrossesZero(token.start, token.end)
  ) {
    throw new Error(`${ErrorType.INVALID_VAL}: ${tokenText}`);
  }

  const orderedNodes = sortSelectionByLayerIndex(nodes);
  const n = orderedNodes.length;
  let appliedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < n; i++) {
    const node = orderedNodes[i];
    const current = command.getModifierValue(node);
    if (current === null) {
      skippedCount++;
      continue;
    }

    const next = computeTarget(current, i, n, token);
    if (!Number.isFinite(next)) {
      throw new Error(`${ErrorType.INVALID_VAL}: ${tokenText}`);
    }

    const matched = await parameterRouting({
      param: token.command,
      value: String(roundOperand(next)),
      nodes: [node],
      origin,
    });

    if (!matched) {
      throw new Error(`${ErrorType.INVALID_CMD}: ${tokenText}`);
    }

    appliedCount++;
  }

  if (appliedCount === 0) {
    throw new Error(`${ErrorType.UNSUPPORTED_PROP}: ${token.command} is not applicable to current selection`);
  }

  if (skippedCount > 0) {
    figma.notify(`${token.command}: skipped ${skippedCount} unsupported node(s)`);
  }
}
