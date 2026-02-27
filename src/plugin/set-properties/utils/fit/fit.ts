import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';
import { ensureAbsolutePositioning } from '../node-safety';

interface FitProps {
  param: string;
  nodes: readonly SceneNode[];
}

export function fitToParent({ param, nodes }: FitProps) {
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

      if (param === 'fit' || param === 'fitw') {
        assertedNode.resize(parentWidth, assertedNode.height);
        ensureAbsolutePositioning(assertedNode);
        assertedNode.x = 0;
      }
      if (param === 'fit' || param === 'fith') {
        assertedNode.resize(assertedNode.width, parentHeight);
        ensureAbsolutePositioning(assertedNode);
        assertedNode.y = 0;
      }

      const message = {
        fit: 'Fitted to parent width and height',
        fitw: 'Fitted to parent width',
        fith: 'Fitted to parent height',
      }[param];

      figma.notify(message);
    } else {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Fit is not applicable on node type ${node.type}`,
      });
    }
  }
}
