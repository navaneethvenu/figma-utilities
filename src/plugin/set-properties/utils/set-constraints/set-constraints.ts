import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes, SupportedNodes } from './supported-nodes';

interface setConstraintsProps {
  shortcut: string;
  nodes: readonly SceneNode[];
}

export default function setConstraints({ nodes, shortcut }: setConstraintsProps) {
  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);
    let assertedNode = node as SupportedNodes;

    if (nodeCheck !== undefined) {
      (assertedNode as SupportedNodes).constraints = parseConstraints(
        shortcut,
        assertedNode.constraints.horizontal,
        assertedNode.constraints.vertical
      );
    }

    //Unsupported Prop
    else {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Constraints are not applicable on node type ${node.type}`,
      });
    }
  }
}

function parseConstraints(
  shortcut: string,
  defaultHorizontal: Constraints['horizontal'],
  defaultVertical: Constraints['vertical']
): Constraints {
  // Defaults
  let horizontal: Constraints['horizontal'] = defaultHorizontal;
  let vertical: Constraints['vertical'] = defaultVertical;

  switch (shortcut) {
    //stretch
    case 'c':
      horizontal = 'STRETCH';
      vertical = 'STRETCH';
      break;
    case 'cx':
      horizontal = 'STRETCH';
      break;
    case 'cy':
      vertical = 'STRETCH';
      break;
    //scale
    case 'cs':
      horizontal = 'SCALE';
      vertical = 'SCALE';
      break;
    case 'cxs':
      horizontal = 'SCALE';
      break;
    case 'cys':
      vertical = 'SCALE';
      break;
    //centre
    case 'cc':
      horizontal = 'CENTER';
      vertical = 'CENTER';
      break;
    case 'cxc':
      horizontal = 'CENTER';
      break;
    case 'cyc':
      vertical = 'CENTER';
      break;
    //horizontal
    case 'cxl':
      horizontal = 'MIN';
      break;
    case 'cxr':
      horizontal = 'MAX';
      break;
    //vertical
    case 'cyt':
      vertical = 'MIN';
      break;
    case 'cyb':
      vertical = 'MAX';
      break;
  }

  return { horizontal, vertical };
}
