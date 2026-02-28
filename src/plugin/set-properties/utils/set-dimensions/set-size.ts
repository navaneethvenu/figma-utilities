import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { runWithOrigin, TransformOrigin } from '../../origin';

interface setSizeProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  origin?: TransformOrigin;
}

export default function setSize({ param, value, nodes, origin }: setSizeProps) {
  const size = parseFloat(value);

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined) {
      if (!isNaN(size)) {
        runWithOrigin(assertedNode, origin, () => assertedNode.resize(size, size));
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
        message: `Size is not applicable on node type ${node.type}`,
      });
    }
  }
}
