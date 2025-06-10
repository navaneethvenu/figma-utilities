import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';

interface setPaddingProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

export default function setPadding({ param, value, nodes }: setPaddingProps) {
  const padding = parseFloat(value);

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined && assertedNode.layoutMode !== 'NONE') {
      if (!isNaN(padding)) {
        //Left Padding
        if (/pl\b/.test(param)) {
          assertedNode.paddingLeft = padding;
        }

        //Right Padding
        else if (/pr\b/.test(param)) {
          assertedNode.paddingRight = padding;
        }

        //Top Padding
        else if (/pt\b/.test(param)) {
          assertedNode.paddingTop = padding;
        }

        //Bottom Padding
        else if (/pb\b/.test(param)) {
          assertedNode.paddingBottom = padding;
        }

        //Horizontal Padding
        else if (/px\b/.test(param)) {
          assertedNode.paddingLeft = padding;
          assertedNode.paddingRight = padding;
        }

        //Vertical Padding
        else if (/py\b/.test(param)) {
          assertedNode.paddingTop = padding;
          assertedNode.paddingBottom = padding;
        }

        //Complete Padding
        else if (/p\b/.test(param)) {
          assertedNode.paddingLeft = padding;
          assertedNode.paddingRight = padding;
          assertedNode.paddingTop = padding;
          assertedNode.paddingBottom = padding;
        }

        //Invalid Command
        else {
          notifyError({
            type: ErrorType.INVALID_CMD,
            message: param,
          });
        }
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
        message: `Padding is not applicable on node type ${node.type}`,
      });
    }
  }
}
