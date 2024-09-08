import { SupportedNodes } from './supported-nodes';

interface setStretchConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setStretchConstraints({ node }: setStretchConstraintsProps) {
  node.constraints = {
    horizontal: 'STRETCH',
    vertical: 'STRETCH',
  };
}
