import setPadding from './utils/set-padding';
import setPosition from './utils/set-pos';
import setRadius from './utils/set-radius';
import setStroke from './utils/set-stroke';

export default function setProperties(parameters: { [key: string]: string }) {
  try {
    const selection = figma.currentPage.selection;
    if (selection != null && selection.length > 0) {
      for (const node of selection) {
        if (
          node.type === 'FRAME' ||
          node.type === 'COMPONENT' ||
          node.type === 'COMPONENT_SET' ||
          node.type === 'INSTANCE' ||
          node.type === 'POLYGON' ||
          node.type === 'RECTANGLE' ||
          node.type === 'ELLIPSE' ||
          node.type === 'STAR' ||
          node.type === 'LINE' ||
          node.type === 'VECTOR'
        ) {
          for (const key in parameters) {
            const value = parameters[key];

            const values = value.split(' ');

            const regex = /([A-Za-z]+)([0-9]*\.*[0-9]*)\b/g;
            for (const value of values) {
              const match = value.match(regex);
              if (match !== null) {
                const subgroups = regex.exec(value);
                console.log(subgroups);
                if (subgroups.length === 3) {
                  const prop = subgroups[1];
                  const propVal = subgroups[2];

                  parameterRouting({ param: prop, value: propVal, node });
                } else {
                  throw new Error(`Invalid Command: ${value}`);
                }
              } else {
                throw new Error(`Invalid Command: ${value}`);
              }
            }
          }
        }
      }
      figma.notify('Properties set successfully.');
    } else {
      figma.notify('No nodes selected.');
    }
  } catch (e: any) {
    console.log(e);
    figma.notify(e.message);
  }
}

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

function parameterRouting({ param, value, node }: parameterRoutingProps) {
  if (/\bpos.*\.*.*/.test(param)) {
    setPosition({ param, value, node });
  } else if (/\bw.*\.*.*/.test(param)) {
    const width = parseFloat(value);
    console.log(`setting width to ${width}`);
    if (!isNaN(width)) {
      node.resize(width, node.height);
    }
  } else if (/\bh.*\.*.*/.test(param)) {
    const height = parseFloat(value);
    console.log(`setting height to ${height}`);
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
  } else {
    console.log('missed all');
  }
}
