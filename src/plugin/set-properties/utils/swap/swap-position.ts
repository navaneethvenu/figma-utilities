import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface SwapParams {
  param?: string;
  nodes: readonly SceneNode[];
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

  const isAutoA = parentA?.type === 'FRAME' && parentA.layoutMode !== 'NONE';
  const isAutoB = parentB?.type === 'FRAME' && parentB.layoutMode !== 'NONE';

  //
  // ✅ Case 1 — Same auto-layout parent
  //
  if (parentA && parentA === parentB && isAutoA && isAutoB) {
    const parent = parentA;
    const indexA = parent.children.indexOf(nodeA);
    const indexB = parent.children.indexOf(nodeB);

    if (indexA !== -1 && indexB !== -1) {
      // your original logic restored here
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
    }
    return;
  }

  //
  // ✅ Case 2 — Different auto-layout parents
  //
  if (parentA && parentB && isAutoA && isAutoB && parentA !== parentB) {
    const indexA = parentA.children.indexOf(nodeA);
    const indexB = parentB.children.indexOf(nodeB);

    // reparent nodes directly
    parentB.insertChild(indexB, nodeA);
    parentA.insertChild(indexA, nodeB);

    figma.notify('Swapped elements between different auto-layout frames');
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
      // Temporarily store free node position
      const { x, y } = nodeFree;

      // Move auto-layout node to free node’s parent at same level
      parentFree.insertChild(Math.min(parentFree.children.length, 0), nodeAuto);

      // Move free node into auto-layout parent at matching index
      parentAuto.insertChild(indexAuto, nodeFree);

      // Restore approximate position for nodeAuto now in free parent
      nodeAuto.x = x;
      nodeAuto.y = y;

      figma.notify('Swapped between auto-layout and non-auto-layout elements');
    }
    return;
  }

  //
  // ✅ Case 4 — Neither in auto-layout: swap absolute positions
  //
  const originalA = { x: nodeA.x, y: nodeA.y };
  const originalB = { x: nodeB.x, y: nodeB.y };

  if (axis === '' || axis === 'x') {
    nodeA.x = originalB.x;
    nodeB.x = originalA.x;
  }

  if (axis === '' || axis === 'y') {
    nodeA.y = originalB.y;
    nodeB.y = originalA.y;
  }

  figma.notify(`Swapped ${axis ? axis.toUpperCase() + ' ' : ''}positions of selected elements`);
}
