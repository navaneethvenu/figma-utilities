import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';

interface setXMinConstraintsProps {
  param: string;
  node: SceneNode;
}

export default function setXMinConstraints({ node }: setXMinConstraintsProps) {
  const nodeCheck = supportedNodes.find((type) => node.type === type);
  let assertedNode = node as SupportedNodes;

  if (nodeCheck !== undefined)
    assertedNode.constraints = {
      horizontal: 'MIN',
      vertical: assertedNode.constraints.vertical,
    };
  //Unsupported Prop
  else {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Constraints are not applicable on node type ${node.type}`,
    });
  }
}
