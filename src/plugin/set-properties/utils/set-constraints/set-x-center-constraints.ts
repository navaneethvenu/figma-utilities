import { SupportedNodes } from './supported-nodes';

interface setXCenterConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setXCenterConstraints({ node }: setXCenterConstraintsProps) {
  node.constraints = {
    horizontal: 'CENTER',
    vertical: node.constraints.vertical,
  };
}
