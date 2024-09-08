import notifyError from '../../utils/error';
import { ErrorType } from '../../utils/errorType';

interface toggleClipProps {
  node: SceneNode;
}

export default function toggleClip({ node }: toggleClipProps) {
  const nodeTypeCheck = node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE';

  if (nodeTypeCheck) {
    node.clipsContent = !node.clipsContent;
  }

  //Unsupported Prop
  else {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Clip Content is not applicable on node type ${node.type}`,
    });
  }
}
