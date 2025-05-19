import { addHistory } from './history';
import parameterRouting from './param-routing';
import parseParameters from './parse-params';

export default async function setProperties(parameters: { [key: string]: string }) {
  try {
    const selection = figma.currentPage.selection;
    if (selection && selection.length > 0) {
      const parsedParams = parseParameters(parameters);

      for (const { param, value } of parsedParams) {
        parameterRouting({ param, value, nodes: selection });
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
