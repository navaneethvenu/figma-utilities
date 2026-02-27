import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { parseFiniteNumber } from '../node-safety';

interface setScaleHeightProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  mode: 'set' | 'increase' | 'decrease';
}

export default function setScaleHeight({ param, value, nodes, mode }: setScaleHeightProps) {
  const height = parseFiniteNumber(value);
  if (height === null) {
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
      let newHeight;
      if (mode === 'increase') newHeight = node.height + height;
      else if (mode === 'decrease') newHeight = node.height - height;
      else newHeight = height;

      if (!Number.isFinite(newHeight) || newHeight <= 0 || node.height <= 0) {
        notifyError({
          type: ErrorType.INVALID_VAL,
          message: param,
        });
        continue;
      }

      const factor = newHeight / node.height;
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
        message: `ScaleHeight is not applicable on node type ${node.type}`,
      });
    }
  }
}
