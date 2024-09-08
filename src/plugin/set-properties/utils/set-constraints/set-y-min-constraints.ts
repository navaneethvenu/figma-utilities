import { SupportedNodes } from './supported-nodes';

interface setYMinConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setYMinConstraints({ node }: setYMinConstraintsProps) {
  node.constraints = {
    horizontal: node.constraints.horizontal,
    vertical: 'MIN',
  };
}
