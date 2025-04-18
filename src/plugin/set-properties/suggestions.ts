import { baseRegex } from './base-regex';
import { getHistory } from './history';
import { flattenCommands, PropItem, propList } from './prop-list';

interface getSuggestionsProps {
  query: string;
}

interface BindedCommand {
  command: PropItem;
  value: string;
}

export default function getSuggestions({ query }: getSuggestionsProps) {
  const flattenedCommands = flattenCommands(propList, {});
  const suggestionCommands: BindedCommand[][] = [];

  if (query !== undefined) {
    const values = query.split(' ');

    const suggestions: { name: string; data: string }[] = [];
    let suggestionRow: BindedCommand[] = [];

    for (const value of values) {
      const match = value.match(baseRegex);
      if (match !== null) {
        const subgroups = baseRegex.exec(value);
        if (subgroups.length === 3) {
          const param = subgroups[1];
          const paramVal = subgroups[2];
          if (param in flattenedCommands) {
            const propItem = flattenedCommands[param];
            suggestionRow.push({
              command: propItem,
              value: paramVal,
            });
          } else {
            console.log('missed all suggestions');
          }
        }
      }
    }

    if (suggestionRow.length > 0) {
      const lastItem: BindedCommand = suggestionRow[suggestionRow.length - 1];
      const commandVariants: BindedCommand[] = getNestedCommands(lastItem);

      for (const commandVariant of commandVariants) {
        suggestionCommands.push([...suggestionRow.slice(0, suggestionRow.length - 1), commandVariant]);
      }

      for (const suggestionCommandList of suggestionCommands) {
        let suggestionData: { name: string; data: string } = { name: '', data: '' };
        suggestionData.name = suggestionCommandList
          .map((command) => command.command.shortcut + command.value)
          .slice(0, suggestionCommandList.length - 1)
          .join(', ');
        const lastCommand = suggestionCommandList[suggestionCommandList.length - 1];
        let lastMessage = '';
        if (lastCommand.command.hasValue) {
          if (lastCommand.value !== '') {
            if (Math.sign(parseFloat(lastCommand.value)) >= 0 || lastCommand.command.allowsNegative === true) {
              const unit = lastCommand.command.unit === undefined ? 'px' : lastCommand.command.unit;
              lastMessage = `Set ${lastCommand.command.name} to ${lastCommand.value}${unit}`;
            } else {
              lastMessage = `Error: ${lastCommand.command.name} cannot have negative values`;
            }
          } else lastMessage = `Set ${lastCommand.command.name} to (Enter Value)`;
        } else {
          lastMessage = lastCommand.command.name;
        }

        if (suggestionData.name === '')
          suggestionData.name = lastCommand.command.shortcut + lastCommand.value + ' - ' + lastMessage;
        else
          suggestionData.name = [
            suggestionData.name,
            lastCommand.command.shortcut + lastCommand.value + ' - ' + lastMessage,
          ].join(', ');

        suggestionData.data = suggestionCommandList
          .map((command) => command.command.shortcut + command.value)
          .join(' ');
        suggestions.push(suggestionData);
      }

      return suggestions;
    }

    function getNestedCommands(item: BindedCommand) {
      const commands: BindedCommand[] = [];
      commands.push(item);
      if (item.command.subcommands) {
        for (const subPropItem of Object.values(item.command.subcommands)) {
          const subCommandVariants = getNestedCommands({ command: subPropItem, value: item.value });
          commands.push(...subCommandVariants);
        }
      }
      return commands;
    }
  }
}

export async function getDefaultSuggestions() {
  const history = await getHistory();
  const suggestions: { name: string; data: string }[] = [];

  for (const historySuggestion of history) {
    const suggestionText = historySuggestion.map((item) => item.param + item.value).join(' ');
    suggestions.push({
      name: suggestionText,
      data: suggestionText,
    });
  }

  return suggestions;
}
