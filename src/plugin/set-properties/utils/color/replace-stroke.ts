import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface StrokeCommandProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

export type StrokeTarget =
  | { kind: 'all' }
  | { kind: 'single'; index: number }
  | { kind: 'range'; start: number; end: number }
  | { kind: 'until'; end: number }
  | { kind: 'from'; start: number };

interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface PaintOptions {
  blendMode?: BlendMode;
  visible?: boolean;
}

interface SplitAlpha {
  base: string;
  alpha: number | null;
}

interface SplitOptions {
  base: string;
  options: PaintOptions;
}

const HEX_LENGTHS = [1, 2, 3, 4, 6, 8];
const BLEND_MODE_MAP: Record<string, BlendMode> = {
  n: 'NORMAL',
  normal: 'NORMAL',
  d: 'DARKEN',
  darken: 'DARKEN',
  m: 'MULTIPLY',
  multiply: 'MULTIPLY',
  lb: 'LINEAR_BURN',
  linearburn: 'LINEAR_BURN',
  cb: 'COLOR_BURN',
  colorburn: 'COLOR_BURN',
  l: 'LIGHTEN',
  lighten: 'LIGHTEN',
  s: 'SCREEN',
  screen: 'SCREEN',
  ld: 'LINEAR_DODGE',
  lineardodge: 'LINEAR_DODGE',
  cd: 'COLOR_DODGE',
  colordodge: 'COLOR_DODGE',
  o: 'OVERLAY',
  overlay: 'OVERLAY',
  sl: 'SOFT_LIGHT',
  softlight: 'SOFT_LIGHT',
  hl: 'HARD_LIGHT',
  hardlight: 'HARD_LIGHT',
  diff: 'DIFFERENCE',
  difference: 'DIFFERENCE',
  excl: 'EXCLUSION',
  exclusion: 'EXCLUSION',
  hue: 'HUE',
  sat: 'SATURATION',
  saturation: 'SATURATION',
  col: 'COLOR',
  color: 'COLOR',
  lum: 'LUMINOSITY',
  luminosity: 'LUMINOSITY',
};

function splitOptionsSuffix(value: string): SplitOptions | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const segments = trimmed.split(':');
  const base = segments[0];
  if (base === '') return null;

  if (segments.length === 1) return { base, options: {} };

  const options: PaintOptions = {};
  for (let i = 1; i < segments.length; i++) {
    const token = segments[i].trim().toLowerCase();
    if (token === '') return null;

    if (token === 'on' || token === 'show') {
      options.visible = true;
      continue;
    }
    if (token === 'off' || token === 'hide') {
      options.visible = false;
      continue;
    }

    const blendMode = BLEND_MODE_MAP[token];
    if (blendMode) {
      options.blendMode = blendMode;
      continue;
    }

    return null;
  }

  return { base, options };
}

function parseAlphaSegment(raw: string | null) {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (normalized === '') return null;

  const isPercent = normalized.endsWith('%');
  const numericText = isPercent ? normalized.slice(0, -1) : normalized;
  const value = Number(numericText);
  if (!Number.isFinite(value) || value < 0) return null;

  if (isPercent || value > 1) {
    if (value > 100) return null;
    return value / 100;
  }

  return value;
}

function splitAlphaSuffix(value: string): SplitAlpha | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const alphaMatch = trimmed.match(/@([0-9]*\.?[0-9]+%?)$/);
  if (!alphaMatch) return { base: trimmed, alpha: null };

  const alpha = parseAlphaSegment(alphaMatch[1]);
  if (alpha === null) return null;

  const base = trimmed.slice(0, alphaMatch.index);
  if (base === '') return null;
  return { base, alpha };
}

