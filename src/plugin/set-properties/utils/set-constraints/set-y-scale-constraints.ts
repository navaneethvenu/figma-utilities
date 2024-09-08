import { SupportedNodes } from './supported-nodes';

interface setYScaleConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setYScaleConstraints({ node }: setYScaleConstraintsProps) {
  node.constraints = {
    horizontal: node.constraints.horizontal,
    vertical: 'SCALE',
  };
}
