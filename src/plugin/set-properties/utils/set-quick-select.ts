import notifyError from '../../utils/error';
import { ErrorType } from '../../utils/errorType';

interface setConstraintsProps {
  param: string;
  nodes: readonly SceneNode[];
}

export default function setQuickSelect({ param, nodes }: setConstraintsProps) {
  const currentSelection = figma.currentPage.selection;
  const updatedSelection = new Map<string, SceneNode>();

  for (const selectedNode of currentSelection) {
    updatedSelection.set(selectedNode.id, selectedNode);
  }

  for (const node of nodes) {
    const parent = node.parent;
    let newSelection: readonly SceneNode[] = [];

    //Select Right
    if (/selr\b/.test(param)) {
      newSelection = parent.findChildren((newnode) => newnode.x > node.x);
    }
    //Select Left
    else if (/sell\b/.test(param)) {
      newSelection = parent.findChildren((newnode) => newnode.x < node.x);
    }
    //Select Top
    else if (/selt\b/.test(param)) {
      newSelection = parent.findChildren((newnode) => newnode.y < node.y);
    }
    //Select Bottom
    else if (/selb\b/.test(param)) {
      newSelection = parent.findChildren((newnode) => newnode.y > node.y);
    }

    //Invalid Command
    else {
      notifyError({
        type: ErrorType.INVALID_CMD,
        message: param,
      });
    }

    for (const nextNode of newSelection) {
      updatedSelection.set(nextNode.id, nextNode);
    }

    updatedSelection.delete(node.id);
  }

  figma.currentPage.selection = Array.from(updatedSelection.values());
}
