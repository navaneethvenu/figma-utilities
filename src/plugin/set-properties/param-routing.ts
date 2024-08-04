import regexShorthand from './regex';
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
  if (regexShorthand({ prop: 'pos' }).test(param)) {
    setPosition({ param, value, node });
  }
  //regex(prop: w,hasValue: true)
  else if (regexShorthand({ prop: 'w' }).test(param)) {
    const width = parseFloat(value);
    if (!isNaN(width)) {
      node.resize(width, node.height);
    }
  } else if (regexShorthand({ prop: 'h' }).test(param)) {
    const height = parseFloat(value);
    if (!isNaN(height)) {
      node.resize(node.width, height);
    }
  } else if (regexShorthand({ prop: 'r' }).test(param)) {
    setRadius({ param, value, node });
  } else if (regexShorthand({ prop: 'p' }).test(param)) {
    setPadding({ param, value, node });
  } else if (regexShorthand({ prop: 'str' }).test(param)) {
    setStroke({ param, value, node });
  } else if (regexShorthand({ prop: 'clip', hasValue: false, continueEnd: false }).test(param)) {
    if (node.type === 'FRAME') {
      node.clipsContent = !node.clipsContent;
    }
  } else if (regexShorthand({ prop: 'c', hasValue: false }).test(param)) {
    setConstraints({ param, node });
  } else {
    console.log('missed all');
  }
}
