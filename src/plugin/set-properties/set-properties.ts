import { addHistory } from './history';
import parameterRouting from './param-routing';
import parseParameters from './parse-params';

export default async function setProperties(parameters: { [key: string]: string }) {
  try {
    const selection = figma.currentPage.selection;
    if (selection && selection.length > 0) {
      const parsedParams = parseParameters(parameters);

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
          for (const { param, value } of parsedParams) {
            parameterRouting({ param, value, node });
          }
        }
      }

      await addHistory(parsedParams);

      figma.notify('Properties set successfully.');
    } else {
      figma.notify('No nodes selected.');
    }
  } catch (e: any) {
    console.log(e);
    figma.notify(e.message);
  }
}
