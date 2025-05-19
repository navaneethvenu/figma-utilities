import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';

interface dockProps {
  param: string;
  nodes: readonly SceneNode[];
  value: string;
}

export default function dockWithConstraints({ param, nodes, value }: dockProps) {
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
        if (param.includes('l')) {
          assertedNode.x = Number(value);
          assertedNode.constraints = {
            horizontal: 'MIN',
            vertical: assertedNode.constraints.vertical,
          };
        }
        if (param.includes('r')) {
          assertedNode.x = (parentNode as SupportedNodes).width - Number(value) - assertedNode.width;
          assertedNode.constraints = {
            horizontal: 'MAX',
            vertical: assertedNode.constraints.vertical,
          };
        }
        if (param.includes('t')) {
          assertedNode.y = Number(value);
          assertedNode.constraints = {
            horizontal: assertedNode.constraints.horizontal,
            vertical: 'MIN',
          };
        }
        if (param.includes('b')) {
          assertedNode.y = (parentNode as SupportedNodes).height - Number(value) - assertedNode.height;
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
