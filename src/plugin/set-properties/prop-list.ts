import { parameterRoutingProps } from './param-routing';
import setHeight from './utils/set-dimensions/set-height';
import setPadding from './utils/padding/set-padding';
import setPosition from './utils/position/set-pos';
import setRadius from './utils/set-radius';
import setStrokeWidth from './utils/stroke/set-stroke-width';
import setWidth from './utils/set-dimensions/set-width';
import toggleClip from './utils/toggle-clip';
import setSize from './utils/set-dimensions/set-size';
import setScaleHeight from './utils/set-dimensions/set-scale-height';
import setScaleWidth from './utils/set-dimensions/set-scale-width';
import setQuickSelect from './utils/set-quick-select';
import setConstraints from './utils/set-constraints/set-constraints';
import dockWithConstraints from './utils/dock-with-constraints/dock-with-constraints';
import dockOutWithConstraints from './utils/dock-out-with-constraints/dock-out-with-constraints';
import setStrokeAlign from './utils/stroke/set-stroke-align';
import filterSelection from './utils/selection/filter-selection';
import excludeSelection from './utils/selection/exclude-selection';
import traverseSelection from './utils/selection/traverse-selection';
import countSelectedElements from './utils/count/count';
import { swapSelectedElements } from './utils/swap/swap-position';
import { fitToParent } from './utils/fit/fit';
import setFill, { addFill, deleteFill, insertFill } from './utils/color/replace-fill';
import setStroke, { addStroke, deleteStroke, insertStroke } from './utils/color/replace-stroke';
import setAutolayoutBehavior from './utils/autolayout/set-autolayout-behavior';
import applyAutolayout from './utils/autolayout/apply-autolayout';
import wrapInFrame from './utils/wrap/wrap-in-frame';
import setRotation from './utils/rotation/set-rotation';
import setOpacity from './utils/opacity/set-opacity';
import setGap from './utils/autolayout/set-gap';
import setTextSpacing from './utils/text/set-text-spacing';
import duplicateSelection from './utils/duplicate/duplicate';

