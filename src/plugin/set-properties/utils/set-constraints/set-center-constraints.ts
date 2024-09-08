import { SupportedNodes } from './supported-nodes';

interface setCenterConstraintsProps {
  param: string;
  node: SupportedNodes;
}

export default function setCenterConstraints({ node }: setCenterConstraintsProps) {
  node.constraints = {
    horizontal: 'CENTER',
    vertical: 'CENTER',
  };
}
