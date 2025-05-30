import notifyError from '../../utils/error';
import { ErrorType } from '../../utils/errorType';

interface setPositionProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

export default function setPosition({ param, value, nodes }: setPositionProps) {
  const position = parseFloat(value);

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
      if (!isNaN(position)) {
        //X Position
        if (/posx\b/.test(param)) {
          if (node.parent.type === 'FRAME' && node.parent.layoutMode !== 'NONE') node.layoutPositioning = 'ABSOLUTE';
          node.x = position;
        }

        //Y Position
        else if (/posy\b/.test(param)) {
          if (node.parent.type === 'FRAME' && node.parent.layoutMode !== 'NONE') node.layoutPositioning = 'ABSOLUTE';
          node.y = position;
        }

        //All Strokes
        else if (/pos\b/.test(param)) {
          if (node.parent.type === 'FRAME' && node.parent.layoutMode !== 'NONE') node.layoutPositioning = 'ABSOLUTE';
          node.x = position;
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
