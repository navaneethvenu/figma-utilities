import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface setScaleWidthProps {
  param: string;
  value: string;
  node: SceneNode;
}

export default function setScaleWidth({ param, value, node }: setScaleWidthProps) {
  const width = parseFloat(value);

  const nodeCheck = supportedNodes.find((type) => node.type === type);
  let assertedNode = node as SupportedNodes;

  if (nodeCheck !== undefined) {
    if (!isNaN(width)) {
      assertedNode.rescale(width / node.width);
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
      message: `Scale Width is not applicable on node type ${node.type}`,
    });
  }
}
