import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface SetGapProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

function isAutoLayoutContainer(node: SceneNode): node is SceneNode & AutoLayoutMixin {
  return 'layoutMode' in node && 'itemSpacing' in node;
}

export default function setGap({ param, value, nodes }: SetGapProps) {
  const gap = Number(value);
  if (!Number.isFinite(gap)) {
    notifyError({
      type: ErrorType.INVALID_VAL,
      message: param,
    });
    return;
  }

  for (const node of nodes) {
    if (!isAutoLayoutContainer(node) || node.layoutMode === 'NONE') {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Gap is not applicable on node type ${node.type}`,
      });
      continue;
    }

    if (param === 'gap') {
      node.itemSpacing = gap;
      if (node.layoutWrap === 'WRAP' && node.counterAxisSpacing !== null) {
        node.counterAxisSpacing = gap;
      }
      continue;
    }

    if (param === 'gapx') {
      if (node.layoutMode === 'HORIZONTAL') {
        node.itemSpacing = gap;
      } else if (node.layoutWrap === 'WRAP' && node.counterAxisSpacing !== null) {
        node.counterAxisSpacing = gap;
      } else {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `gapx requires a horizontal or wrapped auto-layout on ${node.name}`,
        });
      }
      continue;
    }

    if (param === 'gapy') {
      if (node.layoutMode === 'VERTICAL') {
        node.itemSpacing = gap;
      } else if (node.layoutWrap === 'WRAP' && node.counterAxisSpacing !== null) {
        node.counterAxisSpacing = gap;
      } else {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `gapy requires a vertical or wrapped auto-layout on ${node.name}`,
        });
      }
      continue;
    }

    notifyError({
      type: ErrorType.INVALID_CMD,
      message: param,
    });
  }
}
