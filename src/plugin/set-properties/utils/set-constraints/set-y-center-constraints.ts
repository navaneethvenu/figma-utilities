import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';

interface setYCenterConstraintsProps {
  param: string;
  node: SceneNode;
}

export default function setYCenterConstraints({ node }: setYCenterConstraintsProps) {
  const nodeCheck = supportedNodes.find((type) => node.type === type);
  let assertedNode = node as SupportedNodes;

  if (nodeCheck !== undefined)
    assertedNode.constraints = {
      horizontal: assertedNode.constraints.horizontal,
      vertical: 'CENTER',
    };
  //Unsupported Prop
  else {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Constraints are not applicable on node type ${node.type}`,
    });
  }
}
