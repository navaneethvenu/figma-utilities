import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface setScaleWidthProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  mode: 'set' | 'increase' | 'decrease';
}

export default function setScaleWidth({ param, value, nodes, mode }: setScaleWidthProps) {
  const width = parseFloat(value);
  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined) {
      let newWidth;
      if (mode === 'increase') newWidth = node.width + width;
      else if (mode === 'decrease') newWidth = node.width - width;
      else newWidth = width;

      if (!isNaN(newWidth)) {
        assertedNode.rescale(newWidth / node.width);
      } else {
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
