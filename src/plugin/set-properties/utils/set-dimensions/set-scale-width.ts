import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { parseNumberWithOptionalUnit } from '../node-safety';
import { runWithOrigin, TransformOrigin } from '../../origin';

interface setScaleWidthProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  origin?: TransformOrigin;
}

export default function setScaleWidth({ param, value, nodes, origin }: setScaleWidthProps) {
  const width = parseNumberWithOptionalUnit(value, ['px']);
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
      const newWidth = width;

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
        runWithOrigin(assertedNode, origin, () => assertedNode.rescale(factor));
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
