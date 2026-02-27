import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { parseFiniteNumber } from '../node-safety';

interface setScaleWidthProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  mode: 'set' | 'increase' | 'decrease';
}

export default function setScaleWidth({ param, value, nodes, mode }: setScaleWidthProps) {
  const width = parseFiniteNumber(value);
  if (width === null) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: param,
    });
    return;
  }

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined) {
      let newWidth;
      if (mode === 'increase') newWidth = node.width + width;
      else if (mode === 'decrease') newWidth = node.width - width;
      else newWidth = width;

      if (!Number.isFinite(newWidth) || newWidth <= 0 || node.width <= 0) {
        notifyError({
          type: ErrorType.INVALID_VAL,
          message: param,
        });
        continue;
      }

      const factor = newWidth / node.width;
      if (!Number.isFinite(factor) || factor <= 0) {
        notifyError({
          type: ErrorType.INVALID_VAL,
          message: param,
        });
        continue;
      }

      try {
        assertedNode.rescale(factor);
      } catch {
        notifyError({
          type: ErrorType.INVALID_VAL,
          message: param,
        });
      }
    } else {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Scale Width is not applicable on node type ${node.type}`,
      });
    }
  }
}
