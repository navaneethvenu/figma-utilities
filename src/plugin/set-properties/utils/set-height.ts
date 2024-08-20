import notifyError from '../../utils/error';
import { ErrorType } from '../../utils/errorType';

interface setHeightProps {
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

export default function setHeight({ param, value, node }: setHeightProps) {
  const height = parseFloat(value);
  const nodeTypeCheck =
    node.type === 'FRAME' ||
    node.type === 'RECTANGLE' ||
    node.type === 'POLYGON' ||
    node.type === 'ELLIPSE' ||
    node.type === 'STAR' ||
    node.type === 'VECTOR' ||
    node.type === 'LINE';

  if (nodeTypeCheck) {
    if (!isNaN(height)) {
      node.resize(node.width, height);
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
