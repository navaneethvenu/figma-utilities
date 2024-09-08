import { SupportedNodes } from './supported-nodes';

interface setScaleConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setScaleConstraints({ node }: setScaleConstraintsProps) {
  node.constraints = {
    horizontal: 'SCALE',
    vertical: 'SCALE',
  };
}
