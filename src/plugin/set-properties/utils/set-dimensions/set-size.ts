import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface setSizeProps {
  param: string;
  value: string;
  node: SceneNode;
}

export default function setSize({ param, value, node }: setSizeProps) {
  const size = parseFloat(value);
  const nodeCheck = supportedNodes.find((type) => node.type === type);
  let assertedNode = node as SupportedNodes;
  console.log(nodeCheck);

  if (nodeCheck !== undefined) {
    if (!isNaN(size)) {
      assertedNode.resize(size, size);
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
      message: `Size is not applicable on node type ${node.type}`,
    });
  }
}
