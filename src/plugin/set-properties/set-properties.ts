import { addHistory } from './history';
import parameterRouting from './param-routing';
import parseParameters from './parse-params';

export default async function setProperties(parameters: { [key: string]: string }) {
  try {
    if (figma.currentPage.selection && figma.currentPage.selection.length > 0) {
      const parsedParams = parseParameters(parameters);

      for (const { param, value } of parsedParams) {
        const currentSelection = figma.currentPage.selection;
        if (!currentSelection || currentSelection.length === 0) {
          figma.notify('Selection became empty while applying commands.');
          return;
        }

        parameterRouting({ param, value, nodes: currentSelection });
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