function expandHexColor(hex: string): ParsedColor | null {
  let clean = hex.replace(/^#/, '');
  if (!HEX_LENGTHS.includes(clean.length)) return null;
  if (!/^[0-9a-fA-F]+$/.test(clean)) return null;

  if (clean.length === 1) clean = clean.repeat(6);
  else if (clean.length === 2) clean = clean.repeat(3);
  else if (clean.length === 3)
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  else if (clean.length === 4)
    clean =
      clean
        .slice(0, 3)
        .split('')
        .map((c) => c + c)
        .join('') +
      clean[3] +
      clean[3];

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const a = clean.length === 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

export function parseStrokeTargetSegment(targetText: string): StrokeTarget | null {
  if (targetText === '') return { kind: 'all' };

  if (/^\d+$/.test(targetText)) {
    const index = Number(targetText);
    return index >= 1 ? { kind: 'single', index } : null;
  }

  const rangeMatch = targetText.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    return start >= 1 && end >= start ? { kind: 'range', start, end } : null;
  }

  const untilMatch = targetText.match(/^-(\d+)$/);
  if (untilMatch) {
    const end = Number(untilMatch[1]);
    return end >= 1 ? { kind: 'until', end } : null;
  }

  const fromMatch = targetText.match(/^(\d+)\+$/);
  if (fromMatch) {
    const start = Number(fromMatch[1]);
    return start >= 1 ? { kind: 'from', start } : null;
  }

  return null;
}

function shouldReplaceStrokeAt(target: StrokeTarget, index: number) {
  const oneBased = index + 1;

  switch (target.kind) {
    case 'all':
      return true;
    case 'single':
      return oneBased === target.index;
    case 'range':
      return oneBased >= target.start && oneBased <= target.end;
    case 'until':
      return oneBased <= target.end;
    case 'from':
      return oneBased >= target.start;
    default:
      return false;
  }
}

function splitTargetAndHex(base: string) {
  if (base.includes('#')) {
    const hashIndex = base.indexOf('#');
    const target = base.slice(0, hashIndex);
    const hex = base.slice(hashIndex + 1);
    return { target, hex };
  }

  for (const length of [8, 6, 4, 3, 2, 1]) {
    if (base.length < length) continue;
    const hex = base.slice(base.length - length);
    if (!/^[0-9a-fA-F]+$/.test(hex)) continue;
    const target = base.slice(0, base.length - length);
    return { target, hex };
  }

  return null;
}

function parseTargetedColor(value: string): { target: StrokeTarget; color: ParsedColor; options: PaintOptions } | null {
  const splitOptions = splitOptionsSuffix(value);
  if (!splitOptions) return null;

  const splitAlpha = splitAlphaSuffix(splitOptions.base);
  if (!splitAlpha) return null;

  const targetHex = splitTargetAndHex(splitAlpha.base);
  if (!targetHex) return null;

  const target = parseStrokeTargetSegment(targetHex.target);
  if (!target) return null;

  const parsedHex = expandHexColor(targetHex.hex);
  if (!parsedHex) return null;

  return {
    target,
    color: {
      r: parsedHex.r,
      g: parsedHex.g,
      b: parsedHex.b,
      a: splitAlpha.alpha !== null ? splitAlpha.alpha : parsedHex.a,
    },
    options: splitOptions.options,
  };
}

function parseColorOnly(value: string): { color: ParsedColor; options: PaintOptions } | null {
  const splitOptions = splitOptionsSuffix(value);
  if (!splitOptions) return null;

  const splitAlpha = splitAlphaSuffix(splitOptions.base);
  if (!splitAlpha) return null;

  const parsedHex = expandHexColor(splitAlpha.base);
  if (!parsedHex) return null;

  return {
    color: {
      r: parsedHex.r,
      g: parsedHex.g,
      b: parsedHex.b,
      a: splitAlpha.alpha !== null ? splitAlpha.alpha : parsedHex.a,
    },
    options: splitOptions.options,
  };
}

function parseIndexColor(value: string): { index: number; color: ParsedColor; options: PaintOptions } | null {
  const splitOptions = splitOptionsSuffix(value);
  if (!splitOptions) return null;

  const splitAlpha = splitAlphaSuffix(splitOptions.base);
  if (!splitAlpha) return null;

  const match = splitAlpha.base.match(/^(\d+)(#?[0-9a-fA-F]+)$/);
  if (!match) return null;

  const index = Number(match[1]);
  if (!Number.isFinite(index) || index < 1) return null;

  const parsedHex = expandHexColor(match[2]);
  if (!parsedHex) return null;

  return {
    index,
    color: {
      r: parsedHex.r,
      g: parsedHex.g,
      b: parsedHex.b,
      a: splitAlpha.alpha !== null ? splitAlpha.alpha : parsedHex.a,
    },
    options: splitOptions.options,
  };
}

function parseTargetOnly(value: string): StrokeTarget | null {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.includes('@') || trimmed.includes('#')) return null;
  return parseStrokeTargetSegment(trimmed);
}

function toSolidPaint(color: ParsedColor, options?: PaintOptions): SolidPaint {
  return {
    type: 'SOLID',
    color: { r: color.r, g: color.g, b: color.b },
    opacity: color.a,
    ...(options?.blendMode ? { blendMode: options.blendMode } : {}),
    ...(options?.visible !== undefined ? { visible: options.visible } : {}),
  };
}

function asSupportedNodeOrThrow(node: SceneNode): SupportedNodes & GeometryMixin {
  const nodeCheck = supportedNodes.find((type) => node.type === type);
  if (!nodeCheck) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Stroke is not applicable on node type ${node.type}`,
    });
  }
  const assertedNode = node as SupportedNodes;
  if (!('strokes' in assertedNode)) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Stroke is not applicable on node type ${node.type}`,
    });
  }
  return assertedNode as SupportedNodes & GeometryMixin;
}

