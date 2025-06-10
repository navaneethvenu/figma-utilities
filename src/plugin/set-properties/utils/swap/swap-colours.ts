import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface SwapParams {
  param?: string;
  nodes: readonly SceneNode[];
}

export function swapSelectedFills({ nodes }: SwapParams) {
  const fillData = figma.getSelectionColors();

  if (!fillData || fillData.paints.length !== 2) {
    notifyError({
      type: ErrorType.INV_SELECTION,
      message: 'Exactly two unique fills must exist in the selection.',
    });
    return;
  }

  const [fillA, fillB] = fillData.paints;

  const fillAJSON = JSON.stringify(fillA);
  const fillBJSON = JSON.stringify(fillB);

  function swapFills(node: SceneNode) {
    if ('fills' in node && Array.isArray(node.fills)) {
      const newFills = node.fills.map((fill) => {
        const fillJSON = JSON.stringify(fill);
        if (fillJSON === fillAJSON) return fillB;
        if (fillJSON === fillBJSON) return fillA;
        return fill;
      });

      console.log(node.fills, newFills, fillA, fillB);

      node.fills = newFills;
    }

    if ('children' in node) {
      for (const child of node.children) {
        swapFills(child);
      }
    }
  }

  for (const node of nodes) {
    swapFills(node);
  }

  figma.notify('Swapped the two fills across selection');
}
