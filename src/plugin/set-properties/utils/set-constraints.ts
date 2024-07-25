import notifyError from '../../utils/error';
import { ErrorType } from '../../utils/errorType';

interface setConstraintsProps {
  param: string;
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

export default function setConstraints({ param, node }: setConstraintsProps) {
  //Horizontal Constraints
  if (/cx.*/.test(param)) {
    //Left Constraint
    if (/cxl\b/.test(param))
      node.constraints = {
        horizontal: 'MIN',
        vertical: node.constraints.vertical,
      };
    //Right Constraint
    else if (/cxr\b/.test(param))
      node.constraints = {
        horizontal: 'MAX',
        vertical: node.constraints.vertical,
      };
    //Center Constraint
    else if (/cxc\b/.test(param))
      node.constraints = {
        horizontal: 'CENTER',
        vertical: node.constraints.vertical,
      };
    //Scale Constraint
    else if (/cxs\b/.test(param))
      node.constraints = {
        horizontal: 'SCALE',
        vertical: node.constraints.vertical,
      };
    //Left and Right Constraint
    else if (/cx\b/.test(param))
      node.constraints = {
        horizontal: 'STRETCH',
        vertical: node.constraints.vertical,
      };
    //Invalid Command
    else {
      notifyError({
        type: ErrorType.INVALID_CMD,
        message: param,
      });
    }
  }

  //Vertical Constraints
  else if (/cy.*/.test(param)) {
    //Top Constraint
    if (/cyt\b/.test(param))
      node.constraints = {
        horizontal: node.constraints.horizontal,
        vertical: 'MIN',
      };
    //Right Constraint
    else if (/cyb\b/.test(param))
      node.constraints = {
        horizontal: node.constraints.horizontal,
        vertical: 'MAX',
      };
    //Center Constraint
    else if (/cyc\b/.test(param))
      node.constraints = {
        horizontal: node.constraints.horizontal,
        vertical: 'CENTER',
      };
    //Scale Constraint
    else if (/cys\b/.test(param))
      node.constraints = {
        horizontal: node.constraints.horizontal,
        vertical: 'SCALE',
      };
    //Left and Right Constraint
    else if (/cy\b/.test(param))
      node.constraints = {
        horizontal: node.constraints.horizontal,
        vertical: 'STRETCH',
      };
    //Invalid Command
    else {
      notifyError({
        type: ErrorType.INVALID_CMD,
        message: param,
      });
    }
  }

  //All Center Constraint
  else if (/cc\b/.test(param))
    node.constraints = {
      horizontal: 'CENTER',
      vertical: 'CENTER',
    };
  //All Scale Constraint
  else if (/cs\b/.test(param))
    node.constraints = {
      horizontal: 'SCALE',
      vertical: 'SCALE',
    };
  //Left and Right Constraint
  else if (/c\b/.test(param))
    node.constraints = {
      horizontal: 'STRETCH',
      vertical: 'STRETCH',
    };
  //Invalid Command
  else {
    notifyError({
      type: ErrorType.INVALID_CMD,
      message: param,
    });
  }
}
