import { getHistory } from './history';
import { flattenCommands, PropItem, propList } from './prop-list';
import { getOriginLabel, ORIGIN_TOKENS, parseOriginToken, splitOriginPrefixedToken, TransformOrigin } from './origin';

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

function hasOperatorPrefix(token: string) {
  return /^(\+\+|--|\*\*|\/\/|\+|-|\*|\/)/.test(token);
}

function isOriginQueryToken(token: string) {
  if (!token) return false;
  if (hasOperatorPrefix(token)) return false;
  if (!/^[a-z]{1,2}:?$/i.test(token)) return false;

  const trimmed = token.trim().toLowerCase();
  const candidate = trimmed.endsWith(':') ? trimmed.slice(0, -1) : trimmed;
  return ORIGIN_TOKENS.some((origin) => origin.startsWith(candidate));
}

function buildOriginSuggestions(values: string[], lastToken: string): Suggestion[] {
  const trimmed = lastToken.trim().toLowerCase();
  const prefix = trimmed.endsWith(':') ? trimmed.slice(0, -1) : trimmed;

  const base = values
    .slice(0, values.length - 1)
    .filter((value) => value.trim() !== '')
    .join(' ');

  const suggestions: Suggestion[] = [];
  for (const origin of ORIGIN_TOKENS) {
    if (!origin.startsWith(prefix)) continue;

    const token = `${origin}:`;
    const label = getOriginLabel(origin);
    const name = base ? `${base} ${token} - Set transform origin to ${label}` : `${token} - Set transform origin to ${label}`;
    const data = base ? `${base} ${token}` : token;
    suggestions.push({ name, data });
  }

  if (suggestions.length === 0) {
    const exact = parseOriginToken(lastToken);
    if (exact) {
      const token = `${exact}:`;
      const label = getOriginLabel(exact);
      const name = base ? `${base} ${token} - Set transform origin to ${label}` : `${token} - Set transform origin to ${label}`;
      const data = base ? `${base} ${token}` : token;
      suggestions.push({ name, data });
    }
  }

  return suggestions;
}

function valueHasExplicitUnit(value: string) {
  return /(px|%)$/i.test(value);
}

function parseScalarValue(value: string) {
  const match = value.match(/^(-?\d*\.?\d+)(?:\/(-?\d*\.?\d+))?(px|%)?$/i);
  if (!match) return null;

  const num = Number(match[1]);
  if (!Number.isFinite(num)) return null;
  const decay = match[2] !== undefined ? Number(match[2]) : null;
  if (decay !== null && !Number.isFinite(decay)) return null;

  return {
    num,
    decay,
    unit: (match[3] ?? '').toLowerCase(),
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

function hasMalformedRangeValue(value: string) {
  if (!value.includes('..')) return false;
  return parseRangeValue(value) === null;
}

function rangeTouchesOrCrossesZero(start: number, end: number) {
  if (start === 0 || end === 0) return true;
  return (start < 0 && end > 0) || (start > 0 && end < 0);
}

function formatOperatorMessage(prefix: string, command: PropItem, renderedValue: string) {
  if (prefix && !command.supportsModifiers) {
    return `Error: ${command.name} does not support modifier operators`;
  }

  if ((prefix === '/' || prefix === '//') && Number(renderedValue.replace(/(px|%)$/i, '')) === 0) {
    return `Error: Division by zero is not allowed`;
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

function withOriginHint(baseMessage: string, command: PropItem, origin: TransformOrigin | null) {
  if (!origin) return baseMessage;
  if (command.supportsOrigin) return `${baseMessage} (origin: ${getOriginLabel(origin)})`;
  return `${baseMessage} (origin ignored)`;
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
  const withUnit = parsed.unit ? `${normalized}${parsed.unit}` : `${normalized}${defaultUnit}`;
  if (parsed.decay !== null) return `${withUnit}/${parsed.decay}`;
  if (parsed.unit) return withUnit;
  if (valueHasExplicitUnit(raw)) return raw;
  return withUnit;
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
      if (rangeTouchesOrCrossesZero(start, end)) {
        return `Error: Division range cannot touch or cross zero`;
      }
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

function composeTokenWithContext(contextTokens: string[], nextToken: string) {
  if (contextTokens.length === 0) return nextToken;

  const tokens = [...contextTokens];
  const last = tokens[tokens.length - 1];
  if (parseOriginToken(last)) {
    tokens[tokens.length - 1] = `${last}${nextToken}`;
    return tokens.join(' ');
  }

  tokens.push(nextToken);
  return tokens.join(' ');
}

export default function getSuggestions({ query }: getSuggestionsProps) {
  const flattenedCommands = flattenCommands(propList, {});

  if (!query) return [];

  const values = query
    .split(' ')
    .flatMap((value) => splitOriginPrefixedToken(value))
    .filter((value) => value.trim() !== '');
  if (values.length === 0) return [];
  const lastToken = values[values.length - 1];

  if (isOriginQueryToken(lastToken)) {
    return buildOriginSuggestions(values, lastToken);
  }

  let suggestions: Suggestion[] = [];
  let suggestionRow: BindedCommand[] = [];
  let activeOrigin: TransformOrigin | null = null;
  const contextTokens = values.slice(0, values.length - 1).filter((token) => token.trim() !== '');

  for (const value of values) {
    const isLast = value === values[values.length - 1];
    if (!isLast) {
      const parsedOrigin = parseOriginToken(value);
      if (parsedOrigin) {
        activeOrigin = parsedOrigin;
        continue;
      }
    }

    const parsed = splitToken(value);
    if (!parsed) continue;

    const { prefix, param, value: paramVal } = parsed;
    const directPrefixedShortcut = `${prefix}${param}`;
    const directPrefixedCommand = prefix ? flattenedCommands[directPrefixedShortcut] : undefined;

    if (isLast) {
      const closestCommand = directPrefixedCommand ?? getClosestSuggestion(param, flattenedCommands);
      if (!closestCommand) continue;

      suggestionRow.push({
        command: closestCommand,
        value: paramVal,
        prefix: directPrefixedCommand ? '' : prefix,
      });
    } else {
      const key = directPrefixedCommand ? directPrefixedShortcut : param;
      if (key in flattenedCommands) {
        const propItem = flattenedCommands[key];
        suggestionRow.push({
          command: propItem,
          value: paramVal,
          prefix: directPrefixedCommand ? '' : prefix,
        });
      }
    }
  }

  suggestions = generateSuggestions(suggestionRow, flattenedCommands, activeOrigin, contextTokens);

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
  flattenedCommands: Record<string, PropItem>,
  activeOrigin: TransformOrigin | null,
  contextTokens: string[]
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
            (scalar !== null &&
              (scalar.num >= 0 || command.allowsNegative === true) &&
              (scalar.decay === null || scalar.decay > 0) &&
              (scalar.decay === null || ['++', '--', '**', '//'].includes(lastCommand.prefix)));

        if (hasMalformedRangeValue(value)) {
          lastMessage = `Error: Invalid range format. Use start..end`;
        } else if (isValidValue) {
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
    lastMessage = withOriginHint(lastMessage, command, activeOrigin);

    const suggestionToken = `${lastCommand.prefix}${command.shortcut}${command.hasValue ? value : ''}`;
    const composed = composeTokenWithContext(contextTokens, suggestionToken);
    suggestionData.name = `${composed} - ${lastMessage}`;

    suggestionData.data = composed;
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
