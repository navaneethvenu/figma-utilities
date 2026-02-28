import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface SetTextSpacingProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

type ValueUnit = 'PIXELS' | 'PERCENT';

interface ParsedValue {
  value: number;
  unit: ValueUnit | null;
}

function parseValueWithUnit(value: string): ParsedValue | null {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/^(-?\d*\.?\d+)(px|%)?$/);
  if (!match) return null;

  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) return null;

  const rawUnit = match[2];
  if (rawUnit === 'px') return { value: numeric, unit: 'PIXELS' };
  if (rawUnit === '%') return { value: numeric, unit: 'PERCENT' };

  return { value: numeric, unit: null };
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

function getFontSize(textNode: TextNode): number | null {
  if (textNode.fontSize === figma.mixed) return null;
  return textNode.fontSize;
}

function convertUnit(value: number, from: ValueUnit, to: ValueUnit, fontSize: number): number {
  if (from === to) return value;
  if (to === 'PERCENT') return (value / fontSize) * 100;
  return (value / 100) * fontSize;
}

function applyLetterSpacing(node: TextNode, parsed: ParsedValue) {
  if (node.letterSpacing === figma.mixed) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `${node.name} has mixed letter spacing`,
    });
    return;
  }

  const fontSize = getFontSize(node);
  const current = node.letterSpacing;
  const targetUnit = parsed.unit ?? current.unit;
  const sourceUnit = parsed.unit ?? targetUnit;
  let targetValue = parsed.value;

  if (sourceUnit !== targetUnit) {
    if (fontSize === null || fontSize <= 0) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `${node.name} cannot convert unit due to mixed/invalid font size`,
      });
      return;
    }
    targetValue = convertUnit(parsed.value, sourceUnit, targetUnit, fontSize);
  }

  node.letterSpacing = { value: targetValue, unit: targetUnit };
}

function getCurrentLineHeightUnit(lineHeight: LineHeight): ValueUnit {
  if (lineHeight.unit === 'AUTO') return 'PERCENT';
  return lineHeight.unit;
}

function applyLineHeight(node: TextNode, parsed: ParsedValue) {
  if (node.lineHeight === figma.mixed) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `${node.name} has mixed line height`,
    });
    return;
  }

  const fontSize = getFontSize(node);
  const current = node.lineHeight;
  const currentUnit = getCurrentLineHeightUnit(current);
  const targetUnit = parsed.unit ?? currentUnit;
  const sourceUnit = parsed.unit ?? targetUnit;
  let targetValue = parsed.value;

  if (sourceUnit !== targetUnit) {
    if (fontSize === null || fontSize <= 0) {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `${node.name} cannot convert unit due to mixed/invalid font size`,
      });
      return;
    }
    targetValue = convertUnit(parsed.value, sourceUnit, targetUnit, fontSize);
  }

  node.lineHeight = { value: targetValue, unit: targetUnit };
}

function convertLetterSpacingUnit(node: TextNode, targetUnit: ValueUnit) {
  if (node.letterSpacing === figma.mixed) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `${node.name} has mixed letter spacing`,
    });
    return;
  }

  const fontSize = getFontSize(node);
  const current = node.letterSpacing;
  if (current.unit === targetUnit) return;

  if (fontSize === null || fontSize <= 0) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `${node.name} cannot convert unit due to mixed/invalid font size`,
    });
    return;
  }

  node.letterSpacing = {
    value: convertUnit(current.value, current.unit, targetUnit, fontSize),
    unit: targetUnit,
  };
}

function convertLineHeightUnit(node: TextNode, targetUnit: ValueUnit) {
  if (node.lineHeight === figma.mixed) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `${node.name} has mixed line height`,
    });
    return;
  }

  const current = node.lineHeight;
  if (current.unit === 'AUTO') {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `${node.name} has AUTO line height; set an explicit lh value first`,
    });
    return;
  }

  if (current.unit === targetUnit) return;

  const fontSize = getFontSize(node);
  if (fontSize === null || fontSize <= 0) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `${node.name} cannot convert unit due to mixed/invalid font size`,
    });
    return;
  }

  node.lineHeight = {
    value: convertUnit(current.value, current.unit, targetUnit, fontSize),
    unit: targetUnit,
  };
}

export default async function setTextSpacing({ param, value, nodes }: SetTextSpacingProps) {
  const needsValue = param === 'ls' || param === 'lh';
  const parsed = needsValue ? parseValueWithUnit(value) : null;
  if (needsValue && !parsed) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: param,
    });
    return;
  }

  for (const node of nodes) {
    if (node.type !== 'TEXT') {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `${param} is only applicable on text nodes, not ${node.type}`,
      });
      continue;
    }

    try {
      await loadFontsForTextNode(node);
    } catch {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Cannot update text spacing on ${node.name}: required fonts are not loaded/available`,
      });
      continue;
    }

    if (param === 'ls') {
      applyLetterSpacing(node, parsed!);
      continue;
    }

    if (param === 'lh') {
      applyLineHeight(node, parsed!);
      continue;
    }

    if (param === 'lsp') {
      convertLetterSpacingUnit(node, 'PERCENT');
      continue;
    }

    if (param === 'lspx') {
      convertLetterSpacingUnit(node, 'PIXELS');
      continue;
    }

    if (param === 'lhp') {
      convertLineHeightUnit(node, 'PERCENT');
      continue;
    }

    if (param === 'lhpx') {
      convertLineHeightUnit(node, 'PIXELS');
      continue;
    }

    notifyError({
      type: ErrorType.INVALID_CMD,
      message: param,
    });
  }
}
