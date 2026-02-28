import parameterRouting from '../param-routing';
import parseModifiedToken, { ModifiedToken } from './parse-modified-token';
import { ErrorType } from '../../utils/errorType';

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isAutoLayoutContainer(node: SceneNode): node is SceneNode & AutoLayoutMixin {
  return 'layoutMode' in node && 'itemSpacing' in node;
}

function getPaddingValue(node: SceneNode, command: string): number | null {
  if (!('layoutMode' in node) || node.layoutMode === 'NONE') return null;

  if (command === 'p') return asFiniteNumber(node.paddingLeft);
  if (command === 'pl') return asFiniteNumber(node.paddingLeft);
  if (command === 'pr') return asFiniteNumber(node.paddingRight);
  if (command === 'pt') return asFiniteNumber(node.paddingTop);
  if (command === 'pb') return asFiniteNumber(node.paddingBottom);
  if (command === 'px') return asFiniteNumber(node.paddingLeft);
  if (command === 'py') return asFiniteNumber(node.paddingTop);

  return null;
}

function getGapValue(node: SceneNode, command: string): number | null {
  if (!isAutoLayoutContainer(node) || node.layoutMode === 'NONE') return null;

  if (command === 'gap') return asFiniteNumber(node.itemSpacing);

  if (command === 'gapx') {
    if (node.layoutMode === 'HORIZONTAL') return asFiniteNumber(node.itemSpacing);
    if (node.layoutWrap === 'WRAP' && node.counterAxisSpacing !== null) return asFiniteNumber(node.counterAxisSpacing);
    return null;
  }

  if (command === 'gapy') {
    if (node.layoutMode === 'VERTICAL') return asFiniteNumber(node.itemSpacing);
    if (node.layoutWrap === 'WRAP' && node.counterAxisSpacing !== null) return asFiniteNumber(node.counterAxisSpacing);
    return null;
  }

  return null;
}

function getCurrentValue(node: SceneNode, command: string): number | null {
  if (command === 'h') return 'height' in node ? node.height : null;
  if (command === 'w') return 'width' in node ? node.width : null;
  if (command === 'x') return 'x' in node ? node.x : null;
  if (command === 'y') return 'y' in node ? node.y : null;
  if (command === 'op') return 'opacity' in node ? node.opacity * 100 : null;
  if (command === 'rot') return 'rotation' in node ? asFiniteNumber(node.rotation) : null;

  if (command === 'r') return 'cornerRadius' in node ? asFiniteNumber(node.cornerRadius) : null;
  if (command === 'rtl') return 'topLeftRadius' in node ? asFiniteNumber(node.topLeftRadius) : null;
  if (command === 'rtr') return 'topRightRadius' in node ? asFiniteNumber(node.topRightRadius) : null;
  if (command === 'rbl') return 'bottomLeftRadius' in node ? asFiniteNumber(node.bottomLeftRadius) : null;
  if (command === 'rbr') return 'bottomRightRadius' in node ? asFiniteNumber(node.bottomRightRadius) : null;
  if (command === 'rt') return 'topLeftRadius' in node ? asFiniteNumber(node.topLeftRadius) : null;
  if (command === 'rb') return 'bottomLeftRadius' in node ? asFiniteNumber(node.bottomLeftRadius) : null;
  if (command === 'rl') return 'topLeftRadius' in node ? asFiniteNumber(node.topLeftRadius) : null;
  if (command === 'rr') return 'topRightRadius' in node ? asFiniteNumber(node.topRightRadius) : null;

  if (command === 'st') return 'strokeWeight' in node ? asFiniteNumber(node.strokeWeight) : null;
  if (command === 'stl') return 'strokeLeftWeight' in node ? asFiniteNumber(node.strokeLeftWeight) : null;
  if (command === 'str') return 'strokeRightWeight' in node ? asFiniteNumber(node.strokeRightWeight) : null;
  if (command === 'stt') return 'strokeTopWeight' in node ? asFiniteNumber(node.strokeTopWeight) : null;
  if (command === 'stb') return 'strokeBottomWeight' in node ? asFiniteNumber(node.strokeBottomWeight) : null;
  if (command === 'stx') return 'strokeLeftWeight' in node ? asFiniteNumber(node.strokeLeftWeight) : null;
  if (command === 'sty') return 'strokeTopWeight' in node ? asFiniteNumber(node.strokeTopWeight) : null;

  if (command === 'p' || command === 'pl' || command === 'pr' || command === 'pt' || command === 'pb' || command === 'px' || command === 'py') {
    return getPaddingValue(node, command);
  }

  if (command === 'gap' || command === 'gapx' || command === 'gapy') return getGapValue(node, command);

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

function rangeTouchesOrCrossesZero(start: number, end: number) {
  if (start === 0 || end === 0) return true;
  return (start < 0 && end > 0) || (start > 0 && end < 0);
}

export async function applyModifiedCommand(tokenText: string, nodes: readonly SceneNode[]) {
  const token = parseModifiedToken(tokenText);
  if (!token) {
    throw new Error(`${ErrorType.INVALID_CMD}: ${tokenText}`);
  }

  if ((token.mode === 'div' || token.mode === 'seq_div') && token.start === 0) {
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
    const current = getCurrentValue(node, token.command);
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
