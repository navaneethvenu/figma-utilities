import { propList } from './prop-list';
import regexShorthand from './regex';

export interface parameterRoutingProps {
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
  let match = false;
  for (const prop of Object.values(propList)) {
    const regex = regexShorthand({
      prop: prop.shortcut,
      hasValue: prop.hasValue,
      continueEnd: prop.subcommands !== undefined,
    });

    console.log(prop.shortcut, prop, regex.source);
    if (regex.test(param)) {
      prop.action({ param, value, node });
      regex.lastIndex = 0;
      match = true;
      break;
    }
  }
  if (!match) console.log('missed all');
}
