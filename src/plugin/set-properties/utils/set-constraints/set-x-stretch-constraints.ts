import { SupportedNodes } from './supported-nodes';

interface setXStretchConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setXStretchConstraints({ node }: setXStretchConstraintsProps) {
  node.constraints = {
    horizontal: 'STRETCH',
    vertical: node.constraints.vertical,
  };
}
