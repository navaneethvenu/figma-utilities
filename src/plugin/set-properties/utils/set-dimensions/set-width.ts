import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface setWidthProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

export default function setWidth({ param, value, nodes }: setWidthProps) {
  const width = parseFloat(value);

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined) {
      if (!isNaN(width)) {
        assertedNode.resize(width, node.height);
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
        message: `Width is not applicable on node type ${node.type}`,
      });
    }
  }
}
