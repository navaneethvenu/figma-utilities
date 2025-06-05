import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface SwapParams {
  param?: string;
  nodes: readonly SceneNode[];
}

export function swapSelectedElements({ param, nodes }: SwapParams) {
  const axis = param.substring(4);
  if (nodes.length !== 2) {
    notifyError({
      type: ErrorType.INV_SELECTION,
      message: 'Select exactly two elements to swap.',
    });

    return;
  }

  const [a, b] = nodes;

  if (a.parent.id === b.parent.id && a.parent.type === 'FRAME' && a.parent.layoutMode !== 'NONE') {
    const parent = a.parent;
    const indexA = parent.children.indexOf(a);
    const indexB = parent.children.indexOf(b);

    if (indexA !== -1 && indexB !== -1) {
      // Remove the node that comes later first to avoid index shifting
      if (indexA < indexB) {
        parent.insertChild(indexA, b);
        parent.appendChild(a);
        parent.insertChild(indexB, a);
      } else {
        parent.insertChild(indexB, a);
        parent.appendChild(b);
        parent.insertChild(indexA, b);
      }

      figma.notify(`Swapped order of selected elements`);
    }
  } else {
    const originalA = { x: a.x, y: a.y };
    const originalB = { x: b.x, y: b.y };

    console.log(a.x, b.x, originalA.x, originalB.x);

    if (axis === '' || axis === 'x') {
      a.x = originalB.x;
      b.x = originalA.x;
    }

    if (axis === '' || axis === 'y') {
      a.y = originalB.y;
      b.y = originalA.y;
    }

    figma.notify(`Swapped ${axis !== '' ? `${axis.toUpperCase()} positions` : 'positions'} of selected elements`);
  }
}
