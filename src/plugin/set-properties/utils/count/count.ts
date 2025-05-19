import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface CountProps {
  param: string;
}

export default function countSelectedElements({ param }: CountProps) {
  const nested = param !== 'count';
  const selection = figma.currentPage.selection;

  if (!selection || selection.length === 0) {
    notifyError({
      type: ErrorType.NO_SELECTION,
      message: 'No elements selected.',
    });
    return;
  }

  const count = nested ? countNested(selection) : selection.length;

  figma.notify(`Count: ${count} ${nested ? 'nested' : 'top-level'} element${count !== 1 ? 's' : ''}`);
}

function countNested(nodes: readonly SceneNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if ('children' in node) {
      count += countNested(node.children);
    }
  }
  return count;
}
