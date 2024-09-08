import { SupportedNodes } from './supported-nodes';

interface setXMinConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setXMinConstraints({ node }: setXMinConstraintsProps) {
  node.constraints = {
    horizontal: 'MIN',
    vertical: node.constraints.vertical,
  };
}
