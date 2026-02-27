import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';
import { ensureAbsolutePositioning, parseFiniteNumber } from '../node-safety';

interface shiftProps {
  param: string;
  node: SceneNode;
  value: string;
}

export default function shift({ param, node, value }: shiftProps) {
  const offset = parseFiniteNumber(value);
  if (offset === null) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: param,
    });
    return;
  }

  const nodeCheck = supportedNodes.find((type) => node.type === type);
  let assertedNode = node as SupportedNodes;

  const parentNode = assertedNode.parent;

  //Unsupported Parent
  if (parentNode === figma.currentPage)
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Shift is not applicable on top level objects`,
    });
  else {
    if (nodeCheck !== undefined) {
      if (!('width' in parentNode) || !('height' in parentNode)) {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Shift is not applicable for parent type ${parentNode.type}`,
        });
        return;
      }

      ensureAbsolutePositioning(assertedNode);
      if (param.includes('l')) (assertedNode as SupportedNodes).x = offset;
      if (param.includes('r'))
        (assertedNode as SupportedNodes).x = (parentNode as SupportedNodes).width - offset - assertedNode.width;
      if (param.includes('t')) (assertedNode as SupportedNodes).y = offset;
      if (param.includes('b'))
        (assertedNode as SupportedNodes).y =
          (parentNode as SupportedNodes).height - offset - assertedNode.height;
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
}
