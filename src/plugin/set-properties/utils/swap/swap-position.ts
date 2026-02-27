import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface SwapParams {
  param?: string;
  nodes: readonly SceneNode[];
}

function isAutoLayoutParent(
  parent: BaseNode & ChildrenMixin | null
): parent is (BaseNode & ChildrenMixin & { layoutMode: 'HORIZONTAL' | 'VERTICAL' | 'GRID' | 'NONE' }) {
  return !!parent && 'layoutMode' in parent && parent.layoutMode !== 'NONE';
}

function getWorldPosition(node: SceneNode) {
  return {
    x: node.absoluteTransform[0][2],
    y: node.absoluteTransform[1][2],
  };
}

function worldToLocal(parent: BaseNode & ChildrenMixin | null, worldX: number, worldY: number) {
  if (!parent || !('absoluteTransform' in parent)) {
    return { x: worldX, y: worldY };
  }

  const [[a, c, e], [b, d, f]] = parent.absoluteTransform;
  const determinant = a * d - b * c;

  if (determinant === 0) {
    return null;
  }

  return {
    x: (d * (worldX - e) - c * (worldY - f)) / determinant,
    y: (-b * (worldX - e) + a * (worldY - f)) / determinant,
  };
}

function setNodeWorldPosition(node: SceneNode, worldX: number, worldY: number) {
  const local = worldToLocal(node.parent, worldX, worldY);
  if (!local) {
    return false;
  }

  node.x = local.x;
  node.y = local.y;
  return true;
}

export function swapSelectedElements({ param, nodes }: SwapParams) {
  const axis = param?.substring(4) || '';

  if (nodes.length !== 2) {
    notifyError({
      type: ErrorType.INV_SELECTION,
      message: 'Select exactly two elements to swap.',
    });
    return;
  }

  const [a, b] = nodes;

  const aSupported = supportedNodes.includes(a.type as any);
  const bSupported = supportedNodes.includes(b.type as any);

  if (!aSupported || !bSupported) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Swap not supported for node type${!aSupported ? ` ${a.type}` : ''}${!bSupported ? ` ${b.type}` : ''}`,
    });
    return;
  }

  const nodeA = a as SupportedNodes;
  const nodeB = b as SupportedNodes;

  const parentA = nodeA.parent;
  const parentB = nodeB.parent;

  const isAutoA = isAutoLayoutParent(parentA);
  const isAutoB = isAutoLayoutParent(parentB);

  //
  // ✅ Case 1 — Same auto-layout parent
  //
  if (parentA && parentA === parentB && isAutoA && isAutoB) {
    const parent = parentA;
    const indexA = parent.children.indexOf(nodeA);
    const indexB = parent.children.indexOf(nodeB);

    if (indexA !== -1 && indexB !== -1) {
      try {
        if (indexA < indexB) {
          parent.insertChild(indexA, nodeB);
          parent.appendChild(nodeA);
          parent.insertChild(indexB, nodeA);
        } else {
          parent.insertChild(indexB, nodeA);
          parent.appendChild(nodeB);
          parent.insertChild(indexA, nodeB);
        }
        figma.notify('Swapped order of selected elements');
      } catch (error) {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Unable to swap auto-layout siblings: ${(error as Error).message}`,
        });
      }
    }
    return;
  }

  //
  // ✅ Case 2 — Different auto-layout parents
  //
  if (parentA && parentB && isAutoA && isAutoB && parentA !== parentB) {
    const indexA = parentA.children.indexOf(nodeA);
    const indexB = parentB.children.indexOf(nodeB);

    if (indexA === -1 || indexB === -1) {
      notifyError({
        type: ErrorType.UNKNOWN,
        message: 'Unable to locate selected nodes in their parents.',
      });
      return;
    }

    try {
      parentB.insertChild(indexB, nodeA);
      parentA.insertChild(indexA, nodeB);

      figma.notify('Swapped elements between different auto-layout frames');
    } catch (error) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Unable to reparent one or both nodes: ${(error as Error).message}`,
      });
    }
    return;
  }

  //
  // ✅ Case 3 — One auto-layout, one not
  //
  if ((isAutoA && !isAutoB) || (!isAutoA && isAutoB)) {
    const indexAuto = isAutoA ? parentA!.children.indexOf(nodeA) : parentB!.children.indexOf(nodeB);
    const parentAuto = isAutoA ? parentA! : parentB!;
    const nodeAuto = isAutoA ? nodeA : nodeB;
    const nodeFree = isAutoA ? nodeB : nodeA;
    const parentFree = nodeFree.parent;

    if (parentAuto && parentFree) {
      const indexFree = parentFree.children.indexOf(nodeFree);
      const targetIndex = Math.max(0, Math.min(parentFree.children.length, indexFree));

      if (indexAuto === -1 || indexFree === -1) {
        notifyError({
          type: ErrorType.UNKNOWN,
          message: 'Unable to locate selected nodes in their parents.',
        });
        return;
      }

      const freeWorld = getWorldPosition(nodeFree);

      try {
        parentFree.insertChild(targetIndex, nodeAuto);
        parentAuto.insertChild(indexAuto, nodeFree);
      } catch (error) {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Unable to reparent one or both nodes: ${(error as Error).message}`,
        });
        return;
      }

      const positioned = setNodeWorldPosition(nodeAuto, freeWorld.x, freeWorld.y);
      if (!positioned) {
        notifyError({
          type: ErrorType.UNKNOWN,
          message: 'Could not place swapped node due to an invalid parent transform.',
        });
        return;
      }

      figma.notify('Swapped between auto-layout and non-auto-layout elements');
    }
    return;
  }

  //
  // ✅ Case 4 — Neither in auto-layout: swap absolute positions
  //
  const worldA = getWorldPosition(nodeA);
  const worldB = getWorldPosition(nodeB);
  const targetA = { x: worldA.x, y: worldA.y };
  const targetB = { x: worldB.x, y: worldB.y };

  if (axis === '' || axis === 'x') {
    targetA.x = worldB.x;
    targetB.x = worldA.x;
  }

  if (axis === '' || axis === 'y') {
    targetA.y = worldB.y;
    targetB.y = worldA.y;
  }

  const movedA = setNodeWorldPosition(nodeA, targetA.x, targetA.y);
  const movedB = setNodeWorldPosition(nodeB, targetB.x, targetB.y);

  if (!movedA || !movedB) {
    notifyError({
      type: ErrorType.UNKNOWN,
      message: 'Could not swap positions due to an invalid parent transform.',
    });
    return;
  }

  figma.notify(`Swapped ${axis ? axis.toUpperCase() + ' ' : ''}positions of selected elements`);
}
