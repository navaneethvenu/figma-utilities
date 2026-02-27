import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';
import { supportedNodes } from './supported-nodes';
import { ensureAbsolutePositioning, parseFiniteNumber } from '../node-safety';

interface SetPositionProps {
  param: string;
  value: string; // Can be single value or "x,y"
  nodes: readonly SceneNode[];
  mode: 'set' | 'increase' | 'decrease';
}

export default function setPosition({ param, value, nodes, mode }: SetPositionProps) {
  const values = value.split(',').map((v) => parseFiniteNumber(v.trim()));

  if (values.some((v) => v === null)) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: param,
    });
    return;
  }

  for (const node of nodes) {
    const nodeCheck = supportedNodes.find((type) => node.type === type);

    if (!nodeCheck) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Position is not applicable on node type ${node.type}`,
      });
      continue;
    }

    // Ensure absolute positioning for nodes inside frames with layout
    ensureAbsolutePositioning(node);

    // Helper to calculate new value based on mode
    const calculate = (current: number, delta: number) =>
      mode === 'increase' ? current + delta : mode === 'decrease' ? current - delta : delta;

    if (/xy\b/.test(param)) {
      node.x = calculate(node.x, values[0]!);
      node.y = calculate(node.y, values[1] ?? values[0]!);
    } else if (/x\b/.test(param)) {
      node.x = calculate(node.x, values[0]!);
    } else if (/y\b/.test(param)) {
      node.y = calculate(node.y, values[0]!);
    } else {
      notifyError({
        type: ErrorType.INVALID_CMD,
        message: param,
      });
    }
  }
}
