import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface setFillProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

// Helper to expand shorthand hex and parse to RGB(A)
function parseHexColor(hex: string) {
  let clean = hex.replace(/^#/, '');
  if (![1, 2, 3, 4, 6, 8].includes(clean.length)) return null;

  // Expand shorthand
  if (clean.length === 1) clean = clean.repeat(6); // e.g., "1" → "111111"
  else if (clean.length === 2) clean = clean.repeat(3); // e.g., "12" → "121212"
  else if (clean.length === 3)
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  // "123" → "112233"
  else if (clean.length === 4)
    clean =
      clean
        .slice(0, 3)
        .split('')
        .map((c) => c + c)
        .join('') +
      clean[3] +
      clean[3]; // "123A" → "112233AA"

  let r = parseInt(clean.slice(0, 2), 16) / 255;
  let g = parseInt(clean.slice(2, 4), 16) / 255;
  let b = parseInt(clean.slice(4, 6), 16) / 255;
  let a = clean.length === 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1;

  return { r, g, b, a };
}

export default function setFill({ param, value, nodes }: setFillProps) {
  const color = parseHexColor(value);

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    const assertedNode = node as SupportedNodes;

    if (!nodeCheck) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Fill is not applicable on node type ${node.type}`,
      });
      continue;
    }

    if (!color) {
      notifyError({
        type: ErrorType.INVALID_VAL,
        message: param,
      });
      continue;
    }

    try {
      assertedNode.fills = [
        {
          type: 'SOLID',
          color: { r: color.r, g: color.g, b: color.b },
          opacity: color.a,
        },
      ];
    } catch (e) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Cannot apply fill on node type ${node.type}`,
      });
    }
  }
}
