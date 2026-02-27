import { getFilterType } from './get-filter-type';
import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface filterSelectionProps {
  param: string;
  nodes: readonly SceneNode[];
}

export default function filterSelection({ param, nodes }: filterSelectionProps) {
  const filterType = getFilterType(param.substring(2));
  if (!filterType) {
    notifyError({
      type: ErrorType.INVALID_CMD,
      message: param,
    });
    return;
  }

  let selection = [];
  for (const item of nodes) {
    if (item.type === filterType) {
      selection.push(item);
    }
  }
  figma.currentPage.selection = selection;
}
