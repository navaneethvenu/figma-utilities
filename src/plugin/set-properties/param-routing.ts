import setConstraints from './utils/set-constraints';
import setPadding from './utils/set-padding';
import setPosition from './utils/set-pos';
import setRadius from './utils/set-radius';
import setStroke from './utils/set-stroke';

interface parameterRoutingProps {
  param: string;
  value: string;
  node:
    | FrameNode
    | ComponentNode
    | ComponentSetNode
    | InstanceNode
    | PolygonNode
    | RectangleNode
    | EllipseNode
    | StarNode
    | LineNode
    | VectorNode;
}

export default function parameterRouting({ param, value, node }: parameterRoutingProps) {
  if (/\bpos.*\.*.*/.test(param)) {
    setPosition({ param, value, node });
  } else if (/\bw.*\.*.*/.test(param)) {
    const width = parseFloat(value);
    if (!isNaN(width)) {
      node.resize(width, node.height);
    }
  } else if (/\bh.*\.*.*/.test(param)) {
    const height = parseFloat(value);
    if (!isNaN(height)) {
      node.resize(node.width, height);
    }
  } else if (/\br.*\.*.*/.test(param)) {
    setRadius({ param, value, node });
  } else if (/\bp.*\.*.*/.test(param)) {
    setPadding({ param, value, node });
  } else if (/\bst.*\.*.*/.test(param)) {
    setStroke({ param, value, node });
  } else if (/\bclip\b/.test(param)) {
    if (node.type === 'FRAME') {
      node.clipsContent = !node.clipsContent;
    }
  } else if (/\bc.*\b/.test(param)) {
    setConstraints({ param, node });
  } else {
    console.log('missed all');
  }
}