export interface PropItem {
  name: string;
  shortcut: string;
  hasValue?: boolean;
  subcommands?: Record<string, PropItem>;
  allowsNegative?: boolean;
  supportsModifiers?: boolean;
  supportsOrigin?: boolean;
  getModifierValue?: (node: SceneNode) => number | null;
  unit?: string;
  message?: string;
  description?: string;
  notes?: string;
  examples?: Array<{ token: string; help: string }>;
  type?: 'GROUP' | 'ACTION';
  action?: ({ param, value, nodes }: parameterRoutingProps) => void | Promise<void>;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readNumberProp(prop: string) {
  return (node: SceneNode): number | null => {
    if (!(prop in node)) return null;
    return asFiniteNumber((node as any)[prop]);
  };
}

function readOpacityPct(node: SceneNode): number | null {
  if (!('opacity' in node)) return null;
  return asFiniteNumber(node.opacity * 100);
}

function readPaddingLeft(node: SceneNode): number | null {
  if (!('layoutMode' in node) || node.layoutMode === 'NONE') return null;
  return asFiniteNumber(node.paddingLeft);
}

function readPaddingRight(node: SceneNode): number | null {
  if (!('layoutMode' in node) || node.layoutMode === 'NONE') return null;
  return asFiniteNumber(node.paddingRight);
}

function readPaddingTop(node: SceneNode): number | null {
  if (!('layoutMode' in node) || node.layoutMode === 'NONE') return null;
  return asFiniteNumber(node.paddingTop);
}

function readPaddingBottom(node: SceneNode): number | null {
  if (!('layoutMode' in node) || node.layoutMode === 'NONE') return null;
  return asFiniteNumber(node.paddingBottom);
}

function isAutoLayoutContainer(node: SceneNode): node is SceneNode & AutoLayoutMixin {
  return 'layoutMode' in node && 'itemSpacing' in node;
}

function readGap(node: SceneNode): number | null {
  if (!isAutoLayoutContainer(node) || node.layoutMode === 'NONE') return null;
  return asFiniteNumber(node.itemSpacing);
}

function readGapX(node: SceneNode): number | null {
  if (!isAutoLayoutContainer(node) || node.layoutMode === 'NONE') return null;
  if (node.layoutMode === 'HORIZONTAL') return asFiniteNumber(node.itemSpacing);
  if (node.layoutWrap === 'WRAP' && node.counterAxisSpacing !== null) return asFiniteNumber(node.counterAxisSpacing);
  return null;
}

function readGapY(node: SceneNode): number | null {
  if (!isAutoLayoutContainer(node) || node.layoutMode === 'NONE') return null;
  if (node.layoutMode === 'VERTICAL') return asFiniteNumber(node.itemSpacing);
  if (node.layoutWrap === 'WRAP' && node.counterAxisSpacing !== null) return asFiniteNumber(node.counterAxisSpacing);
  return null;
}

function readLetterSpacing(node: SceneNode): number | null {
  if (node.type !== 'TEXT') return null;
  if (node.letterSpacing === figma.mixed) return null;
  return asFiniteNumber(node.letterSpacing.value);
}

function readLineHeight(node: SceneNode): number | null {
  if (node.type !== 'TEXT') return null;
  if (node.lineHeight === figma.mixed) return null;
  if (node.lineHeight.unit === 'AUTO') return null;
  return asFiniteNumber(node.lineHeight.value);
}

const rawPropList: Record<string, PropItem> = {
  //Position
  pos: {
    name: 'Position',
    description: 'Shortcuts for setting and adjusting the position of elements.',
    shortcut: 'pos',
    type: 'GROUP',
    subcommands: {
      xy: {
        name: 'Position',
        shortcut: 'xy',
        description: 'Command group for Position. Start with: x, y.',
        hasValue: true,
        subcommands: {
          x: {
            name: 'Position X',
            shortcut: 'x',
            description: 'Use x<value> to set Position X.',
            hasValue: true,
            allowsNegative: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('x'),
            action: ({ param, value, nodes }) => setPosition({ param, value, nodes }),
          },
          y: {
            name: 'Position Y',
            shortcut: 'y',
            description: 'Use y<value> to set Position Y.',
            hasValue: true,
            allowsNegative: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('y'),
            action: ({ param, value, nodes }) => setPosition({ param, value, nodes }),
          },
          //Move
        },
        allowsNegative: true,
        action: ({ param, value, nodes }) => setPosition({ param, value, nodes }),
      },
      //Dock In with Constraints
      d: {
        name: 'Dock In',
        shortcut: 'd',
        type: 'GROUP',
        description: 'Dock elements inside a container according to directional constraints.',
        subcommands: {
          dl: {
            name: 'Dock to Left',
            shortcut: 'dl',
            description: 'Run Dock to Left using dl.',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
          },
          dr: {
            name: 'Dock to Right',
            shortcut: 'dr',
            description: 'Run Dock to Right using dr.',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
          },
          dt: {
            name: 'Dock to Top',
            shortcut: 'dt',
            description: 'Command group for Dock to Top. Start with: dtl, dtr.',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
            subcommands: {
              dtl: {
                name: 'Dock to Top Left',
                shortcut: 'dtl',
                description: 'Run Dock to Top Left using dtl.',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
              },
              dtr: {
                name: 'Dock to Top Right',
                shortcut: 'dtr',
                description: 'Run Dock to Top Right using dtr.',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
              },
            },
          },
          db: {
            name: 'Dock to Bottom',
            shortcut: 'db',
            description: 'Command group for Dock to Bottom. Start with: dbl, dbr.',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
            subcommands: {
              dbl: {
                name: 'Dock to Bottom Left',
                shortcut: 'dbl',
                description: 'Run Dock to Bottom Left using dbl.',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
              },
              dbr: {
                name: 'Dock to Bottom Right',
                shortcut: 'dbr',
                description: 'Run Dock to Bottom Right using dbr.',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
              },
            },
          },
        },
      },

      //Dock out with Constraints
      D: {
        name: 'Dock Out',
        shortcut: 'D',
        type: 'GROUP',
        description: 'Dock elements outside a container according to directional constraints.',

        subcommands: {
          DL: {
            name: 'Dock out Left',
            shortcut: 'DL',
            description: 'Run Dock out Left using DL.',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
          },
          DR: {
            name: 'Dock out Right',
            shortcut: 'DR',
            description: 'Run Dock out Right using DR.',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
          },
          DT: {
            name: 'Dock out Top',
            shortcut: 'DT',
            description: 'Command group for Dock out Top. Start with: DTL, DTR.',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
            subcommands: {
              DTL: {
                name: 'Dock out to Top Left',
                shortcut: 'DTL',
                description: 'Run Dock out to Top Left using DTL.',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
              },
              DTR: {
                name: 'Dock out to Top Right',
                shortcut: 'DTR',
                description: 'Run Dock out to Top Right using DTR.',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
              },
            },
          },
          DB: {
            name: 'Dock out Bottom',
            shortcut: 'DB',
            description: 'Command group for Dock out Bottom. Start with: DBL, DBR.',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
            subcommands: {
              DBL: {
                name: 'Dock out to Bottom Left',
                shortcut: 'DBL',
                description: 'Run Dock out to Bottom Left using DBL.',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
              },
              DBR: {
                name: 'Dock out to Bottom Right',
                shortcut: 'DBR',
                description: 'Run Dock out to Bottom Right using DBR.',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
              },
            },
          },
        },
      },
    },
  },

  //Size
  size: {
    name: 'Size',
    description: 'Shortcuts for resizing elements, adjusting width, height, scale, and fitting to parent.',
    shortcut: 'size',
    type: 'GROUP',
    subcommands: {
      //Width
      w: {
        name: 'Width',
        shortcut: 'w',
        description: 'Use w<value> to set Width.',
        hasValue: true,
        allowsNegative: false,
        supportsModifiers: true,
        supportsOrigin: true,
        getModifierValue: readNumberProp('width'),
        action: ({ param, value, nodes, origin }) => setWidth({ param, value, nodes, origin }),
      },

      //Height
      h: {
        name: 'Height',
        shortcut: 'h',
        description: 'Use h<value> to set Height.',
        hasValue: true,
        allowsNegative: false,
        supportsModifiers: true,
        supportsOrigin: true,
        getModifierValue: readNumberProp('height'),
        action: ({ param, value, nodes, origin }) => setHeight({ param, value, nodes, origin }),
      },

      //Scale
      sc: {
        name: 'Scale',
        shortcut: 'sc',
        description: 'Command group for Scale. Start with: sc:w, sc:h.',
        type: 'GROUP',
        subcommands: {
          'sc:w': {
            name: 'Scale to Width',
            shortcut: 'sc:w',
            description: 'Use sc:w<value> to set Scale to Width.',
            hasValue: true,
            allowsNegative: false,
            supportsModifiers: true,
            supportsOrigin: true,
            getModifierValue: readNumberProp('width'),
            action: ({ param, value, nodes, origin }) => setScaleWidth({ param, value, nodes, origin }),
          },
          'sc:h': {
            name: 'Scale to Height',
            shortcut: 'sc:h',
            description: 'Use sc:h<value> to set Scale to Height.',
            hasValue: true,
            allowsNegative: false,
            supportsModifiers: true,
            supportsOrigin: true,
            getModifierValue: readNumberProp('height'),
            action: ({ param, value, nodes, origin }) => setScaleHeight({ param, value, nodes, origin }),
          },
        },
      },

      //Width + Height
      wh: {
        name: 'Width and Height',
        shortcut: 'wh',
        description: 'Use wh<value> to set Width and Height.',
        hasValue: true,
        allowsNegative: false,
        supportsModifiers: true,
        supportsOrigin: true,
        getModifierValue: readNumberProp('width'),
        action: ({ param, value, nodes, origin }) => setSize({ param, value, nodes, origin }),
      },

      // Fit
      fit: {
        name: 'Fit to Parent',
        shortcut: 'fit',
        description: 'Use fit<value> to set Fit to Parent.',
        hasValue: true,
        message: 'Fit element to parent (value: "", w, h)',
        action: ({ param, value, nodes }) => fitToParent({ param, value, nodes }),
      },
      fill: {
        name: 'Fill Auto-layout Space',
        shortcut: 'fill',
        description: 'Use fill<value> to set Fill Auto-layout Space.',
        hasValue: true,
        message: 'Set auto-layout sizing to fill (value: "", w, h)',
        action: ({ param, value, nodes }) => setAutolayoutBehavior({ command: param, value, nodes }),
      },
      hug: {
        name: 'Hug Auto-layout Content',
        shortcut: 'hug',
        description: 'Use hug<value> to set Hug Auto-layout Content.',
        hasValue: true,
        message: 'Set auto-layout sizing to hug (value: "", w, h)',
        action: ({ param, value, nodes }) => setAutolayoutBehavior({ command: param, value, nodes }),
      },
    },
  },

  //Radius
  r: {
    name: 'Corner Radius',
    description: 'Shortcuts for modifying the corner radius of elements, including individual corners.',
    shortcut: 'r',
    type: 'GROUP',
    subcommands: {
      r: {
        name: 'Corner Radius',
        shortcut: 'r',
        description: 'Command group for Corner Radius. Start with: rt, rb, rl, rr.',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readNumberProp('cornerRadius'),
        action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
        subcommands: {
          rt: {
            name: 'Top Corner Radius',
            shortcut: 'rt',
            description: 'Command group for Top Corner Radius. Start with: rtl, rtr.',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('topLeftRadius'),
            action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
            subcommands: {
              rtl: {
                name: 'Top Left Corner Radius',
                shortcut: 'rtl',
                description: 'Use rtl<value> to set Top Left Corner Radius.',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('topLeftRadius'),
                action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
              },
              rtr: {
                name: 'Top Right Corner Radius',
                shortcut: 'rtr',
                description: 'Use rtr<value> to set Top Right Corner Radius.',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('topRightRadius'),
                action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
              },
            },
          },
          rb: {
            name: 'Bottom Corner Radius',
            shortcut: 'rb',
            description: 'Command group for Bottom Corner Radius. Start with: rbl, rbr.',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('bottomLeftRadius'),
            action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
            subcommands: {
              rbl: {
                name: 'Bottom Left Corner Radius',
                shortcut: 'rbl',
                description: 'Use rbl<value> to set Bottom Left Corner Radius.',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('bottomLeftRadius'),
                action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
              },
              rbr: {
                name: 'Bottom Right Corner Radius',
                shortcut: 'rbr',
                description: 'Use rbr<value> to set Bottom Right Corner Radius.',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('bottomRightRadius'),
                action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
              },
            },
          },
          rl: {
            name: 'Left Corner Radius',
            shortcut: 'rl',
            description: 'Use rl<value> to set Left Corner Radius.',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('topLeftRadius'),
            action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
          },
          rr: {
            name: 'Right Corner Radius',
            shortcut: 'rr',
            description: 'Use rr<value> to set Right Corner Radius.',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('topRightRadius'),
            action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
          },
        },
      },
    },
  },

  //Padding
  p: {
    name: 'Padding',
    description:
      'Shortcuts for adjusting padding on autolayout objects, including top, bottom, left, right, and combined axes.',
    shortcut: 'p',
    type: 'GROUP',
    subcommands: {
      p: {
        name: 'Padding',
        shortcut: 'p',
        description: 'Command group for Padding. Start with: pl, pr, pt, pb.',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readPaddingLeft,
        subcommands: {
          pl: {
            name: 'Left Padding',
            shortcut: 'pl',
            description: 'Use pl<value> to set Left Padding.',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readPaddingLeft,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          pr: {
            name: 'Right Padding',
            shortcut: 'pr',
            description: 'Use pr<value> to set Right Padding.',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readPaddingRight,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          pt: {
            name: 'Top Padding',
            shortcut: 'pt',
            description: 'Use pt<value> to set Top Padding.',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readPaddingTop,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          pb: {
            name: 'Bottom Padding',
            shortcut: 'pb',
            description: 'Use pb<value> to set Bottom Padding.',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readPaddingBottom,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          px: {
            name: 'Horizontal Padding',
            shortcut: 'px',
            description: 'Use px<value> to set Horizontal Padding.',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readPaddingLeft,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          py: {
            name: 'Vertical Padding',
            shortcut: 'py',
            description: 'Use py<value> to set Vertical Padding.',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readPaddingTop,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
        },
        action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
      },
    },
  },

  //Strokes
  sw: {
    name: 'Strokes',
    description: 'Shortcuts for setting stroke width and alignment for elements, including individual edges.',
    shortcut: 'sw',
    type: 'GROUP',
    subcommands: {
      //Set Stroke Width
      sw: {
        name: 'Stroke Width',
        shortcut: 'sw',
        description: 'These are the shortcuts related to adjusting the stroke width of any object',
        type: 'GROUP',
        subcommands: {
          sw: {
            name: 'Strokes',
            shortcut: 'sw',
            description: 'Command group for Strokes. Start with: swl, swr, swt, swb.',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('strokeWeight'),
            subcommands: {
              swl: {
                name: 'Left Stroke',
                shortcut: 'swl',
                description: 'Use swl<value> to set Left Stroke.',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('strokeLeftWeight'),
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              swr: {
                name: 'Right Stroke',
                shortcut: 'swr',
                description: 'Use swr<value> to set Right Stroke.',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('strokeRightWeight'),
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              swt: {
                name: 'Top Stroke',
                shortcut: 'swt',
                description: 'Use swt<value> to set Top Stroke.',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('strokeTopWeight'),
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              swb: {
                name: 'Bottom Stroke',
                shortcut: 'swb',
                description: 'Use swb<value> to set Bottom Stroke.',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('strokeBottomWeight'),
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              swx: {
                name: 'Horizontal Strokes',
                shortcut: 'swx',
                description: 'Use swx<value> to set Horizontal Strokes.',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('strokeLeftWeight'),
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              swy: {
                name: 'Vertical Strokes',
                shortcut: 'swy',
                description: 'Use swy<value> to set Vertical Strokes.',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('strokeTopWeight'),
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
            },
            action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
          },
        },
      },

      //Set Stroke Align
      salign: {
        name: 'Stroke Alignment',
        shortcut: 'salign',
        description: 'These are the shortcuts related to adjusting the stroke alignment of any object',
        type: 'GROUP',
        subcommands: {
          sai: {
            name: 'Stroke Align Inside',
            message: 'Set alignment of stroke to inside',
            shortcut: 'sai',
            description: 'Run Stroke Align Inside using sai.',
            hasValue: false,
            action: ({ param, nodes }) => setStrokeAlign({ param, nodes }),
          },
          sac: {
            name: 'Stroke Align Center',
            message: 'Set alignment of stroke to center',
            shortcut: 'sac',
            description: 'Run Stroke Align Center using sac.',
            hasValue: false,
            action: ({ param, nodes }) => setStrokeAlign({ param, nodes }),
          },
          sao: {
            name: 'Stroke Align Outside',
            message: 'Set alignment of stroke to outside',
            shortcut: 'sao',
            description: 'Run Stroke Align Outside using sao.',
            hasValue: false,
            action: ({ param, nodes }) => setStrokeAlign({ param, nodes }),
          },
        },
      },
    },
  },

  //Selection
  selection: {
    name: 'Selection',
    shortcut: 'selection',
    description: 'Shortcuts for working with selections, including quick selection, filtering, and exclusion by type.',
    type: 'GROUP',
    subcommands: {
      sel: {
        name: 'Quick Select',
        shortcut: 'sel',
        description: 'These are the shortcuts related to quick selecting objects',
        type: 'GROUP',
        subcommands: {
          sel: {
            name: 'Quick Select',
            shortcut: 'sel',
            description: 'Command group for Quick Select. Start with: selr, sell, selt, selb.',
            hasValue: false,
            allowsNegative: false,
            subcommands: {
              selr: {
                name: 'Select Right',
                shortcut: 'selr',
                description: 'Run Select Right using selr.',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  setQuickSelect({ param, nodes });
                },
              },
              sell: {
                name: 'Select Left',
                shortcut: 'sell',
                description: 'Run Select Left using sell.',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  setQuickSelect({ param, nodes });
                },
              },
              selt: {
                name: 'Select Top',
                shortcut: 'selt',
                description: 'Run Select Top using selt.',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  setQuickSelect({ param, nodes });
                },
              },
              selb: {
                name: 'Select Bottom',
                shortcut: 'selb',
                description: 'Run Select Bottom using selb.',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  setQuickSelect({ param, nodes });
                },
              },
              root: {
                name: 'Select Root Ancestor (Strict)',
                shortcut: 'root',
                description: 'Run Select Root Ancestor (Strict) using root.',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              leaf: {
                name: 'Select Leaf Descendants (Strict)',
                shortcut: 'leaf',
                description: 'Run Select Leaf Descendants (Strict) using leaf.',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              selp: {
                name: 'Select Parent',
                shortcut: 'selp',
                description: 'Run Select Parent using selp.',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              selc: {
                name: 'Select Children',
                shortcut: 'selc',
                description: 'Run Select Children using selc.',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              selns: {
                name: 'Select Next Sibling',
                shortcut: 'selns',
                description: 'Run Select Next Sibling using selns.',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              selps: {
                name: 'Select Previous Sibling',
                shortcut: 'selps',
                description: 'Run Select Previous Sibling using selps.',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              seli: {
                name: 'Select Inverse Within Parent',
                shortcut: 'seli',
                description: 'Run Select Inverse Within Parent using seli.',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
            },
          },
        },
      },

      //Filter Selection
      fs: {
        name: 'Filter Selection',
        shortcut: 'fs',
        description: 'These are the shortcuts related to filtering out elements within selections',
        type: 'GROUP',
        subcommands: {
          fsf: {
            name: 'Filter Selection to Frames',
            shortcut: 'fsf',
            description: 'Run Filter Selection to Frames using fsf.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsg: {
            name: 'Filter Selection to Groups',
            shortcut: 'fsg',
            description: 'Run Filter Selection to Groups using fsg.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fst: {
            name: 'Filter Selection to Text',
            shortcut: 'fst',
            description: 'Run Filter Selection to Text using fst.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsc: {
            name: 'Filter Selection to Components',
            shortcut: 'fsc',
            description: 'Run Filter Selection to Components using fsc.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fscs: {
            name: 'Filter Selection to Component Sets',
            shortcut: 'fscs',
            description: 'Run Filter Selection to Component Sets using fscs.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsi: {
            name: 'Filter Selection to Instances',
            shortcut: 'fsi',
            description: 'Run Filter Selection to Instances using fsi.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsl: {
            name: 'Filter Selection to Lines',
            shortcut: 'fsl',
            description: 'Run Filter Selection to Lines using fsl.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsv: {
            name: 'Filter Selection to Vectors',
            shortcut: 'fsv',
            description: 'Run Filter Selection to Vectors using fsv.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fse: {
            name: 'Filter Selection to Ellipses',
            shortcut: 'fse',
            description: 'Run Filter Selection to Ellipses using fse.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsp: {
            name: 'Filter Selection to Polygons',
            shortcut: 'fsp',
            description: 'Run Filter Selection to Polygons using fsp.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fss: {
            name: 'Filter Selection to Stars',
            shortcut: 'fss',
            description: 'Run Filter Selection to Stars using fss.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsr: {
            name: 'Filter Selection to Rectangles',
            shortcut: 'fsr',
            description: 'Run Filter Selection to Rectangles using fsr.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsb: {
            name: 'Filter Selection to Boolean Operations',
            shortcut: 'fsb',
            description: 'Run Filter Selection to Boolean Operations using fsb.',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
        },
      },

      //Exclude from Selection
      es: {
        name: 'Exclude Selection',
        shortcut: 'es',
        description: 'These are the shortcuts related to excluding out elements within selections',
        type: 'GROUP',
        subcommands: {
          esf: {
            name: 'Exclude Frames from Selection',
            shortcut: 'esf',
            description: 'Run Exclude Frames from Selection using esf.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esg: {
            name: 'Exclude Groups from Selection',
            shortcut: 'esg',
            description: 'Run Exclude Groups from Selection using esg.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          est: {
            name: 'Exclude Text from Selection',
            shortcut: 'est',
            description: 'Run Exclude Text from Selection using est.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esc: {
            name: 'Exclude Components from Selection',
            shortcut: 'esc',
            description: 'Run Exclude Components from Selection using esc.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          escs: {
            name: 'Exclude Component Sets from Selection',
            shortcut: 'escs',
            description: 'Run Exclude Component Sets from Selection using escs.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esi: {
            name: 'Exclude Instances from Selection',
            shortcut: 'esi',
            description: 'Run Exclude Instances from Selection using esi.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esl: {
            name: 'Exclude Lines from Selection',
            shortcut: 'esl',
            description: 'Run Exclude Lines from Selection using esl.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esv: {
            name: 'Exclude Vectors from Selection',
            shortcut: 'esv',
            description: 'Run Exclude Vectors from Selection using esv.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          ese: {
            name: 'Exclude Ellipses from Selection',
            shortcut: 'ese',
            description: 'Run Exclude Ellipses from Selection using ese.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esp: {
            name: 'Exclude Polygons from Selection',
            shortcut: 'esp',
            description: 'Run Exclude Polygons from Selection using esp.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          ess: {
            name: 'Exclude Stars from Selection',
            shortcut: 'ess',
            description: 'Run Exclude Stars from Selection using ess.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esr: {
            name: 'Exclude Rectangles from Selection',
            shortcut: 'esr',
            description: 'Run Exclude Rectangles from Selection using esr.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esb: {
            name: 'Exclude Boolean Operations from Selection',
            shortcut: 'esb',
            description: 'Run Exclude Boolean Operations from Selection using esb.',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
        },
      },
    },
  },

  // Colour
  colour: {
    name: 'Colour',
    description: 'Shortcuts for setting or replacing element colors, including fills.',
    shortcut: 'colour',
    type: 'GROUP',
    subcommands: {
      //Replace Fill
      f: {
        name: 'Replace Fill Color',
        shortcut: 'f',
        description: 'Use f<value> to set Replace Fill Color.',
        hasValue: true,
        message: 'Replace targeted fills with',
        unit: 'hex',
        action: ({ param, value, nodes }) => setFill({ param, value, nodes }),
      },
      fa: {
        name: 'Add Fill',
        shortcut: 'fa',
        description: 'Use fa<value> to set Add Fill.',
        hasValue: true,
        message: 'Append fill',
        unit: 'hex',
        action: ({ param, value, nodes }) => addFill({ param, value, nodes }),
      },
      fi: {
        name: 'Insert Fill',
        shortcut: 'fi',
        description: 'Use fi<value> to set Insert Fill.',
        hasValue: true,
        message: 'Insert fill at target index with',
        unit: 'hex',
        action: ({ param, value, nodes }) => insertFill({ param, value, nodes }),
      },
      fd: {
        name: 'Delete Fill',
        shortcut: 'fd',
        description: 'Use fd<value> to set Delete Fill.',
        hasValue: true,
        message: 'Delete targeted fills',
        action: ({ param, value, nodes }) => deleteFill({ param, value, nodes }),
      },
      s: {
        name: 'Replace Stroke Color',
        shortcut: 's',
        description: 'Use s<value> to set Replace Stroke Color.',
        hasValue: true,
        message: 'Replace targeted strokes with',
        unit: 'hex',
        action: ({ param, value, nodes }) => setStroke({ param, value, nodes }),
      },
      sa: {
        name: 'Add Stroke',
        shortcut: 'sa',
        description: 'Use sa<value> to set Add Stroke.',
        hasValue: true,
        message: 'Append stroke',
        unit: 'hex',
        action: ({ param, value, nodes }) => addStroke({ param, value, nodes }),
      },
      si: {
        name: 'Insert Stroke',
        shortcut: 'si',
        description: 'Use si<value> to set Insert Stroke.',
        hasValue: true,
        message: 'Insert stroke at target index with',
        unit: 'hex',
        action: ({ param, value, nodes }) => insertStroke({ param, value, nodes }),
      },
      sd: {
        name: 'Delete Stroke',
        shortcut: 'sd',
        description: 'Use sd<value> to set Delete Stroke.',
        hasValue: true,
        message: 'Delete targeted strokes',
        action: ({ param, value, nodes }) => deleteStroke({ param, value, nodes }),
      },
    },
  },

  // Constraints
  c: {
    name: 'Constraints',
    description:
      'Shortcuts for applying, centering, scaling, and adjusting horizontal and vertical constraints on elements.',
    shortcut: 'c',
    type: 'GROUP',
    subcommands: {
      c: {
        name: 'Stretch all Constraints',
        shortcut: 'c',
        description: 'Run Stretch all Constraints using c.',
        hasValue: false,
        action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
      },
      cc: {
        name: 'Center all Constraints',
        shortcut: 'cc',
        description: 'Run Center all Constraints using cc.',
        hasValue: false,
        action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
      },
      cs: {
        name: 'Scale all Constraints',
        shortcut: 'cs',
        description: 'Run Scale all Constraints using cs.',
        hasValue: false,
        action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
      },
      cx: {
        name: 'Stretch Horizontal Constraints',
        shortcut: 'cx',
        description: 'Command group for Stretch Horizontal Constraints. Start with: cxc, cxs, cxl, cxr.',
        hasValue: false,
        action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
        subcommands: {
          cxc: {
            name: 'Center all Horizontal Constraints',
            shortcut: 'cxc',
            description: 'Run Center all Horizontal Constraints using cxc.',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cxs: {
            name: 'Scale all Horizontal Constraints',
            shortcut: 'cxs',
            description: 'Run Scale all Horizontal Constraints using cxs.',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cxl: {
            name: 'Set Horizontal Constraints to Left',
            shortcut: 'cxl',
            description: 'Run Set Horizontal Constraints to Left using cxl.',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cxr: {
            name: 'Set Horizontal Constraints to Right',
            shortcut: 'cxr',
            description: 'Run Set Horizontal Constraints to Right using cxr.',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
        },
      },
      cy: {
        name: 'Stretch Vertical Constraints',
        shortcut: 'cy',
        description: 'Command group for Stretch Vertical Constraints. Start with: cyc, cys, cyt, cyb.',
        hasValue: false,
        action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
        subcommands: {
          cyc: {
            name: 'Center all Vertical Constraints',
            shortcut: 'cyc',
            description: 'Run Center all Vertical Constraints using cyc.',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cys: {
            name: 'Scale all Vertical Constraints',
            shortcut: 'cys',
            description: 'Run Scale all Vertical Constraints using cys.',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cyt: {
            name: 'Set Vertical Constraints to Top',
            shortcut: 'cyt',
            description: 'Run Set Vertical Constraints to Top using cyt.',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cyb: {
            name: 'Set Vertical Constraints to Bottom',
            shortcut: 'cyb',
            description: 'Run Set Vertical Constraints to Bottom using cyb.',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
        },
      },
    },
  },

  // Autolayout Behavior
  a: {
    name: 'Autolayout Behavior',
    description: 'Shortcuts for toggling autolayout children behavior and spacing.',
    shortcut: 'a',
    type: 'GROUP',
    subcommands: {
      // TOGGLES
      ax: {
        name: 'Toggle Hug ↔ Fill Horizontally',
        shortcut: 'ax',
        description: 'Run Toggle Hug ↔ Fill Horizontally using ax.',
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, value: '', nodes }),
      },
      ay: {
        name: 'Toggle Hug ↔ Fill Vertically',
        shortcut: 'ay',
        description: 'Run Toggle Hug ↔ Fill Vertically using ay.',
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, value: '', nodes }),
      },

      // SMART AUTO
      aa: {
        name: 'Auto Behavior (Smart Fill/Hug)',
        shortcut: 'aa',
        description: 'Run Auto Behavior (Smart Fill/Hug) using aa.',
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, value: '', nodes }),
      },
      al: {
        name: 'Apply Auto Layout (Smart)',
        shortcut: 'al',
        description: 'Run Apply Auto Layout (Smart) using al.',
        hasValue: false,
        action: ({ param, nodes }) => applyAutolayout({ param, nodes }),
      },
      alx: {
        name: 'Apply Auto Layout Horizontal',
        shortcut: 'alx',
        description: 'Run Apply Auto Layout Horizontal using alx.',
        hasValue: false,
        action: ({ param, nodes }) => applyAutolayout({ param, nodes }),
      },
      aly: {
        name: 'Apply Auto Layout Vertical',
        shortcut: 'aly',
        description: 'Run Apply Auto Layout Vertical using aly.',
        hasValue: false,
        action: ({ param, nodes }) => applyAutolayout({ param, nodes }),
      },
      gap: {
        name: 'Set Auto-layout Gap',
        shortcut: 'gap',
        description: 'Use gap<value> to set Set Auto-layout Gap.',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readGap,
        action: ({ param, value, nodes }) => setGap({ param, value, nodes }),
      },
      gapx: {
        name: 'Set Horizontal Gap',
        shortcut: 'gapx',
        description: 'Use gapx<value> to set Set Horizontal Gap.',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readGapX,
        action: ({ param, value, nodes }) => setGap({ param, value, nodes }),
      },
      gapy: {
        name: 'Set Vertical Gap',
        shortcut: 'gapy',
        description: 'Use gapy<value> to set Set Vertical Gap.',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readGapY,
        action: ({ param, value, nodes }) => setGap({ param, value, nodes }),
      },
    },
  },

  // Text
  text: {
    name: 'Text',
    shortcut: 'text',
    description: 'Shortcuts for text spacing controls.',
    type: 'GROUP',
    subcommands: {
      ls: {
        name: 'Letter Spacing',
        shortcut: 'ls',
        description: 'Use ls<value> to set Letter Spacing.',
        hasValue: true,
        allowsNegative: true,
        supportsModifiers: true,
        getModifierValue: readLetterSpacing,
        message: 'Set letter spacing (supports px or %)',
        action: ({ param, value, nodes }) => setTextSpacing({ param, value, nodes }),
      },
      lh: {
        name: 'Line Height',
        shortcut: 'lh',
        description: 'Use lh<value> to set Line Height.',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readLineHeight,
        message: 'Set line height (supports px or %)',
        action: ({ param, value, nodes }) => setTextSpacing({ param, value, nodes }),
      },
      lsp: {
        name: 'Letter Spacing to %',
        shortcut: 'lsp',
        description: 'Run Letter Spacing to % using lsp.',
        hasValue: false,
        message: 'Convert current letter spacing to %',
        action: ({ param, value, nodes }) => setTextSpacing({ param, value, nodes }),
      },
      lspx: {
        name: 'Letter Spacing to px',
        shortcut: 'lspx',
        description: 'Run Letter Spacing to px using lspx.',
        hasValue: false,
        message: 'Convert current letter spacing to px',
        action: ({ param, value, nodes }) => setTextSpacing({ param, value, nodes }),
      },
      lhp: {
        name: 'Line Height to %',
        shortcut: 'lhp',
        description: 'Run Line Height to % using lhp.',
        hasValue: false,
        message: 'Convert current line height to %',
        action: ({ param, value, nodes }) => setTextSpacing({ param, value, nodes }),
      },
      lhpx: {
        name: 'Line Height to px',
        shortcut: 'lhpx',
        description: 'Run Line Height to px using lhpx.',
        hasValue: false,
        message: 'Convert current line height to px',
        action: ({ param, value, nodes }) => setTextSpacing({ param, value, nodes }),
      },
    },
  },

  //Misc
  misc: {
    name: 'Misc',
    shortcut: 'misc',
    description: 'Miscellaneous shortcuts that do not fit into other categories.',
    type: 'GROUP',
    subcommands: {
      clip: {
        name: 'Toggle Clipping',
        shortcut: 'clip',
        description: 'Run Toggle Clipping using clip.',
        hasValue: false,
        action: ({ nodes }) => toggleClip({ nodes }),
      },
      // Count
      count: {
        name: 'Count',
        shortcut: 'count',
        description: 'These are the shortcuts related to counting elements',
        type: 'GROUP',
        subcommands: {
          count: {
            name: 'Count Elements',
            shortcut: 'count',
            description: 'Command group for Count Elements. Start with: countn.',
            hasValue: false,
            message: 'Count top-level selected elements',
            action: ({ param }) => countSelectedElements({ param }),
            subcommands: {
              countn: {
                name: 'Count Nested Elements',
                shortcut: 'countn',
                description: 'Run Count Nested Elements using countn.',
                hasValue: false,
                message: 'Count all nested elements within the selection',
                action: ({ param }) => countSelectedElements({ param }),
              },
            },
          },
        },
      },
      swap: {
        name: 'Swap Elements',
        description: 'Shortcuts for swapping the positions of two selected elements horizontally or vertically.',
        shortcut: 'swap',
        type: 'GROUP',
        subcommands: {
          // Swap
          swap: {
            name: 'Swap Elements',
            shortcut: 'swap',
            description: 'Command group for Swap Elements. Start with: swapx, swapy.',
            hasValue: false,
            message: 'Swap position of two selected elements',
            action: ({ param, nodes }) => swapSelectedElements({ param, nodes }),
            subcommands: {
              swapx: {
                name: 'Swap Horizontally',
                shortcut: 'swapx',
                description: 'Run Swap Horizontally using swapx.',
                hasValue: false,
                message: 'Swap elements based on their x (horizontal) position',
                action: ({ param, nodes }) => swapSelectedElements({ param, nodes }),
              },
              swapy: {
                name: 'Swap Vertically',
                shortcut: 'swapy',
                description: 'Run Swap Vertically using swapy.',
                hasValue: false,
                message: 'Swap elements based on their y (vertical) position',
                action: ({ param, nodes }) => swapSelectedElements({ param, nodes }),
              },
            },
          },
        },
      },
      wf: {
        name: 'Wrap in Frame',
        shortcut: 'wf',
        description: 'Wrap items in selection individually in frames',
        hasValue: false,
        action: ({ nodes }) => wrapInFrame({ nodes }),
      },
      dup: {
        name: 'Duplicate Selected Nodes',
        shortcut: 'dup',
        description: 'Use dup<value> to set Duplicate Selected Nodes.',
        hasValue: true,
        message: 'Duplicate selected nodes',
        action: ({ param, value, nodes }) => duplicateSelection({ param, value, nodes }),
      },
      rot: {
        name: 'Set Rotation',
        shortcut: 'rot',
        description: 'Use rot<value> to set Set Rotation.',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readNumberProp('rotation'),
        unit: 'deg',
        action: ({ param, value, nodes }) => setRotation({ param, value, nodes }),
      },
      op: {
        name: 'Set Opacity',
        shortcut: 'op',
        description: 'Use op<value> to set Set Opacity.',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readOpacityPct,
        unit: '%',
        action: ({ param, value, nodes }) => setOpacity({ param, value, nodes }),
      },
    },
  },
};

function byShortcutExamples(shortcut: string) {
  const examples: Record<string, Array<{ token: string; help: string }>> = {
    w: [
      { token: 'w100', help: 'Set width to 100px' },
      { token: 'w50%', help: 'Set width to 50% of parent' },
      { token: '+w8', help: 'Increase width by 8px' },
      { token: '++w8+2', help: 'Grow width progressively across selection' },
    ],
    h: [
      { token: 'h100', help: 'Set height to 100px' },
      { token: 'h50%', help: 'Set height to 50% of parent' },
      { token: '+h8', help: 'Increase height by 8px' },
      { token: '++h8+2', help: 'Grow height progressively across selection' },
    ],
    wh: [
      { token: 'wh120,80', help: 'Set width and height together' },
      { token: 'wh80%,50%', help: 'Set size using parent percentages' },
      { token: '+wh8', help: 'Increase both width and height by 8px' },
      { token: '++wh8+4', help: 'Progressively increase both dimensions' },
    ],
    'sc:w': [
      { token: 'sc:w120%', help: 'Scale node to 120% width' },
      { token: 'sc:w80%', help: 'Scale node to 80% width' },
      { token: '+sc:w10%', help: 'Increase width scale by 10%' },
      { token: '--sc:w100%-10%', help: 'Progressively reduce width scale' },
    ],
    'sc:h': [
      { token: 'sc:h120%', help: 'Scale node to 120% height' },
      { token: 'sc:h80%', help: 'Scale node to 80% height' },
      { token: '+sc:h10%', help: 'Increase height scale by 10%' },
      { token: '--sc:h100%-10%', help: 'Progressively reduce height scale' },
    ],
    fit: [
      { token: 'fit', help: 'Fit to parent width and height' },
      { token: 'fitw', help: 'Fit to parent width only' },
      { token: 'fith', help: 'Fit to parent height only' },
      { token: 'fit op80', help: 'Fit to parent, then set opacity to 80%' },
    ],
    fill: [
      { token: 'fill', help: 'Set auto-layout sizing to fill on both axes' },
      { token: 'fillw', help: 'Fill width only' },
      { token: 'fillh', help: 'Fill height only' },
      { token: 'fill gap16', help: 'Fill both axes, then set gap to 16' },
    ],
    hug: [
      { token: 'hug', help: 'Set auto-layout sizing to hug on both axes' },
      { token: 'hugw', help: 'Hug width only' },
      { token: 'hugh', help: 'Hug height only' },
      { token: 'hug p16', help: 'Hug both axes, then set padding to 16' },
    ],
    f: [
      { token: 'f#1A73E8', help: 'Replace all fills with #1A73E8' },
      { token: 'f2#1A73E8', help: 'Replace only the second fill' },
      { token: 'f1-3#1A73E8@60', help: 'Replace fills 1-3 with 60% opacity' },
      { token: 'f#1A73E8:m:off', help: 'Set blend mode and visibility for targeted fills' },
    ],
    fa: [
      { token: 'fa#1A73E8', help: 'Append a new fill' },
      { token: 'fa#1A73E8@20', help: 'Append a fill with 20% opacity' },
      { token: 'fa#1A73E8:overlay:on', help: 'Append visible overlay fill' },
      { token: 'fa#0D0D0D:n:off', help: 'Append hidden normal-blend fill' },
    ],
    fi: [
      { token: 'fi1#1A73E8', help: 'Insert fill at position 1' },
      { token: 'fi3#000@20', help: 'Insert fill 3 at 20% opacity' },
      { token: 'fi2#1A73E8:screen:off', help: 'Insert hidden screen-blend fill at 2' },
      { token: 'fi4#FFB800:m:on', help: 'Insert multiply fill at 4' },
    ],
    fd: [
      { token: 'fd2', help: 'Delete second fill' },
      { token: 'fd1-3', help: 'Delete fills 1 through 3' },
      { token: 'fd3+', help: 'Delete fill 3 onward' },
      { token: 'fd-2', help: 'Delete second-to-last fill' },
    ],
    s: [
      { token: 's#1A73E8', help: 'Replace all strokes with #1A73E8' },
      { token: 's2#1A73E8', help: 'Replace only the second stroke' },
      { token: 's1-3#1A73E8@60', help: 'Replace strokes 1-3 with 60% opacity' },
      { token: 's#1A73E8:m:off', help: 'Set blend mode and visibility for targeted strokes' },
    ],
    sa: [
      { token: 'sa#1A73E8', help: 'Append a new stroke' },
      { token: 'sa#1A73E8@20', help: 'Append a stroke with 20% opacity' },
      { token: 'sa#1A73E8:overlay:on', help: 'Append visible overlay stroke' },
      { token: 'sa#0D0D0D:n:off', help: 'Append hidden normal-blend stroke' },
    ],
    si: [
      { token: 'si1#1A73E8', help: 'Insert stroke at position 1' },
      { token: 'si3#000@20', help: 'Insert stroke 3 at 20% opacity' },
      { token: 'si2#1A73E8:screen:off', help: 'Insert hidden screen-blend stroke at 2' },
      { token: 'si4#FFB800:m:on', help: 'Insert multiply stroke at 4' },
    ],
    sd: [
      { token: 'sd2', help: 'Delete second stroke' },
      { token: 'sd1-3', help: 'Delete strokes 1 through 3' },
      { token: 'sd3+', help: 'Delete stroke 3 onward' },
      { token: 'sd-2', help: 'Delete second-to-last stroke' },
    ],
    ls: [
      { token: 'ls2', help: 'Set letter spacing to 2px' },
      { token: 'ls1.5px', help: 'Set letter spacing with explicit px' },
      { token: 'ls4%', help: 'Set letter spacing to 4%' },
      { token: '+ls0.5', help: 'Increase letter spacing by 0.5px' },
    ],
    lh: [
      { token: 'lh120%', help: 'Set line height to 120%' },
      { token: 'lh16px', help: 'Set line height to 16px' },
      { token: 'lh24', help: 'Set line height to 24px' },
      { token: '+lh2', help: 'Increase line height by 2px' },
    ],
    dup: [
      { token: 'dup1', help: 'Duplicate once' },
      { token: 'dup3', help: 'Duplicate three times' },
      { token: 'dup5', help: 'Duplicate five times for a quick fanout' },
      { token: 'dup10', help: 'Duplicate ten times for stress-testing layout' },
    ],
    op: [
      { token: 'op100', help: 'Set opacity to 100%' },
      { token: 'op80', help: 'Set opacity to 80%' },
      { token: '+op5', help: 'Increase opacity by 5%' },
      { token: '--op100-10', help: 'Progressively reduce opacity across selection' },
    ],
    rot: [
      { token: 'rot45', help: 'Rotate to 45 degrees' },
      { token: 'rot90deg', help: 'Rotate to 90 degrees with explicit unit' },
      { token: '+rot15', help: 'Rotate forward by 15 degrees' },
      { token: '--rot0-10', help: 'Progressively rotate backwards across selection' },
    ],
  };

  return examples[shortcut] ?? [];
}

function buildFallbackExamples(command: PropItem) {
  if (command.hasValue === false) {
    return [
      { token: command.shortcut, help: `Run ${command.name}` },
      { token: `${command.shortcut} w160`, help: `Run ${command.name}, then set width to 160px` },
      { token: `${command.shortcut} h96`, help: `Run ${command.name}, then set height to 96px` },
      { token: `${command.shortcut} op80`, help: `Run ${command.name}, then set opacity to 80%` },
    ];
  }

  const unit = (command.unit ?? '').toLowerCase();
  if (unit === 'hex') {
    return [
      { token: `${command.shortcut}#1A73E8`, help: `Use ${command.name} with a hex value` },
      { token: `${command.shortcut}#FF6D00@60`, help: `Use ${command.name} with opacity` },
      { token: `${command.shortcut}#00C853:m:on`, help: `Use ${command.name} with blend and visibility` },
      { token: `${command.shortcut}#111111:o:off`, help: `Use ${command.name} with overlay options` },
    ];
  }

  if (unit === '%') {
    return [
      { token: `${command.shortcut}100`, help: `Set ${command.name} to 100%` },
      { token: `${command.shortcut}80`, help: `Set ${command.name} to 80%` },
      { token: `+${command.shortcut}5`, help: `Increase ${command.name} by 5%` },
      { token: `--${command.shortcut}100-10`, help: `Progressively reduce ${command.name}` },
    ];
  }

  if (unit === 'deg') {
    return [
      { token: `${command.shortcut}0`, help: `Reset ${command.name} to 0 degrees` },
      { token: `${command.shortcut}45`, help: `Set ${command.name} to 45 degrees` },
      { token: `+${command.shortcut}15`, help: `Increase ${command.name} by 15 degrees` },
      { token: `--${command.shortcut}90-10`, help: `Progressively reduce ${command.name}` },
    ];
  }

  return [
    { token: `${command.shortcut}100`, help: `Set ${command.name} to 100` },
    { token: `${command.shortcut}50%`, help: `Set ${command.name} to 50%` },
    { token: `+${command.shortcut}8`, help: `Increase ${command.name} by 8` },
    { token: `++${command.shortcut}8+2`, help: `Progressively increase ${command.name}` },
  ];
}

function ensureAtLeastFourExamples(baseExamples: Array<{ token: string; help: string }>) {
  const deduped: Array<{ token: string; help: string }> = [];
  const seen = new Set<string>();

  for (const example of baseExamples) {
    const key = `${example.token}::${example.help}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(example);
  }

  return deduped.slice(0, 4);
}

function lowerFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function buildGeneratedDescription(
  command: PropItem,
  examples: Array<{ token: string; help: string }>,
  childShortcuts: string[]
) {
  if (command.type === 'GROUP') {
    if (childShortcuts.length === 0) {
      return `Command group for ${command.name}.`;
    }

    const preview = childShortcuts.slice(0, 4).map((shortcut) => `\`${shortcut}\``).join(', ');
    return `Command group for ${command.name}. Start with: ${preview}.`;
  }

  const syntax = command.hasValue === false ? `\`${command.shortcut}\`` : `\`${command.shortcut}<value>\``;
  const examplesPreview = examples
    .slice(0, 2)
    .map((example) => `\`${example.token}\``)
    .join(', ');

  if (command.hasValue === false) {
    return `Use ${syntax} to ${lowerFirst(command.name)}. Common usage: ${examplesPreview}.`;
  }

  return `Use ${syntax} to ${lowerFirst(command.name)}. Try: ${examplesPreview}.`;
}

function addExamplesToCommands(commands: Record<string, PropItem>): Record<string, PropItem> {
  const next: Record<string, PropItem> = {};

  for (const [key, command] of Object.entries(commands)) {
    const children = command.subcommands ? addExamplesToCommands(command.subcommands) : undefined;
    const withChildren: PropItem = { ...command, subcommands: children };
    const childShortcuts = children ? Object.values(children).map((child) => child.shortcut) : [];

    if (withChildren.type !== 'GROUP') {
      const explicitExamples = byShortcutExamples(withChildren.shortcut);
      const fallbackExamples = buildFallbackExamples(withChildren);
      const examples = ensureAtLeastFourExamples([...explicitExamples, ...fallbackExamples]);
      withChildren.examples = examples;
      if (!withChildren.description?.trim()) {
        withChildren.description = buildGeneratedDescription(withChildren, examples, childShortcuts);
      }
    } else if (!withChildren.description?.trim()) {
      withChildren.description = buildGeneratedDescription(withChildren, [], childShortcuts);
    }

    next[key] = withChildren;
  }

  return next;
}

export const propList: Record<string, PropItem> = addExamplesToCommands(rawPropList);

export function flattenCommands(
  commands: Record<string, PropItem>,
  flattenedCommands: Record<string, PropItem> = {}
): Record<string, PropItem> {
  for (const key in commands) {
    if (commands[key].type !== 'GROUP') flattenedCommands[key] = commands[key];

    if (commands[key].subcommands) {
      flattenCommands(commands[key].subcommands!, flattenedCommands);
    }
  }

  // Only sort at the topmost call
  if (flattenedCommands === arguments[1]) {
    return Object.fromEntries(Object.entries(flattenedCommands).sort(([a], [b]) => a.localeCompare(b)));
  }

  return flattenedCommands;
}
