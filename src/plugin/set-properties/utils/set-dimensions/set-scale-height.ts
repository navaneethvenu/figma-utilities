import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface setScaleHeightProps {
  param: string;
  value: string;
  node: SceneNode;
}

export default function setScaleHeight({ param, value, node }: setScaleHeightProps) {
  const height = parseFloat(value);
  const nodeCheck = supportedNodes.find((type) => node.type === type);
  let assertedNode = node as SupportedNodes;
  console.log(nodeCheck);

  if (nodeCheck !== undefined) {
    if (!isNaN(height)) {
      assertedNode.rescale(height / node.height);
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
      message: `ScaleHeight is not applicable on node type ${node.type}`,
    });
  }
}
