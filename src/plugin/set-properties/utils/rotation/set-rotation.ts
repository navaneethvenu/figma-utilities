import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface SetRotationProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

export default function setRotation({ param, value, nodes }: SetRotationProps) {
  const rotation = Number(value);
  if (!Number.isFinite(rotation)) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: param,
    });
    return;
  }

  for (const node of nodes) {
    if (!('rotation' in node)) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Rotation is not applicable on node type ${node.type}`,
      });
      continue;
    }

    node.rotation = rotation;
  }
}
