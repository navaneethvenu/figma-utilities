import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface wrapInFrameProps {
  nodes: readonly SceneNode[];
}

export default function wrapInFrame({ nodes }: wrapInFrameProps) {
  if (!nodes || nodes.length === 0) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: 'No nodes selected to wrap in frames.',
    });
    return;
  }

  const wrappedFrames: FrameNode[] = [];

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    const assertedNode = node as SupportedNodes;

    if (nodeCheck === undefined) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Wrap in frame is not applicable on node type ${node.type}`,
      });
      continue;
    }

    try {
      const parent = node.parent;
      if (!parent || parent.type === 'PAGE' || parent.type === 'DOCUMENT') {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Cannot wrap node "${node.name}" directly under ${parent?.type ?? 'unknown parent'}.`,
        });
        continue;
      }

      // Capture absolute position BEFORE reparenting
      const absTransform = node.absoluteTransform;
      const absX = absTransform[0][2];
      const absY = absTransform[1][2];

      // Create frame
      const frame = figma.createFrame();
      frame.name = `${assertedNode.name || node.type} Frame`;
      frame.layoutMode = 'NONE';
      frame.counterAxisSizingMode = 'AUTO';
      frame.primaryAxisSizingMode = 'AUTO';

      // Match frame’s size to node’s size
      frame.resize(assertedNode.width, assertedNode.height);

      // Get node’s index for insertion order
      const nodeIndex = parent.children.indexOf(node);

      // Insert frame where node was
      parent.insertChild(nodeIndex, frame);

      // Append node inside the frame
      frame.appendChild(assertedNode);

      // Reset node’s local coordinates so it keeps the same absolute position
      const newAbsTransform = frame.absoluteTransform;
      const frameAbsX = newAbsTransform[0][2];
      const frameAbsY = newAbsTransform[1][2];

      assertedNode.x = absX - frameAbsX;
      assertedNode.y = absY - frameAbsY;

      wrappedFrames.push(frame);
    } catch (error) {
      notifyError({
        type: ErrorType.UNKNOWN,
        message: `Failed to wrap node ${node.name || node.id} in frame: ${String(error)}`,
      });
    }
  }

  if (wrappedFrames.length > 0) {
    figma.currentPage.selection = wrappedFrames;
  }
}
