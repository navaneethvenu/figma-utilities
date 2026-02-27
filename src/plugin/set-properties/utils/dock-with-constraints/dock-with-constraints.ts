import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';
import { ensureAbsolutePositioning, parseFiniteNumber } from '../node-safety';

interface dockProps {
  param: string;
  nodes: readonly SceneNode[];
  value: string;
}

export default function dockWithConstraints({ param, nodes, value }: dockProps) {
  const offset = parseFiniteNumber(value);
  if (offset === null) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: param,
    });
    return;
  }

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    const parentNode = assertedNode.parent;

    //Unsupported Parent
    if (parentNode === figma.currentPage)
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Dock is not applicable on top level objects`,
      });
    else {
      if (nodeCheck !== undefined) {
        if (!('width' in parentNode) || !('height' in parentNode)) {
          notifyError({
            type: ErrorType.UNSUPPORTED_PROP,
            message: `Dock is not applicable for parent type ${parentNode.type}`,
          });
          continue;
        }

        ensureAbsolutePositioning(assertedNode);

        if (param.includes('l')) {
          assertedNode.x = offset;
          assertedNode.constraints = {
            horizontal: 'MIN',
            vertical: assertedNode.constraints.vertical,
          };
        }
        if (param.includes('r')) {
          assertedNode.x = (parentNode as SupportedNodes).width - offset - assertedNode.width;
          assertedNode.constraints = {
            horizontal: 'MAX',
            vertical: assertedNode.constraints.vertical,
          };
        }
        if (param.includes('t')) {
          assertedNode.y = offset;
          assertedNode.constraints = {
            horizontal: assertedNode.constraints.horizontal,
            vertical: 'MIN',
          };
        }
        if (param.includes('b')) {
          assertedNode.y = (parentNode as SupportedNodes).height - offset - assertedNode.height;
          assertedNode.constraints = {
            horizontal: assertedNode.constraints.horizontal,
            vertical: 'MAX',
          };
        }
      }

      //Unsupported Prop
      else {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Dock is not applicable on node type ${node.type}`,
        });
      }
    }
  }
}
