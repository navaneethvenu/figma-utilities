import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { getWorldPosition, setNodeWorldPosition } from '../node-safety';

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
      if (!parent || !('insertChild' in parent)) {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Cannot wrap node "${node.name}" directly under ${parent?.type ?? 'unknown parent'}.`,
        });
        continue;
      }

      const world = getWorldPosition(assertedNode);

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
      if (nodeIndex < 0) {
        notifyError({
          type: ErrorType.UNKNOWN,
          message: `Failed to find "${node.name}" in its parent before wrapping.`,
        });
        continue;
      }

      // Insert frame where node was
      parent.insertChild(nodeIndex, frame);
      const framePositioned = setNodeWorldPosition(frame, world.x, world.y);
      if (!framePositioned) {
        notifyError({
          type: ErrorType.UNKNOWN,
          message: `Failed to place wrapper frame for ${node.name || node.id}.`,
        });
        continue;
      }

      // Append node inside the frame
      frame.appendChild(assertedNode);
      setNodeWorldPosition(assertedNode, world.x, world.y);

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
