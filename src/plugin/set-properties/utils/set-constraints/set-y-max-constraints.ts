import { SupportedNodes } from './supported-nodes';

interface setYMaxConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setYMaxConstraints({ node }: setYMaxConstraintsProps) {
  node.constraints = {
    horizontal: node.constraints.horizontal,
    vertical: 'MAX',
  };
}
