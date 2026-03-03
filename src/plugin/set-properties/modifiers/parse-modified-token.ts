export type ModifierMode =
  | 'set'
  | 'add'
  | 'sub'
  | 'mul'
  | 'div'
  | 'seq_sub'
  | 'seq_mul'
  | 'seq_div'
  | 'cum_add';
export type OperandMode = 'scalar' | 'range';

export interface ModifiedToken {
  mode: ModifierMode;
  command: string;
  operandMode: OperandMode;
  start: number;
  end?: number;
  expressionOp?: '+' | '-' | '*' | '/';
  expressionOperandMode?: OperandMode;
  expressionStart?: number;
  expressionEnd?: number;
  progressionOp?: '+' | '-' | '*' | '/';
  progressionValue?: number;
}

function parseOperator(token: string): { operator: string; rest: string } {
  const doubleOps = ['++', '--', '**', '//'];
  for (const op of doubleOps) {
    if (token.startsWith(op)) return { operator: op, rest: token.slice(op.length) };
  }

  const singleOps = ['+', '-', '*', '/'];
  for (const op of singleOps) {
    if (token.startsWith(op)) return { operator: op, rest: token.slice(op.length) };
  }

  return { operator: '', rest: token };
}

function getMode(operator: string): ModifierMode | null {
  switch (operator) {
    case '':
      return 'set';
    case '+':
      return 'add';
    case '-':
      return 'sub';
    case '*':
      return 'mul';
    case '/':
      return 'div';
    case '++':
      return 'cum_add';
    case '--':
      return 'seq_sub';
    case '**':
      return 'seq_mul';
    case '//':
      return 'seq_div';
    default:
      return null;
  }
}

function isSequentialMode(mode: ModifierMode) {
  return mode.startsWith('seq_') || mode === 'cum_add';
}

function parseOperandExpr(value: string): { mode: OperandMode; start: number; end?: number } | null {
  const rangeMatch = value.match(/^(-?\d*\.?\d+)\.\.(-?\d*\.?\d+)$/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return { mode: 'range', start, end };
  }

  const scalarMatch = value.match(/^(-?\d*\.?\d+)$/);
  if (scalarMatch) {
    const start = Number(scalarMatch[1]);
    if (!Number.isFinite(start)) return null;
    return { mode: 'scalar', start };
  }

  return null;
}

export default function parseModifiedToken(token: string): ModifiedToken | null {
  const { operator, rest } = parseOperator(token);
  const mode = getMode(operator);
  if (!mode) return null;

  const match = rest.match(/^([A-Za-z]+(?::[A-Za-z]+)?)(.+)$/);
  if (!match) return null;

  const command = match[1];
  const valueExpr = match[2];

  const expressionMatch = valueExpr.match(/^(-?\d*\.?\d+(?:\.\.-?\d*\.?\d+)?)([+\-*/])(-?\d*\.?\d+(?:\.\.-?\d*\.?\d+)?)$/);
  if (expressionMatch && isSequentialMode(mode)) {
    const lhs = parseOperandExpr(expressionMatch[1]);
    const rhs = parseOperandExpr(expressionMatch[3]);
    const expressionOp = expressionMatch[2] as '+' | '-' | '*' | '/';
    if (!lhs || !rhs) return null;

    const hasRange = lhs.mode === 'range' || rhs.mode === 'range';
    if (hasRange) {
      return {
        mode,
        command,
        operandMode: lhs.mode,
        start: lhs.start,
        end: lhs.end,
        expressionOp,
        expressionOperandMode: rhs.mode,
        expressionStart: rhs.start,
        expressionEnd: rhs.end,
      };
    }
  }

  const scalarMatch = valueExpr.match(/^(-?\d*\.?\d+)(?:([+\-*/])(-?\d*\.?\d+))?$/);
  if (!scalarMatch) return null;

  const scalar = Number(scalarMatch[1]);
  if (!Number.isFinite(scalar)) return null;
  const progressionOp = scalarMatch[2] as '+' | '-' | '*' | '/' | undefined;
  const progressionValue = scalarMatch[3] !== undefined ? Number(scalarMatch[3]) : undefined;
  if (progressionOp !== undefined) {
    if (!(mode.startsWith('seq_') || mode === 'cum_add')) return null;
    if (progressionValue === undefined || !Number.isFinite(progressionValue)) return null;
    if (progressionOp === '/' && progressionValue === 0) return null;
  }

  if (valueExpr.includes('..')) {
    const parsedOperand = parseOperandExpr(valueExpr);
    if (!parsedOperand || parsedOperand.mode !== 'range') return null;
    return {
      mode,
      command,
      operandMode: 'range',
      start: parsedOperand.start,
      end: parsedOperand.end,
    };
  }

  return {
    mode,
    command,
    operandMode: 'scalar',
    start: scalar,
    progressionOp,
    progressionValue,
  };
}
