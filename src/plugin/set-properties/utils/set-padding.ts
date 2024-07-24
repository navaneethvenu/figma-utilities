import notifyError from '../../utils/error';
import { ErrorType } from '../../utils/errorType';

interface setPaddingProps {
  param: string;
  value: string;
  node:
    | FrameNode
    | ComponentNode
    | ComponentSetNode
    | InstanceNode
    | PolygonNode
    | RectangleNode
    | EllipseNode
    | StarNode
    | LineNode
    | VectorNode;
}

export default function setPadding({ param, value, node }: setPaddingProps) {
  const padding = parseFloat(value);
  const nodeTypeCheck = node.type === 'FRAME' && node.layoutMode !== 'NONE';

  if (nodeTypeCheck) {
    if (!isNaN(padding)) {
      //Left Padding
      if (/pl\b/.test(param)) {
        node.paddingLeft = padding;
      }

      //Right Padding
      else if (/pr\b/.test(param)) {
        node.paddingRight = padding;
      }

      //Top Padding
      else if (/pt\b/.test(param)) {
        node.paddingLeft = padding;
      }

      //Bottom Padding
      else if (/pb\b/.test(param)) {
        node.paddingRight = padding;
      }

      //Horizontal Padding
      else if (/px\b/.test(param)) {
        node.paddingLeft = padding;
        node.paddingRight = padding;
      }

      //Vertical Padding
      else if (/py\b/.test(param)) {
        node.paddingTop = padding;
        node.paddingBottom = padding;
      }

      //Complete Padding
      else if (/p\b/.test(param)) {
        node.paddingLeft = padding;
        node.paddingRight = padding;
        node.paddingTop = padding;
        node.paddingBottom = padding;
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
