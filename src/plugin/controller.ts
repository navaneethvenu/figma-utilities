import getCount from './count/get-count';
import setProperties from './set-properties/set-properties';

figma.parameters.on('input', ({ key, query, result }) => {
  let suggestions: any;
  switch (key) {
    case 'type':
      suggestions = [
        { name: `Top-Level`, data: { name: 'Top-Level', id: 'top-level' } },
        { name: `Nested`, data: { name: 'Nested', id: 'nested' } },
      ];
      result.setSuggestions(suggestions);
      break;
    case 'property':
      suggestions = [query];
      result.setSuggestions(suggestions);
      break;
    default:
      return;
  }
});

figma.on('run', ({ command, parameters }: RunEvent) => {
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
      setProperties(parameters);
    }
  } else {
    figma.notify('hey');
  }
  figma.closePlugin();
});
