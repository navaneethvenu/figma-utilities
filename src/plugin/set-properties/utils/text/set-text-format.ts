import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface SetTextFormatProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

type TextAlignToken = 'l' | 'left' | 'c' | 'center' | 'r' | 'right' | 'j' | 'justify' | 'justified';
type TextCaseToken =
  | 'none'
  | 'original'
  | 'upper'
  | 'uppercase'
  | 'lower'
  | 'lowercase'
  | 'title'
  | 'smallcaps'
  | 'small_caps'
  | 'smallcapsforced'
  | 'small_caps_forced';
type TextCaseTransformToken = 'upper' | 'lower' | 'title' | 'sentence';

let availableFontsCache: readonly Font[] | null = null;

const WEIGHT_ALIASES: Record<string, number> = {
  thin: 100,
  hairline: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  regular: 400,
  normal: 400,
  book: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  black: 900,
  heavy: 900,
};

function parseFontSize(value: string): number | null {
  const match = value.trim().toLowerCase().match(/^(-?\d*\.?\d+)(px)?$/);
  if (!match) return null;
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric;
}

function parseFontWeight(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  if (WEIGHT_ALIASES[normalized] !== undefined) return WEIGHT_ALIASES[normalized];

  if (!/^\d{3}$/.test(normalized)) return null;
  const numeric = Number(normalized);
  if (numeric < 100 || numeric > 900 || numeric % 100 !== 0) return null;
  return numeric;
}

function parseTextAlign(value: string): 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED' | null {
  const normalized = value.trim().toLowerCase() as TextAlignToken;
  switch (normalized) {
    case 'l':
    case 'left':
      return 'LEFT';
    case 'c':
    case 'center':
      return 'CENTER';
    case 'r':
    case 'right':
      return 'RIGHT';
    case 'j':
    case 'justify':
    case 'justified':
      return 'JUSTIFIED';
    default:
      return null;
  }
}

function parseFigmaTextCase(value: string): TextCase | null {
  const normalized = value.trim().toLowerCase() as TextCaseToken;
  switch (normalized) {
    case 'none':
    case 'original':
      return 'ORIGINAL';
    case 'upper':
    case 'uppercase':
      return 'UPPER';
    case 'lower':
    case 'lowercase':
      return 'LOWER';
    case 'title':
      return 'TITLE';
    case 'smallcaps':
    case 'small_caps':
      return 'SMALL_CAPS';
    case 'smallcapsforced':
    case 'small_caps_forced':
      return 'SMALL_CAPS_FORCED';
    default:
      return null;
  }
}

async function listAvailableFontsCached() {
  if (!availableFontsCache) {
    availableFontsCache = await figma.listAvailableFontsAsync();
  }
  return availableFontsCache;
}

async function loadFontsForTextNode(node: TextNode) {
  const fonts = new Map<string, FontName>();

  if (node.characters.length > 0) {
    const rangeFonts = node.getRangeAllFontNames(0, node.characters.length);
    for (const font of rangeFonts) {
      fonts.set(`${font.family}:::${font.style}`, font);
    }
  } else if (node.fontName !== figma.mixed) {
    const font = node.fontName as FontName;
    fonts.set(`${font.family}:::${font.style}`, font);
  }

  await Promise.all(Array.from(fonts.values()).map((font) => figma.loadFontAsync(font)));
}

function scoreStyleWeight(styleName: string): number {
  const normalized = styleName.toLowerCase();
  if (normalized.includes('thin') || normalized.includes('hairline')) return 100;
  if (normalized.includes('extra light') || normalized.includes('extralight') || normalized.includes('ultra light')) return 200;
  if (normalized.includes('light')) return 300;
  if (normalized.includes('regular') || normalized.includes('normal') || normalized.includes('book')) return 400;
  if (normalized.includes('medium')) return 500;
  if (normalized.includes('semi bold') || normalized.includes('semibold') || normalized.includes('demi bold') || normalized.includes('demibold')) return 600;
  if (normalized.includes('bold') && !(normalized.includes('extra') || normalized.includes('ultra'))) return 700;
  if (normalized.includes('extra bold') || normalized.includes('extrabold') || normalized.includes('ultra bold') || normalized.includes('ultrabold')) return 800;
  if (normalized.includes('black') || normalized.includes('heavy')) return 900;

  const numeric = normalized.match(/(^|\D)([1-9]00)(\D|$)/);
  if (numeric) return Number(numeric[2]);
  return 400;
}

