import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { parseFiniteNumber } from '../node-safety';

interface setScaleProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

export default function setScale({ param, value, nodes }: setScaleProps) {
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
        assertedNode.rescale(factor);
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
