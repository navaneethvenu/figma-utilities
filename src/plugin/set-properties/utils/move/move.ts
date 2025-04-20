import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';

interface moveProps {
  param: string;
  node: SceneNode;
  value: string;
}

export default function move({ param, node, value }: moveProps) {
  const nodeCheck = supportedNodes.find((type) => node.type === type);
  let assertedNode = node as SupportedNodes;

  if (nodeCheck !== undefined) {
    if (param.includes('l')) (assertedNode as SupportedNodes).x -= Number(value);
    if (param.includes('r')) (assertedNode as SupportedNodes).x += Number(value);
    if (param.includes('t')) (assertedNode as SupportedNodes).y -= Number(value);
    if (param.includes('b')) (assertedNode as SupportedNodes).y += Number(value);
    (assertedNode as SupportedNodes).y;
  }

  //Unsupported Prop
  else {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Constraints are not applicable on node type ${node.type}`,
    });
  }
}
