import { SupportedNodes } from './supported-nodes';

interface setYStretchConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setYStretchConstraints({ node }: setYStretchConstraintsProps) {
  node.constraints = {
    horizontal: node.constraints.horizontal,
    vertical: 'STRETCH',
  };
}
