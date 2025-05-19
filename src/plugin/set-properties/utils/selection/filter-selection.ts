import { getFilterType } from './get-filter-type';

interface filterSelectionProps {
  param: string;
  nodes: readonly SceneNode[];
}

export default function filterSelection({ param, nodes }: filterSelectionProps) {
  const filterType = getFilterType(param.substring(2));

  let selection = [];
  for (const item of nodes) {
    if (item.type === filterType) {
      selection.push(item);
    }
  }
  figma.currentPage.selection = selection;
}
