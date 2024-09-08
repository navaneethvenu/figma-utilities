import { SupportedNodes } from './supported-nodes';

interface setXMaxConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setXMaxConstraints({ node }: setXMaxConstraintsProps) {
  node.constraints = {
    horizontal: 'MAX',
    vertical: node.constraints.vertical,
  };
}
