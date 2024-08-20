import notifyError from '../../utils/error';
import { ErrorType } from '../../utils/errorType';

interface setWidthProps {
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

export default function setWidth({ param, value, node }: setWidthProps) {
  const width = parseFloat(value);
  const nodeTypeCheck =
    node.type === 'FRAME' ||
    node.type === 'RECTANGLE' ||
    node.type === 'POLYGON' ||
    node.type === 'ELLIPSE' ||
    node.type === 'STAR' ||
    node.type === 'VECTOR' ||
    node.type === 'LINE';

  if (nodeTypeCheck) {
    if (!isNaN(width)) {
      node.resize(width, node.height);
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
