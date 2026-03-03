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

export default function parseScopedScaleToken(token: string): ScopedScaleToken | null {
  const match = token.match(/^sc:((?:\+\+|--|\*\*|\/\/|\+|-|\*|\/)?)([wh])(.+)$/i);
  if (!match) return null;

  const mode = getMode(match[1]);
  if (!mode) return null;

  const axis = match[2].toLowerCase() as ScopedScaleAxis;
  const valueExpr = match[3];

  if (valueExpr.includes('..')) {
    const rangeMatch = valueExpr.match(/^(-?\d*\.?\d+)\.\.(-?\d*\.?\d+)$/);
    if (!rangeMatch) return null;
    if (mode.startsWith('seq_') || mode === 'cum_add') return null;

    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

    return { mode, axis, operandMode: 'range', start, end };
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

  return {
    mode,
    axis,
    operandMode: 'scalar',
    start,
    progressionOp,
    progressionValue,
  };
}
