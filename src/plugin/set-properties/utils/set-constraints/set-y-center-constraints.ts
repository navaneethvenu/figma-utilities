import { SupportedNodes } from './supported-nodes';

interface setYCenterConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setYCenterConstraints({ node }: setYCenterConstraintsProps) {
  node.constraints = {
    horizontal: node.constraints.horizontal,
    vertical: 'CENTER',
  };
}
