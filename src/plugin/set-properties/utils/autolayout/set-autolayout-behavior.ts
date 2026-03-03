import notifyError, { notifyWarning } from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { SupportedNodes, supportedNodes } from './supported-nodes';
import { isAutoLayoutParent } from '../node-safety';

interface SetAutolayoutBehaviorProps {
  command: string;
  value: string;
  nodes: readonly SceneNode[];
}

function hasSizingProps(node: SceneNode): boolean {
  return 'layoutSizingHorizontal' in node && 'layoutSizingVertical' in node;
}

function parseAxisValue(value: string): 'both' | 'width' | 'height' | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === '') return 'both';
  if (normalized === 'w') return 'width';
  if (normalized === 'h') return 'height';
  return null;
}

function applyAxisMode(
  axis: 'both' | 'width' | 'height',
  setMode: (dim: 'width' | 'height', mode: 'HUG' | 'FILL' | 'FIXED') => void,
  mode: 'HUG' | 'FILL' | 'FIXED'
) {
  if (axis === 'both' || axis === 'width') setMode('width', mode);
  if (axis === 'both' || axis === 'height') setMode('height', mode);
}

export default function setAutolayoutBehavior({ command, value, nodes }: SetAutolayoutBehaviorProps) {
  const axis = parseAxisValue(value);
  if (!axis) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: `${command}${value}`,
    });
    return;
  }

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

    const isAutolayout = 'layoutMode' in assertedNode && assertedNode.layoutMode !== 'NONE';

    // Apply command
    switch (command) {
      case 'hug':
        applyAxisMode(axis, setMode, 'HUG');
        break;

      case 'fill':
        applyAxisMode(axis, setMode, 'FILL');
        break;

      case 'ax':
        toggleMode('width');
        break;

      case 'ay':
        toggleMode('height');
        break;

      case 'aa':
        // Auto mode: use parent layout if it exists
        const parent = assertedNode.parent;
        if (isAutoLayoutParent(parent) && parent.layoutMode === 'HORIZONTAL') {
          setMode('width', 'FILL');
          if (isAutolayout) setMode('height', 'HUG');
          else setMode('height', 'FIXED');
        } else if (isAutoLayoutParent(parent) && parent.layoutMode === 'VERTICAL') {
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
