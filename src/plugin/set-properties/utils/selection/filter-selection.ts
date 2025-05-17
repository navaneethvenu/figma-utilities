import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { getFilterType } from './get-filter-type';
import { supportedNodes } from './supported-nodes';

interface filterSelectionProps {
  param: string;
  node: SceneNode;
}

export default function filterSelection({ param, node }: filterSelectionProps) {
  const nodeCheck = supportedNodes.find((type) => node.type === type);

  if (nodeCheck !== undefined) {
    const filterType = getFilterType(param.substring(2));

    const selection = figma.currentPage.selection;
    let newSelection = [];
    for (const item of selection) {
      if (item.type === filterType) {
        newSelection.push(item);
      }
    }
    figma.currentPage.selection = newSelection;
  }

  //Unsupported Prop
  else {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Filter Selection is not applicable on node type ${node.type}`,
    });
  }
}
