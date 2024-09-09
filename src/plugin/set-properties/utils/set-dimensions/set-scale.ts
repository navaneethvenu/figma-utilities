import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface setScaleProps {
  param: string;
  value: string;
  node: SceneNode;
}

export default function setScale({ param, value, node }: setScaleProps) {
  const scale = parseFloat(value);
  console.log('scaling', value, scale);
  const nodeCheck = supportedNodes.find((type) => node.type === type);
  let assertedNode = node as SupportedNodes;
  console.log(nodeCheck);

  if (nodeCheck !== undefined) {
    if (!isNaN(scale)) {
      if (Math.sign(scale) >= 0) assertedNode.rescale(scale);
      else assertedNode.rescale(1 / -scale);
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
      message: `Scale is not applicable on node type ${node.type}`,
    });
  }
}
