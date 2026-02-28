import parameterRouting from '../param-routing';
import parseModifiedToken, { ModifiedToken } from './parse-modified-token';
import { ErrorType } from '../../utils/errorType';

function getCurrentValue(node: SceneNode, command: string): number | null {
  if (command === 'h') return 'height' in node ? node.height : null;
  if (command === 'w') return 'width' in node ? node.width : null;
  if (command === 'x') return 'x' in node ? node.x : null;
  if (command === 'y') return 'y' in node ? node.y : null;
  if (command === 'op') return 'opacity' in node ? node.opacity * 100 : null;

  return null;
}

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
  const op = roundOperand(operand);

  switch (token.mode) {
    case 'set':
      return op;
    case 'add':
      return current + op;
    case 'sub':
      return current - op;
    case 'mul':
      return current * op;
    case 'div':
      return current / op;
    case 'seq_add':
      return current + op * (i + 1);
    case 'seq_sub':
      return current - op * (i + 1);
    case 'seq_mul':
      return current * Math.pow(op, i + 1);
    case 'seq_div':
      return current / Math.pow(op, i + 1);
  }
}

export async function applyModifiedCommand(tokenText: string, nodes: readonly SceneNode[]) {
  const token = parseModifiedToken(tokenText);
  if (!token) {
    throw new Error(`${ErrorType.INVALID_CMD}: ${tokenText}`);
  }

  if ((token.mode === 'div' || token.mode === 'seq_div') && token.start === 0) {
    throw new Error(`${ErrorType.INVALID_VAL}: ${tokenText}`);
  }

  const orderedNodes = sortSelectionByLayerIndex(nodes);
  const n = orderedNodes.length;

  for (let i = 0; i < n; i++) {
    const node = orderedNodes[i];
    const current = getCurrentValue(node, token.command);
    if (current === null) continue;

    const next = computeTarget(current, i, n, token);
    if (!Number.isFinite(next)) {
      throw new Error(`${ErrorType.INVALID_VAL}: ${tokenText}`);
    }

    const matched = await parameterRouting({
      param: token.command,
      value: String(roundOperand(next)),
      nodes: [node],
    });

    if (!matched) {
      throw new Error(`${ErrorType.INVALID_CMD}: ${tokenText}`);
    }
  }
}
