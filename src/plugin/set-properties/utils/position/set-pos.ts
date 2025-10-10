import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes } from './supported-nodes';

interface SetPositionProps {
  param: string;
  value: string; // Can be single value or "x,y"
  nodes: readonly SceneNode[];
  mode: 'set' | 'increase' | 'decrease';
}

export default function setPosition({ param, value, nodes, mode }: SetPositionProps) {
  // Split value for xy case (e.g., "10,20")
  const values = value.split(',').map((v) => parseFloat(v.trim()));

  if (values.some((v) => isNaN(v))) {
    nodes.forEach(() =>
      notifyError({
        type: ErrorType.INVALID_VAL,
        message: param,
      })
    );
    return;
  }

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);

    if (!nodeCheck) continue;

    // Ensure absolute positioning for nodes inside frames with layout
    if (node.parent.type === 'FRAME' && node.parent.layoutMode !== 'NONE') {
      (node as FrameNode).layoutPositioning = 'ABSOLUTE';
    }

    // Helper to calculate new value based on mode
    const calculate = (current: number, delta: number) =>
      mode === 'increase' ? current + delta : mode === 'decrease' ? current - delta : delta;

    if (/xy\b/.test(param)) {
      node.x = calculate(node.x, values[0]);
      node.y = calculate(node.y, values[1] ?? values[0]); // Use second value if provided, otherwise same as first
    } else if (/x\b/.test(param)) {
      node.x = calculate(node.x, values[0]);
    } else if (/y\b/.test(param)) {
      node.y = calculate(node.y, values[0]);
    } else {
      notifyError({
        type: ErrorType.INVALID_CMD,
        message: param,
      });
    }
  }
}
