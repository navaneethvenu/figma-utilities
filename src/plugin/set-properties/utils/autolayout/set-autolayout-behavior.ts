import notifyError, { notifyWarning } from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';

interface SetAutolayoutBehaviorProps {
  command: string;
  nodes: readonly SceneNode[];
}

function hasSizingProps(node: SceneNode): boolean {
  return 'layoutSizingHorizontal' in node && 'layoutSizingVertical' in node;
}

export default function setAutolayoutBehavior({ command, nodes }: SetAutolayoutBehaviorProps) {
  for (const node of nodes) {
    if (!supportedNodes.includes(node.type as any)) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Autolayout behavior not supported on node type ${node.type}`,
      });
      continue;
    }

    const assertedNode = node as SupportedNodes;

    if (!hasSizingProps(assertedNode)) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `${node.name} has no autolayout sizing properties.`,
      });
      continue;
    }

    const widthKey = 'layoutSizingHorizontal';
    const heightKey = 'layoutSizingVertical';

    const setMode = (dim: 'width' | 'height', value: 'HUG' | 'FILL' | 'FIXED') => {
      const key = dim === 'width' ? widthKey : heightKey;

      if (!isAutolayout && value === 'HUG') {
        (assertedNode as any)[key] = 'FIXED';
        notifyWarning({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Defaulted to FIXED because Hug Autolayout behavior not supported on node type ${node.type}.`,
        });
      } else (assertedNode as any)[key] = value;
    };

    const toggleMode = (dim: 'width' | 'height') => {
      const key = dim === 'width' ? widthKey : heightKey;
      const current = (assertedNode as any)[key];
      if (!isAutolayout && current === 'FILL') {
        (assertedNode as any)[key] = 'FIXED';
        notifyWarning({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Defaulted to FIXED because Hug Autolayout behavior not supported on node type ${node.type}.`,
        });
      } else if (!isAutolayout) {
        (assertedNode as any)[key] = 'FILL';
      } else (assertedNode as any)[key] = current === 'HUG' ? 'FILL' : 'HUG';
    };

    const isAutolayout = assertedNode.type === 'FRAME' && assertedNode.layoutMode !== 'NONE';

    // Apply command
    switch (command) {
      case 'ah':
        setMode('width', 'HUG');
        setMode('height', 'HUG');
        break;
      case 'awh':
        setMode('width', 'HUG');
        break;
      case 'ahh':
        setMode('height', 'HUG');
        break;

      case 'af':
        setMode('width', 'FILL');
        setMode('height', 'FILL');
        break;
      case 'awf':
        setMode('width', 'FILL');
        break;
      case 'ahf':
        setMode('height', 'FILL');
        break;

      case 'afi':
        setMode('width', 'FIXED');
        setMode('height', 'FIXED');
        break;
      case 'awfi':
        setMode('width', 'FIXED');
        break;
      case 'ahfi':
        setMode('height', 'FIXED');
        break;

      case 'ax':
        toggleMode('width');
        break;

      case 'ay':
        toggleMode('height');
        break;

      case 'aa':
        // Auto mode: use parent layout if it exists
        const parent = assertedNode.parent as FrameNode | null;
        if (parent?.layoutMode === 'HORIZONTAL') {
          setMode('width', 'FILL');
          if (isAutolayout) setMode('height', 'HUG');
          else setMode('height', 'FIXED');
        } else if (parent?.layoutMode === 'VERTICAL') {
          setMode('height', 'FILL');
          if (isAutolayout) setMode('width', 'HUG');
          else setMode('width', 'FIXED');
        } else {
          setMode('width', 'FIXED');
          setMode('height', 'FIXED');
        }
        break;

      default:
        notifyError({
          type: ErrorType.INVALID_VAL,
          message: `Unknown autolayout shortcut: ${command}`,
        });
    }
  }
}
