import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';

interface setStretchConstraintsProps {
  param: string;
  node: SceneNode;
}

export default function setStretchConstraints({ node }: setStretchConstraintsProps) {
  const nodeCheck = supportedNodes.find((type) => node.type === type);
  let assertedNode = node as SupportedNodes;

  if (nodeCheck !== undefined)
    (assertedNode as SupportedNodes).constraints = {
      horizontal: 'STRETCH',
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
