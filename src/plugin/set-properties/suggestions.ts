import { getHistory } from './history';
import { flattenCommands, PropItem, propList } from './prop-list';

interface getSuggestionsProps {
  query: string;
}

interface BindedCommand {
  command: PropItem;
  value: string;
  prefix: string;
}

interface Suggestion {
  name: string;
  data: string;
}

function valueHasExplicitUnit(value: string) {
  return /(px|%)$/i.test(value);
}

function parseScalarValue(value: string) {
  const match = value.match(/^(-?\d*\.?\d+)(px|%)?$/i);
  if (!match) return null;

  const num = Number(match[1]);
  if (!Number.isFinite(num)) return null;

  return {
    num,
    unit: (match[2] ?? '').toLowerCase(),
  };
}

function parseRangeValue(value: string) {
  const match = value.match(/^(-?\d*\.?\d+)\.\.(-?\d*\.?\d+)$/);
  if (!match) return null;

  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

  return { start, end };
}

function formatOperatorMessage(prefix: string, command: PropItem, renderedValue: string) {
  if (prefix && !command.supportsModifiers) {
    return `Error: ${command.name} does not support modifier operators`;
  }

  switch (prefix) {
    case '+':
      return `Increase ${command.name} by ${renderedValue}`;
    case '-':
      return `Decrease ${command.name} by ${renderedValue}`;
    case '*':
      return `Multiply ${command.name} by ${renderedValue}`;
    case '/':
      return `Divide ${command.name} by ${renderedValue}`;
    case '++':
      return `Sequentially increase ${command.name} by ${renderedValue}`;
    case '--':
      return `Sequentially decrease ${command.name} by ${renderedValue}`;
    case '**':
      return `Sequentially multiply ${command.name} by ${renderedValue}`;
    case '//':
      return `Sequentially divide ${command.name} by ${renderedValue}`;
    default:
      if (command.message) return `${command.message} ${renderedValue}`;
      return `Set ${command.name} to ${renderedValue}`;
  }
}

function formatOperatorPlaceholder(prefix: string, command: PropItem) {
  if (prefix && !command.supportsModifiers) {
    return `Error: ${command.name} does not support modifier operators`;
  }

  switch (prefix) {
    case '+':
      return `Increase ${command.name} by (Enter Value)`;
    case '-':
      return `Decrease ${command.name} by (Enter Value)`;
    case '*':
      return `Multiply ${command.name} by (Enter Value)`;
    case '/':
      return `Divide ${command.name} by (Enter Value)`;
    case '++':
      return `Sequentially increase ${command.name} by (Enter Value)`;
    case '--':
      return `Sequentially decrease ${command.name} by (Enter Value)`;
    case '**':
      return `Sequentially multiply ${command.name} by (Enter Value)`;
    case '//':
      return `Sequentially divide ${command.name} by (Enter Value)`;
    default:
      return `Set ${command.name} to (Enter Value)`;
  }
}

function renderScalarValue(raw: string, defaultUnit: string) {
  const parsed = parseScalarValue(raw);
  if (!parsed) return raw;

  const normalized = String(parsed.num);
  if (parsed.unit) return `${normalized}${parsed.unit}`;
  if (valueHasExplicitUnit(raw)) return raw;
  return `${normalized}${defaultUnit}`;
}

function formatRangeMessage(prefix: string, command: PropItem, start: number, end: number, unit: string) {
  if (prefix && !command.supportsModifiers) {
    return `Error: ${command.name} does not support modifier operators`;
  }

  const from = `${start}${unit}`;
  const to = `${end}${unit}`;

  switch (prefix) {
    case '+':
      return `Increase ${command.name} from ${from} to ${to} across selection`;
    case '-':
      return `Decrease ${command.name} from ${from} to ${to} across selection`;
    case '*':
      return `Multiply ${command.name} from ${from} to ${to} across selection`;
    case '/':
      return `Divide ${command.name} from ${from} to ${to} across selection`;
    case '++':
    case '--':
    case '**':
    case '//':
      return `Error: Sequential operators do not support range values`;
    default:
      return `Set ${command.name} from ${from} to ${to} across selection`;
  }
}

function splitToken(token: string) {
  const match = token.match(/^(\+\+|--|\*\*|\/\/|\+|-|\*|\/)?([A-Za-z]+)(.*)$/);
  if (!match) return null;
  return { prefix: match[1] ?? '', param: match[2], value: match[3] ?? '' };
}

