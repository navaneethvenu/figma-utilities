import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface setPositionProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

export default function setPosition({ param, value, nodes }: setPositionProps) {
  const position = parseFloat(value);
  console.log('xxxxx');

  for (const node of nodes) {
    const nodeTypeCheck =
      node.type === 'FRAME' ||
      node.type === 'RECTANGLE' ||
      node.type === 'POLYGON' ||
      node.type === 'ELLIPSE' ||
      node.type === 'STAR' ||
      node.type === 'VECTOR' ||
      node.type === 'LINE';

    if (nodeTypeCheck) {
      console.log(param);
      if (!isNaN(position)) {
        //Both X and Y Positions
        if (/xy\b/.test(param)) {
          if (node.parent.type === 'FRAME' && node.parent.layoutMode !== 'NONE') node.layoutPositioning = 'ABSOLUTE';
          node.x = position;
          node.y = position;
        }
        //X Position
        else if (/x\b/.test(param)) {
          if (node.parent.type === 'FRAME' && node.parent.layoutMode !== 'NONE') node.layoutPositioning = 'ABSOLUTE';
          node.x = position;
        }

        //Y Position
        else if (/y\b/.test(param)) {
          if (node.parent.type === 'FRAME' && node.parent.layoutMode !== 'NONE') node.layoutPositioning = 'ABSOLUTE';
          node.y = position;
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
  }
}
