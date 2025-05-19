import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';

interface moveProps {
  param: string;
  nodes: readonly SceneNode[];
  value: string;
}

export default function move({ param, nodes, value }: moveProps) {
  for (const node of nodes) {
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
        message: `Moving is not applicable on node type ${node.type}`,
      });
    }
  }
}
