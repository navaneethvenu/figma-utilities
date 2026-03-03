import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { runWithOrigin, TransformOrigin } from '../../origin';
import { parseNumberWithOptionalUnit } from '../node-safety';

interface setSizeProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  origin?: TransformOrigin;
}

export default function setSize({ param, value, nodes, origin }: setSizeProps) {
  const [rawWidth, rawHeight] = value.split(',');
  const width = parseNumberWithOptionalUnit(rawWidth, ['px']);
  const height = rawHeight !== undefined ? parseNumberWithOptionalUnit(rawHeight, ['px']) : width;

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined) {
      if (width !== null && Number.isFinite(width) && height !== null && Number.isFinite(height)) {
        const newWidth = width;
        const newHeight = height;
        runWithOrigin(assertedNode, origin, () => assertedNode.resize(newWidth, newHeight));
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
