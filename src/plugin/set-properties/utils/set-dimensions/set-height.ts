import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface setHeightProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  mode: 'set' | 'increase' | 'decrease';
}

export default function setHeight({ param, value, nodes, mode }: setHeightProps) {
  const parsedValue = parseFloat(value);

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;
    console.log(nodeCheck);

    if (nodeCheck !== undefined) {
      const newHeight =
        mode === 'increase' ? node.height + parsedValue : mode === 'decrease' ? node.height - parsedValue : parsedValue;

      if (!isNaN(newHeight)) {
        assertedNode.resize(node.width, newHeight);
      }

      //Invalid Value
      else {
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
        message: `Height is not applicable on node type ${node.type}`,
      });
    }
  }
}
