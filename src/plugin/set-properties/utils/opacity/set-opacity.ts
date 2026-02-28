import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface SetOpacityProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

export default function setOpacity({ param, value, nodes }: SetOpacityProps) {
  const opacityPercent = Number(value);
  if (!Number.isFinite(opacityPercent) || opacityPercent < 0 || opacityPercent > 100) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: param,
    });
    return;
  }

  const opacity = opacityPercent / 100;

  for (const node of nodes) {
    if (!('opacity' in node)) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Opacity is not applicable on node type ${node.type}`,
      });
      continue;
    }

    node.opacity = opacity;
  }
}
