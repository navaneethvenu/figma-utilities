import notifyError from '../../utils/error';
import { ErrorType } from '../../utils/errorType';

interface setRadiusProps {
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

export default function setRadius({ param, value, node }: setRadiusProps) {
  const radius = parseFloat(value);
  const nodeTypeCheck =
    node.type === 'FRAME' ||
    node.type === 'RECTANGLE' ||
    node.type === 'POLYGON' ||
    node.type === 'ELLIPSE' ||
    node.type === 'STAR' ||
    node.type === 'VECTOR';
  const specificRadiusNodeTypeCheck = node.type === 'FRAME' || node.type === 'RECTANGLE';
  const individualRadiiErrorMessage = 'Individual Radii are not applicable on node type';

  if (nodeTypeCheck) {
    if (!isNaN(radius)) {
      //Top Corner Radii
      if (/rt.*/.test(param)) {
        //Top Left Corner Radius
        if (/rtl\b/.test(param)) {
          if (specificRadiusNodeTypeCheck) {
            node.topLeftRadius = radius;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualRadiiErrorMessage} ${node.type}`,
            });
          }
        }

        //Top Right Corner Radius
        else if (/rtr\b/.test(param)) {
          if (specificRadiusNodeTypeCheck) {
            node.topRightRadius = radius;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualRadiiErrorMessage} ${node.type}`,
            });
          }
        }

        //Both Radii
        else if (/rt\b/.test(param)) {
          if (specificRadiusNodeTypeCheck) {
            node.topLeftRadius = radius;
            node.topRightRadius = radius;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualRadiiErrorMessage} ${node.type}`,
            });
          }
        }

        //Invalid Command
        else {
          notifyError({
            type: ErrorType.INVALID_CMD,
            message: param,
          });
        }
      }

      //Bottom Corner Radii
      else if (/rb.*/.test(param)) {
        //Bottom Left Corner Radius
        if (/rbl\b/.test(param)) {
          if (specificRadiusNodeTypeCheck) {
            node.bottomLeftRadius = radius;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualRadiiErrorMessage} ${node.type}`,
            });
          }
        }

        //Bottom Right Corner Radius
        else if (/rbr\b/.test(param)) {
          if (specificRadiusNodeTypeCheck) {
            node.bottomRightRadius = radius;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualRadiiErrorMessage} ${node.type}`,
            });
          }
        }

        //Both Radii
        else if (/rb\b/.test(param)) {
          if (specificRadiusNodeTypeCheck) {
            node.bottomLeftRadius = radius;
            node.bottomRightRadius = radius;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualRadiiErrorMessage} ${node.type}`,
            });
          }
        }

        //Invalid Command
        else {
          notifyError({
            type: ErrorType.INVALID_CMD,
            message: param,
          });
        }
      }

      //Complete Corner Radius
      else if (/r\b/.test(param)) {
        node.cornerRadius = radius;
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
      message: `Radius is not applicable on node type ${node.type}`,
    });
  }
}
