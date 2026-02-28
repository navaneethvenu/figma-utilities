export type TransformOrigin = 'tl' | 't' | 'tr' | 'l' | 'c' | 'r' | 'bl' | 'b' | 'br';

export const ORIGIN_TOKENS: readonly TransformOrigin[] = ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br'];

export function parseOriginToken(token: string): TransformOrigin | null {
  const match = token.trim().toLowerCase().match(/^([a-z]+):$/);
  if (!match) return null;

  const candidate = match[1] as TransformOrigin;
  return ORIGIN_TOKENS.includes(candidate) ? candidate : null;
}

export function splitOriginPrefixedToken(token: string): string[] {
  const match = token.trim().match(/^([a-z]{1,2}:)(.+)$/i);
  if (!match) return [token];

  const originToken = match[1].toLowerCase();
  const remainder = match[2];
  if (!parseOriginToken(originToken)) return [token];

  return [originToken, remainder];
}

export function getOriginLabel(origin: TransformOrigin) {
  switch (origin) {
    case 'tl':
      return 'Top Left';
    case 't':
      return 'Top';
    case 'tr':
      return 'Top Right';
    case 'l':
      return 'Left';
    case 'c':
      return 'Center';
    case 'r':
      return 'Right';
    case 'bl':
      return 'Bottom Left';
    case 'b':
      return 'Bottom';
    case 'br':
      return 'Bottom Right';
  }
}

function getOriginFactors(origin: TransformOrigin) {
  switch (origin) {
    case 'tl':
      return { ax: 0, ay: 0 };
    case 't':
      return { ax: 0.5, ay: 0 };
    case 'tr':
      return { ax: 1, ay: 0 };
    case 'l':
      return { ax: 0, ay: 0.5 };
    case 'c':
      return { ax: 0.5, ay: 0.5 };
    case 'r':
      return { ax: 1, ay: 0.5 };
    case 'bl':
      return { ax: 0, ay: 1 };
    case 'b':
      return { ax: 0.5, ay: 1 };
    case 'br':
      return { ax: 1, ay: 1 };
  }
}

function readFrame(node: SceneNode) {
  if (!('x' in node) || !('y' in node) || !('width' in node) || !('height' in node)) return null;

  const x = node.x;
  const y = node.y;
  const width = node.width;
  const height = node.height;

  if (![x, y, width, height].every((n) => Number.isFinite(n))) return null;
  return { x, y, width, height };
}

export function runWithOrigin(node: SceneNode, origin: TransformOrigin | undefined, operation: () => void) {
  if (!origin) {
    operation();
    return;
  }

  const before = readFrame(node);
  operation();
  const after = readFrame(node);
  if (!before || !after) return;

  const { ax, ay } = getOriginFactors(origin);
  const deltaW = after.width - before.width;
  const deltaH = after.height - before.height;

  node.x = before.x - deltaW * ax;
  node.y = before.y - deltaH * ay;
}
