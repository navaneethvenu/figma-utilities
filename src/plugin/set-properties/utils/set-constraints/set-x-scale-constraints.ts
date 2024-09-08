import { SupportedNodes } from './supported-nodes';

interface setXScaleConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setXScaleConstraints({ node }: setXScaleConstraintsProps) {
  node.constraints = {
    horizontal: 'SCALE',
    vertical: node.constraints.vertical,
  };
}
