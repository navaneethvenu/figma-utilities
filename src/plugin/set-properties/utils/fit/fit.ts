import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';
import { ensureAbsolutePositioning } from '../node-safety';

interface FitProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

function parseAxisValue(value: string): 'both' | 'width' | 'height' | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === '') return 'both';
  if (normalized === 'w') return 'width';
  if (normalized === 'h') return 'height';
  return null;
}

export function fitToParent({ param, value, nodes }: FitProps) {
  const axis = parseAxisValue(value);
  if (!axis) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: `${param}${value}`,
    });
    return;
  }

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    const assertedNode = node as SupportedNodes;
    const parent = assertedNode.parent;

    if (!parent || parent === figma.currentPage || !('width' in parent) || !('height' in parent)) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: 'Fit is not applicable on top-level nodes',
      });
      continue;
    }

    if (nodeCheck !== undefined) {
      const parentWidth = (parent as SupportedNodes).width;
      const parentHeight = (parent as SupportedNodes).height;

      if (axis === 'both' || axis === 'width') {
        assertedNode.resize(parentWidth, assertedNode.height);
        ensureAbsolutePositioning(assertedNode);
        assertedNode.x = 0;
      }
      if (axis === 'both' || axis === 'height') {
        assertedNode.resize(assertedNode.width, parentHeight);
        ensureAbsolutePositioning(assertedNode);
        assertedNode.y = 0;
      }

      const message = {
        both: 'Fitted to parent width and height',
        width: 'Fitted to parent width',
        height: 'Fitted to parent height',
      }[axis];

      figma.notify(message);
    } else {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Fit is not applicable on node type ${node.type}`,
      });
    }
  }
}
