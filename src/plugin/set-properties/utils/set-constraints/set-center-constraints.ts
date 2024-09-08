import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';

interface setCenterConstraintsProps {
  param: string;
  node: SceneNode;
}

export default function setCenterConstraints({ node }: setCenterConstraintsProps) {
  const nodeCheck = supportedNodes.find((type) => node.type === type);
  let assertedNode = node as SupportedNodes;

  if (nodeCheck !== undefined)
    (assertedNode as SupportedNodes).constraints = {
      horizontal: 'CENTER',
      vertical: 'CENTER',
    };
  //Unsupported Prop
  else {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Padding is not applicable on node type ${node.type}`,
    });
  }
}