export default function getSuggestions({ query }: getSuggestionsProps) {
  const flattenedCommands = flattenCommands(propList, {});

  if (!query) return [];

  const values = query.split(' ');

  let suggestions: Suggestion[] = [];
  let suggestionRow: BindedCommand[] = [];

  for (const value of values) {
    const isLast = value === values[values.length - 1];
    const parsed = splitToken(value);
    if (!parsed) continue;

    const { prefix, param, value: paramVal } = parsed;

    if (isLast) {
      const closestCommand = getClosestSuggestion(param, flattenedCommands);
      if (!closestCommand) continue;

      suggestionRow.push({
        command: closestCommand,
        value: paramVal,
        prefix,
      });
    } else {
      if (param in flattenedCommands) {
        const propItem = flattenedCommands[param];
        suggestionRow.push({
          command: propItem,
          value: paramVal,
          prefix,
        });
      }
    }
  }

  suggestions = generateSuggestions(suggestionRow, flattenedCommands);

  return suggestions;
}

function getClosestSuggestion(param: string, flattenedCommands: Record<string, PropItem>): PropItem | undefined {
  for (const command in flattenedCommands) {
    if (command.startsWith(param)) {
      return flattenedCommands[command];
    }
  }
}

function generateSuggestions(
  suggestionRow: BindedCommand[],
  flattenedCommands: Record<string, PropItem>
): Suggestion[] {
  let suggestions: Suggestion[] = [];
  const suggestionCommands: BindedCommand[][] = [];

  if (suggestionRow.length === 0) return [];

  const lastItem: BindedCommand = suggestionRow[suggestionRow.length - 1];
  const commandVariants: BindedCommand[] = getSuggestedCommands(lastItem, flattenedCommands);

  for (const commandVariant of commandVariants) {
    suggestionCommands.push([...suggestionRow.slice(0, suggestionRow.length - 1), commandVariant]);
  }

  for (const suggestionCommandList of suggestionCommands) {
    let suggestionData: { name: string; data: string } = { name: '', data: '' };
    suggestionData.name = suggestionCommandList
      .map((command) =>
        command.command.hasValue
          ? command.prefix + command.command.shortcut + command.value
          : command.prefix + command.command.shortcut
      )
      .slice(0, suggestionCommandList.length - 1)
      .join(', ');

    const lastCommand = suggestionCommandList[suggestionCommandList.length - 1];

    let lastMessage = '';
    const { value, command } = lastCommand;

    if (command.hasValue) {
      if (lastCommand.value !== '') {
        const isFillCommand = command.shortcut.toLowerCase() === 'f';
        const range = parseRangeValue(value);
        const scalar = parseScalarValue(value);

        const isValidValue = isFillCommand
          ? /^#?[0-9a-fA-F]+$/.test(value) // hex color validation, accepts optional leading #
          : range !== null ||
            (scalar !== null && (scalar.num >= 0 || command.allowsNegative === true));

        if (isValidValue) {
          const defaultUnit = command.unit === undefined ? 'px' : command.unit;
          if (range) {
            lastMessage = formatRangeMessage(lastCommand.prefix, command, range.start, range.end, defaultUnit);
          } else {
            const renderedValue = renderScalarValue(value, defaultUnit);
            lastMessage = formatOperatorMessage(lastCommand.prefix, command, renderedValue);
          }
        } else {
          lastMessage = `Error: ${command.name} cannot have invalid or negative values`;
        }
      } else lastMessage = formatOperatorPlaceholder(lastCommand.prefix, command);
    } else {
      if (command.message) lastMessage = command.message;
      else lastMessage = command.name;
    }

    const newName = `${lastCommand.prefix}${command.shortcut}${command.hasValue ? value : ''} - ${lastMessage}`;
    suggestionData.name = suggestionData.name ? `${suggestionData.name}, ${newName}` : newName;

    suggestionData.data = suggestionCommandList
      .map((command) => command.prefix + command.command.shortcut + command.value)
      .join(' ');
    if (command.action) {
      suggestions.push(suggestionData);
    }
  }

  return suggestions;
}

function getSuggestedCommands(item: BindedCommand, flattenedCommands: Record<string, PropItem>) {
  const commands: BindedCommand[] = [];
  for (const command in flattenedCommands) {
    if (command.startsWith(item.command.shortcut)) {
      commands.push({ command: flattenedCommands[command], value: item.value, prefix: item.prefix });
    }
  }
  return commands;
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
