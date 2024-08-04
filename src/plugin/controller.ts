import getCount from './count/get-count';
import setProperties from './set-properties/set-properties';
import getSuggestions, { getDefaultSuggestions } from './set-properties/suggestions';

figma.parameters.on('input', async ({ key, query, result }) => {
  let suggestions: { name: string; data: any }[] = [];

  switch (key) {
    case 'type':
      suggestions = [
        { name: `Top-Level`, data: { name: 'Top-Level', id: 'top-level' } },
        { name: `Nested`, data: { name: 'Nested', id: 'nested' } },
      ];
      result.setSuggestions(suggestions);
      break;
    case 'property':
      suggestions = [];

      suggestions.push(...(await getDefaultSuggestions()));

      //filter duplicates
      suggestions = suggestions.filter(
        (item1, index, array) => array.findIndex((item2) => item1.data === item2.data) === index
      );

      if (query !== '' && query !== undefined) {
        suggestions.unshift(...getSuggestions({ query }));
      }

      if (suggestions === null || suggestions === undefined) suggestions = [];
      result.setSuggestions(suggestions);
      break;
    default:
      return;
  }
});

figma.on('run', async ({ command, parameters }: RunEvent) => {
  if (command == 'count') {
    if (parameters !== null && parameters !== undefined) {
      if (parameters['type'] !== null && parameters['type'] !== undefined) {
        if (parameters['type'].id === 'nested') {
          getCount(true);
        } else {
          getCount(false);
        }
      } else {
        getCount(false);
      }
    }
  } else if (command == 'set-properties') {
    if (parameters !== null && parameters !== undefined) {
      await setProperties(parameters);
    }
  } else {
    figma.notify('hey');
  }
  figma.closePlugin();
});