function applyActualCase(value: string, mode: TextCaseTransformToken): string {
  switch (mode) {
    case 'upper':
      return value.toLocaleUpperCase();
    case 'lower':
      return value.toLocaleLowerCase();
    case 'title':
      return value.replace(/\S+/g, (word) => {
        const [first = '', ...rest] = Array.from(word.toLocaleLowerCase());
        return `${first.toLocaleUpperCase()}${rest.join('')}`;
      });
    case 'sentence': {
      let shouldCapitalize = true;
      return Array.from(value.toLocaleLowerCase())
        .map((char) => {
          if (shouldCapitalize && /[A-Za-z]/.test(char)) {
            shouldCapitalize = false;
            return char.toLocaleUpperCase();
          }
          if (/[.!?]/.test(char)) shouldCapitalize = true;
          return char;
        })
        .join('');
    }
    default:
      return value;
  }
}

async function setFontWeight(node: TextNode, targetWeight: number) {
  if (node.fontName === figma.mixed) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `${node.name} has mixed fonts; normalize font style before using fw`,
    });
    return;
  }

  const current = node.fontName as FontName;
  const availableFonts = await listAvailableFontsCached();
  const familyFonts = availableFonts.filter((font) => font.fontName.family === current.family);

  if (familyFonts.length === 0) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `No available fonts found for family ${current.family}`,
    });
    return;
  }

  let best = familyFonts[0].fontName;
  let bestScore = Math.abs(scoreStyleWeight(best.style) - targetWeight);
  for (const font of familyFonts) {
    const score = Math.abs(scoreStyleWeight(font.fontName.style) - targetWeight);
    if (score < bestScore) {
      best = font.fontName;
      bestScore = score;
    }
  }

  await figma.loadFontAsync(best);
  node.fontName = best;
}

export default async function setTextFormat({ param, value, nodes }: SetTextFormatProps) {
  if (param === 'fs') {
    const fontSize = parseFontSize(value);
    if (fontSize === null) {
      notifyError({ type: ErrorType.INVALID_VAL, message: param });
      return;
    }

    for (const node of nodes) {
      if (node.type !== 'TEXT') {
        notifyError({ type: ErrorType.UNSUPPORTED_PROP, message: `${param} is only applicable on text nodes, not ${node.type}` });
        continue;
      }

      try {
        await loadFontsForTextNode(node);
        node.fontSize = fontSize;
      } catch {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Cannot update font size on ${node.name}: required fonts are not loaded/available`,
        });
      }
    }
    return;
  }

  if (param === 'fw') {
    const fontWeight = parseFontWeight(value);
    if (fontWeight === null) {
      notifyError({ type: ErrorType.INVALID_VAL, message: param });
      return;
    }

    for (const node of nodes) {
      if (node.type !== 'TEXT') {
        notifyError({ type: ErrorType.UNSUPPORTED_PROP, message: `${param} is only applicable on text nodes, not ${node.type}` });
        continue;
      }

      try {
        await setFontWeight(node, fontWeight);
      } catch {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Cannot update font weight on ${node.name}: required fonts are not loaded/available`,
        });
      }
    }
    return;
  }

  if (param === 'ta') {
    const align = parseTextAlign(value);
    if (!align) {
      notifyError({ type: ErrorType.INVALID_VAL, message: param });
      return;
    }

    for (const node of nodes) {
      if (node.type !== 'TEXT') {
        notifyError({ type: ErrorType.UNSUPPORTED_PROP, message: `${param} is only applicable on text nodes, not ${node.type}` });
        continue;
      }
      try {
        await loadFontsForTextNode(node);
        node.textAlignHorizontal = align;
      } catch {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Cannot update text alignment on ${node.name}: required fonts are not loaded/available`,
        });
      }
    }
    return;
  }

  if (param === 'tt') {
    const textCase = parseFigmaTextCase(value);
    if (!textCase) {
      notifyError({ type: ErrorType.INVALID_VAL, message: param });
      return;
    }

    for (const node of nodes) {
      if (node.type !== 'TEXT') {
        notifyError({ type: ErrorType.UNSUPPORTED_PROP, message: `${param} is only applicable on text nodes, not ${node.type}` });
        continue;
      }
      try {
        await loadFontsForTextNode(node);
        node.textCase = textCase;
      } catch {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Cannot update text case on ${node.name}: required fonts are not loaded/available`,
        });
      }
    }
    return;
  }

  if (param === 'upper' || param === 'lower' || param === 'title' || param === 'sentence') {
    const transform = param as TextCaseTransformToken;

    for (const node of nodes) {
      if (node.type !== 'TEXT') {
        notifyError({ type: ErrorType.UNSUPPORTED_PROP, message: `${param} is only applicable on text nodes, not ${node.type}` });
        continue;
      }

      try {
        await loadFontsForTextNode(node);
        node.characters = applyActualCase(node.characters, transform);
        node.textCase = 'ORIGINAL';
      } catch {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Cannot transform text case on ${node.name}: required fonts are not loaded/available`,
        });
      }
    }
    return;
  }

  notifyError({ type: ErrorType.INVALID_CMD, message: param });
}
