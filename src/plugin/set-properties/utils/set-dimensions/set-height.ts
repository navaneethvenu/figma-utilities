import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface setHeightProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

export default function setHeight({ param, value, nodes }: setHeightProps) {
  const height = parseFloat(value);

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;
    console.log(nodeCheck);

    if (nodeCheck !== undefined) {
      if (!isNaN(height)) {
        assertedNode.resize(node.width, height);
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
