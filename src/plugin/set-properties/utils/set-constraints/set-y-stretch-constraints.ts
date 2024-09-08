import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';

interface setYStretchConstraintsProps {
  param: string;
  node: SceneNode;
}

export default function setYStretchConstraints({ node }: setYStretchConstraintsProps) {
  const nodeCheck = supportedNodes.find((type) => node.type === type);
  let assertedNode = node as SupportedNodes;

  if (nodeCheck !== undefined)
    assertedNode.constraints = {
      horizontal: assertedNode.constraints.horizontal,
      vertical: 'STRETCH',
    };
  //Unsupported Prop
  else {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Constraints are not applicable on node type ${node.type}`,
    });
  }
}
