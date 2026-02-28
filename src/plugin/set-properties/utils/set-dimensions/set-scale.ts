import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { parseFiniteNumber } from '../node-safety';
import { runWithOrigin, TransformOrigin } from '../../origin';

interface setScaleProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  origin?: TransformOrigin;
}

export default function setScale({ param, value, nodes, origin }: setScaleProps) {
  const scale = parseFiniteNumber(value);

  if (scale === null || scale === 0) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: param,
    });
    return;
  }

  const factor = scale > 0 ? scale : 1 / Math.abs(scale);
  if (!Number.isFinite(factor) || factor <= 0) {
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
      try {
        runWithOrigin(assertedNode, origin, () => assertedNode.rescale(factor));
      } catch {
        notifyError({
          type: ErrorType.INVALID_VAL,
          message: param,
        });
      }
    }
    //Unsupported Prop
    else {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Scale is not applicable on node type ${node.type}`,
      });
    }
  }
}
