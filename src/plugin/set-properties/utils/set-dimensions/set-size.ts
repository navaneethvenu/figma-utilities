import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { runWithOrigin, TransformOrigin } from '../../origin';
import { resolveDimensionValue } from './resolve-dimension-value';

interface setSizeProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  origin?: TransformOrigin;
}

export default function setSize({ param, value, nodes, origin }: setSizeProps) {
  const [rawWidth, rawHeight] = value.split(',');

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined) {
      const width = resolveDimensionValue(rawWidth, assertedNode, 'width');
      const height = rawHeight !== undefined ? resolveDimensionValue(rawHeight, assertedNode, 'height') : width;

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
