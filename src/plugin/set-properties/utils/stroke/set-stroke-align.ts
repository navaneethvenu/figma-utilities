import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface setStrokeProps {
  param: string;
  nodes: readonly SceneNode[];
}

export default function setStrokeAlign({ param, nodes }: setStrokeProps) {
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
      //Inside Stroke
      if (param === 'sti') {
        node.strokeAlign = 'INSIDE';
      }
      //Center Stroke
      else if (param === 'stc') {
        node.strokeAlign = 'CENTER';
      }
      //Outside Stroke
      else if (param === 'sto') {
        node.strokeAlign = 'OUTSIDE';
      } else {
        notifyError({
          type: ErrorType.INVALID_CMD,
          message: param,
        });
      }
    } else {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Stroke align is not applicable on node type ${node.type}`,
      });
    }
  }
}
