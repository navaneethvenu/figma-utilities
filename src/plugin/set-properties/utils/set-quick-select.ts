import notifyError from '../../utils/error';
import { ErrorType } from '../../utils/errorType';

interface setConstraintsProps {
  param: string;
  nodes: readonly SceneNode[];
}

export default function setQuickSelect({ param, nodes }: setConstraintsProps) {
  for (const node of nodes) {
    const parent = node.parent;
    const currentSelection = figma.currentPage.selection;
    //Select Right
    if (/selr\b/.test(param)) {
      const newselection = parent.findChildren((newnode) => newnode.x > node.x);
      const updatedSelection = [...new Set([...currentSelection, ...newselection])];
      updatedSelection.splice(
        updatedSelection.findIndex((n) => n.id === node.id),
        1
      );
      figma.currentPage.selection = updatedSelection;
    }
    //Select Left
    else if (/sell\b/.test(param)) {
      const newselection = parent.findChildren((newnode) => newnode.x < node.x);
      const updatedSelection = [...new Set([...currentSelection, ...newselection])];
      updatedSelection.splice(
        updatedSelection.findIndex((n) => n.id === node.id),
        1
      );
      figma.currentPage.selection = updatedSelection;
    }
    //Select Top
    else if (/selt\b/.test(param)) {
      const newselection = parent.findChildren((newnode) => newnode.y < node.y);
      const updatedSelection = [...new Set([...currentSelection, ...newselection])];
      updatedSelection.splice(
        updatedSelection.findIndex((n) => n.id === node.id),
        1
      );
      figma.currentPage.selection = updatedSelection;
    }
    //Select Bottom
    else if (/selb\b/.test(param)) {
      const newselection = parent.findChildren((newnode) => newnode.y > node.y);
      const updatedSelection = [...new Set([...currentSelection, ...newselection])];
      updatedSelection.splice(
        updatedSelection.findIndex((n) => n.id === node.id),
        1
      );
      figma.currentPage.selection = updatedSelection;
    }

    //Invalid Command
    else {
      notifyError({
        type: ErrorType.INVALID_CMD,
        message: param,
      });
    }
  }
}
