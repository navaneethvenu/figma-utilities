import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { runWithOrigin, TransformOrigin } from '../../origin';
import { parseNumberWithOptionalUnit } from '../node-safety';

interface setHeightProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  origin?: TransformOrigin;
}

export default function setHeight({ param, value, nodes, origin }: setHeightProps) {
  const parsedValue = parseNumberWithOptionalUnit(value, ['px']);

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined) {
      const newHeight = parsedValue;

      if (newHeight !== null && Number.isFinite(newHeight)) {
        runWithOrigin(assertedNode, origin, () => assertedNode.resize(node.width, newHeight));
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
        message: `Height is not applicable on node type ${node.type}`,
      });
    }
  }
}