function readStrokesOrThrow(node: SupportedNodes & GeometryMixin): readonly Paint[] {
  const strokes = node.strokes;
  if (!Array.isArray(strokes)) {
    throw new Error('Unsupported strokes');
  }
  return strokes;
}

export function isStrokeReplaceValue(value: string) {
  return parseTargetedColor(value) !== null;
}

export function isStrokeAddValue(value: string) {
  return parseColorOnly(value) !== null;
}

export function isStrokeInsertValue(value: string) {
  return parseIndexColor(value) !== null;
}

export function isStrokeDeleteValue(value: string) {
  return parseTargetOnly(value) !== null;
}

export default function setStroke({ param, value, nodes }: StrokeCommandProps) {
  const parsed = parseTargetedColor(value);
  if (!parsed) {
    notifyError({ type: ErrorType.INVALID_VAL, message: `${param}${value}` });
    return;
  }

  for (const node of nodes) {
    const assertedNode = asSupportedNodeOrThrow(node);
    try {
      const strokes = readStrokesOrThrow(assertedNode);
      const nextStrokes = strokes.map((paint, index) => {
        if (!shouldReplaceStrokeAt(parsed.target, index)) return paint;
        return toSolidPaint(parsed.color, parsed.options);
      });
      assertedNode.strokes = nextStrokes;
    } catch {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Cannot apply stroke on node type ${node.type}`,
      });
    }
  }
}

export function addStroke({ param, value, nodes }: StrokeCommandProps) {
  const parsed = parseColorOnly(value);
  if (!parsed) {
    notifyError({ type: ErrorType.INVALID_VAL, message: `${param}${value}` });
    return;
  }

  for (const node of nodes) {
    const assertedNode = asSupportedNodeOrThrow(node);
    try {
      const strokes = readStrokesOrThrow(assertedNode);
      assertedNode.strokes = [...strokes, toSolidPaint(parsed.color, parsed.options)];
    } catch {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Cannot add stroke on node type ${node.type}`,
      });
    }
  }
}

export function insertStroke({ param, value, nodes }: StrokeCommandProps) {
  const parsed = parseIndexColor(value);
  if (!parsed) {
    notifyError({ type: ErrorType.INVALID_VAL, message: `${param}${value}` });
    return;
  }

  for (const node of nodes) {
    const assertedNode = asSupportedNodeOrThrow(node);
    try {
      const strokes = readStrokesOrThrow(assertedNode);
      if (parsed.index > strokes.length + 1) {
        notifyError({
          type: ErrorType.INVALID_VAL,
          message: `${param}${value}`,
        });
        continue;
      }

      const insertAt = parsed.index - 1;
      const nextStrokes = [...strokes.slice(0, insertAt), toSolidPaint(parsed.color, parsed.options), ...strokes.slice(insertAt)];
      assertedNode.strokes = nextStrokes;
    } catch {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Cannot insert stroke on node type ${node.type}`,
      });
    }
  }
}

export function deleteStroke({ param, value, nodes }: StrokeCommandProps) {
  const target = parseTargetOnly(value);
  if (!target) {
    notifyError({ type: ErrorType.INVALID_VAL, message: `${param}${value}` });
    return;
  }

  for (const node of nodes) {
    const assertedNode = asSupportedNodeOrThrow(node);
    try {
      const strokes = readStrokesOrThrow(assertedNode);
      const nextStrokes = strokes.filter((_, index) => !shouldReplaceStrokeAt(target, index));
      assertedNode.strokes = nextStrokes;
    } catch {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Cannot delete stroke on node type ${node.type}`,
      });
    }
  }
}
