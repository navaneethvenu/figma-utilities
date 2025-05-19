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
