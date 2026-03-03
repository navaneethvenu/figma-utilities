import { flattenCommands, propList } from '../prop-list';
import parameterRouting from '../param-routing';
import { ErrorType } from '../../utils/errorType';
import { TransformOrigin } from '../origin';
import parseScopedScaleToken, { ScopedScaleToken } from './parse-scoped-scale-token';

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
  return Number(value.toFixed(6));
}

function progressionValueAtIndex(base: number, i: number, token: ScopedScaleToken) {
  if (!token.progressionOp || token.progressionValue === undefined) return base;

  switch (token.progressionOp) {
    case '+':
      return base + token.progressionValue * i;
    case '-':
      return base - token.progressionValue * i;
    case '*':
      return base * Math.pow(token.progressionValue, i);
    case '/':
      return base / Math.pow(token.progressionValue, i);
  }
}

function applyBinaryOp(left: number, right: number, op: '+' | '-' | '*' | '/') {
  switch (op) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
  }
}

function operandAtIndex(i: number, n: number, token: ScopedScaleToken) {
  const leftRaw =
    token.operandMode === 'range' ? interpolate(token.start, token.end as number, i, n) : token.start;
  let raw = leftRaw;

  if (
    token.expressionOp &&
    token.expressionOperandMode &&
    token.expressionStart !== undefined
  ) {
    const rightRaw =
      token.expressionOperandMode === 'range'
        ? interpolate(token.expressionStart, token.expressionEnd as number, i, n)
        : token.expressionStart;
    raw = applyBinaryOp(leftRaw, rightRaw, token.expressionOp);
  }

  const base = roundOperand(raw);
  return roundOperand(progressionValueAtIndex(base, i, token));
}

function cumulativeProgressionValue(i: number, n: number, token: ScopedScaleToken) {
  let sum = 0;
  for (let j = 0; j <= i; j++) {
    sum += operandAtIndex(j, n, token);
  }
  return roundOperand(sum);
}

function cumulativeProgressionProduct(i: number, n: number, token: ScopedScaleToken) {
  let product = 1;
  for (let j = 0; j <= i; j++) {
    product *= operandAtIndex(j, n, token);
  }
  return roundOperand(product);
}

function computeTarget(current: number, i: number, n: number, token: ScopedScaleToken): number {
  const base = operandAtIndex(i, n, token);
  const cumOperand = cumulativeProgressionValue(i, n, token);
  const cumProductOperand = cumulativeProgressionProduct(i, n, token);

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
    case 'seq_sub':
      return current - cumOperand;
    case 'seq_mul':
      return current * cumProductOperand;
    case 'seq_div':
      return current / cumProductOperand;
    case 'cum_add':
      return current + cumOperand;
  }
}

function rangeTouchesOrCrossesZero(start: number, end: number) {
  if (start === 0 || end === 0) return true;
  return (start < 0 && end > 0) || (start > 0 && end < 0);
}

export async function applyScopedScaleCommand(
  tokenText: string,
  nodes: readonly SceneNode[],
  origin?: TransformOrigin
) {
  const token = parseScopedScaleToken(tokenText);
  if (!token) {
    throw new Error(`${ErrorType.INVALID_CMD}: ${tokenText}`);
  }

  const commandKey = `sc:${token.axis}`;
  const command = flattenedCommands[commandKey];
  if (!command?.supportsModifiers || !command.getModifierValue) {
    throw new Error(`${ErrorType.INVALID_CMD}: ${tokenText}`);
  }

  if ((token.mode === 'div' || token.mode === 'seq_div') && token.start === 0) {
    throw new Error(`${ErrorType.INVALID_VAL}: ${tokenText}`);
  }
  if (token.progressionOp === '/' && token.progressionValue === 0) {
    throw new Error(`${ErrorType.INVALID_VAL}: ${tokenText}`);
  }
  if (token.expressionOp === '/' && token.expressionOperandMode === 'scalar' && token.expressionStart === 0) {
    throw new Error(`${ErrorType.INVALID_VAL}: ${tokenText}`);
  }
  if (
    token.expressionOp === '/' &&
    token.expressionOperandMode === 'range' &&
    token.expressionStart !== undefined &&
    token.expressionEnd !== undefined &&
    rangeTouchesOrCrossesZero(token.expressionStart, token.expressionEnd)
  ) {
    throw new Error(`${ErrorType.INVALID_VAL}: ${tokenText}`);
  }
  if (
    (token.mode === 'div' || token.mode === 'seq_div') &&
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

    const nextTarget = computeTarget(current, i, n, token);
    if (!Number.isFinite(nextTarget)) {
      throw new Error(`${ErrorType.INVALID_VAL}: ${tokenText}`);
    }

    const matched = await parameterRouting({
      param: commandKey,
      value: String(roundOperand(nextTarget)),
      nodes: [node],
      origin,
    });

    if (!matched) {
      throw new Error(`${ErrorType.INVALID_CMD}: ${tokenText}`);
    }

    appliedCount++;
  }

  if (appliedCount === 0) {
    throw new Error(`${ErrorType.UNSUPPORTED_PROP}: ${commandKey} is not applicable to current selection`);
  }

  if (skippedCount > 0) {
    figma.notify(`${commandKey}: skipped ${skippedCount} unsupported node(s)`);
  }
}
