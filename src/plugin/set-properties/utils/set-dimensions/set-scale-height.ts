import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface setScaleHeightProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  mode: 'set' | 'increase' | 'decrease';
}

export default function setScaleHeight({ param, value, nodes, mode }: setScaleHeightProps) {
  const height = parseFloat(value);
  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined) {
      let newHeight;
      if (mode === 'increase') newHeight = node.height + height;
      else if (mode === 'decrease') newHeight = node.height - height;
      else newHeight = height;

      if (!isNaN(newHeight)) {
        assertedNode.rescale(newHeight / node.height);
      } else {
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
