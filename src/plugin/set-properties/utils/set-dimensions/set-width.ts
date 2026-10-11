import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { runWithOrigin, TransformOrigin } from '../../origin';
import { resolveDimensionValue } from './resolve-dimension-value';

interface setWidthProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  origin?: TransformOrigin;
}

export default function setWidth({ param, value, nodes, origin }: setWidthProps) {
  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined) {
      const newWidth = resolveDimensionValue(value, assertedNode, 'width');

      if (newWidth !== null && Number.isFinite(newWidth)) {
        runWithOrigin(assertedNode, origin, () => assertedNode.resize(newWidth, node.height));
      } else {
        notifyError({
          type: ErrorType.INVALID_VAL,
          message: param,
        });
      }
    } else {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Width is not applicable on node type ${node.type}`,
      });
    }
  }
}
