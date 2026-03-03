export type ScopedScaleAxis = 'w' | 'h';
export type ScopedScaleMode =
  | 'set'
  | 'add'
  | 'sub'
  | 'mul'
  | 'div'
  | 'seq_sub'
  | 'seq_mul'
  | 'seq_div'
  | 'cum_add';
export type ScopedScaleOperandMode = 'scalar' | 'range';

export interface ScopedScaleToken {
  mode: ScopedScaleMode;
  axis: ScopedScaleAxis;
  operandMode: ScopedScaleOperandMode;
  start: number;
  end?: number;
  expressionOp?: '+' | '-' | '*' | '/';
  expressionOperandMode?: ScopedScaleOperandMode;
  expressionStart?: number;
  expressionEnd?: number;
  progressionOp?: '+' | '-' | '*' | '/';
  progressionValue?: number;
}

function getMode(operator: string): ScopedScaleMode | null {
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

function isSequentialMode(mode: ScopedScaleMode) {
  return mode.startsWith('seq_') || mode === 'cum_add';
}

function parseOperandExpr(value: string): { mode: ScopedScaleOperandMode; start: number; end?: number } | null {
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

export default function parseScopedScaleToken(token: string): ScopedScaleToken | null {
  const match = token.match(/^sc:((?:\+\+|--|\*\*|\/\/|\+|-|\*|\/)?)([wh])(.+)$/i);
  if (!match) return null;

  const mode = getMode(match[1]);
  if (!mode) return null;

  const axis = match[2].toLowerCase() as ScopedScaleAxis;
  const valueExpr = match[3];

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
        axis,
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

  const start = Number(scalarMatch[1]);
  if (!Number.isFinite(start)) return null;

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
    return { mode, axis, operandMode: 'range', start: parsedOperand.start, end: parsedOperand.end };
  }

  return {
    mode,
    axis,
    operandMode: 'scalar',
    start,
    progressionOp,
    progressionValue,
  };
}
