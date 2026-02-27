import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface setStrokeProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

export default function setStrokeWidth({ param, value, nodes }: setStrokeProps) {
  const strokeWidth = parseFloat(value);
  for (const node of nodes) {
    const nodeTypeCheck =
      node.type === 'FRAME' ||
      node.type === 'RECTANGLE' ||
      node.type === 'POLYGON' ||
      node.type === 'ELLIPSE' ||
      node.type === 'STAR' ||
      node.type === 'VECTOR' ||
      node.type === 'LINE';
    const specificStrokeNodeTypeCheck = node.type === 'FRAME' || node.type === 'RECTANGLE';
    const individualStrokesErrorMessage = 'Individual Strokes are not applicable on node type';

    const defaultStroke: SolidPaint = {
      type: 'SOLID',
      color: { r: 0, g: 0, b: 0 },
    };

    if (nodeTypeCheck) {
      if (!isNaN(strokeWidth)) {
        //Left Stroke
        if (/stl\b/.test(param)) {
          if (specificStrokeNodeTypeCheck) {
            node.strokeLeftWeight = strokeWidth;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualStrokesErrorMessage} ${node.type}`,
            });
          }
        }

        //Right Stroke
        else if (/str\b/.test(param)) {
          if (specificStrokeNodeTypeCheck) {
            node.strokeRightWeight = strokeWidth;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualStrokesErrorMessage} ${node.type}`,
            });
          }
        }

        //Top Stroke
        else if (/stt\b/.test(param)) {
          if (specificStrokeNodeTypeCheck) {
            node.strokeTopWeight = strokeWidth;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualStrokesErrorMessage} ${node.type}`,
            });
          }
        }

        //Bottom Stroke
        else if (/stb\b/.test(param)) {
          if (specificStrokeNodeTypeCheck) {
            node.strokeBottomWeight = strokeWidth;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualStrokesErrorMessage} ${node.type}`,
            });
          }
        }

        //Horizontal Stroke
        else if (/stx\b/.test(param)) {
          if (specificStrokeNodeTypeCheck) {
            node.strokeLeftWeight = strokeWidth;
            node.strokeRightWeight = strokeWidth;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualStrokesErrorMessage} ${node.type}`,
            });
          }
        }

        //Vertical Stroke
        else if (/sty\b/.test(param)) {
          if (specificStrokeNodeTypeCheck) {
            node.strokeTopWeight = strokeWidth;
            node.strokeBottomWeight = strokeWidth;
          } else {
            //Unsupported Prop
            notifyError({
              type: ErrorType.UNSUPPORTED_PROP,
              message: `${individualStrokesErrorMessage} ${node.type}`,
            });
          }
        }

        //All Strokes
        else if (/st\b/.test(param)) {
          node.strokeWeight = strokeWidth;
        }

        //Invalid Command
        else {
          notifyError({
            type: ErrorType.INVALID_CMD,
            message: param,
          });
        }

        //Set default stroke if not present already
        if (node.strokes.length === 0) {
          node.strokes = [defaultStroke];
        }
      }

      //Invalid Value
      else {
        notifyError({
          type: ErrorType.INVALID_VAL,
          message: param,
        });
      }
    } else {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Stroke width is not applicable on node type ${node.type}`,
      });
    }
  }
}
