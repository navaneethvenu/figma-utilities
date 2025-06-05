import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface setWidthProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  mode: 'set' | 'increase' | 'decrease';
}

export default function setWidth({ param, value, nodes, mode }: setWidthProps) {
  const parsedValue = parseFloat(value);

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined) {
      const newWidth =
        mode === 'increase' ? node.width + parsedValue : mode === 'decrease' ? node.width - parsedValue : parsedValue;

      if (!isNaN(newWidth)) {
        assertedNode.resize(newWidth, node.height);
      } else {
        notifyError({
          type: ErrorType.INVALID_VAL,
          message: param,
        });
      }
    } else {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Width is not applicable on node type ${node.type}`,
      });
    }
  }
}
