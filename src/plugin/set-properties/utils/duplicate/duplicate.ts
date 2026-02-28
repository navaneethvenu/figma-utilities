import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface DuplicateSelectionProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

type CloneableSceneNode = SceneNode & { clone(): SceneNode };

function isCloneable(node: SceneNode): node is CloneableSceneNode {
  return 'clone' in node && typeof (node as { clone?: unknown }).clone === 'function';
}

function parseCount(param: string, value: string): number {
  if (value === '') return 1;

  const count = Number(value);
  if (!Number.isInteger(count) || count <= 0) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: param,
    });
  }

  return count;
}

function ensureParentPlacement(source: SceneNode, clone: SceneNode, cloneOffset: number) {
  const parent = source.parent;
  if (!parent || !('insertChild' in parent) || !('children' in parent)) return;

  const sourceIndex = parent.children.indexOf(source);
  if (sourceIndex < 0) return;

  const targetIndex = Math.min(parent.children.length - 1, sourceIndex + 1 + cloneOffset);
  parent.insertChild(targetIndex, clone);
}

export default function duplicateSelection({ param, value, nodes }: DuplicateSelectionProps) {
  const count = parseCount(param, value);
  const createdNodes: SceneNode[] = [];

  for (const node of nodes) {
    if (!isCloneable(node)) continue;

    for (let i = 0; i < count; i++) {
      try {
        const cloned = node.clone();
        ensureParentPlacement(node, cloned, i);
        createdNodes.push(cloned);
      } catch {
        // Continue for partial success; final empty result will error below.
      }
    }
  }

  if (createdNodes.length === 0) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: 'No nodes could be duplicated.',
    });
    return;
  }

  figma.currentPage.selection = createdNodes;
}
