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

export const propList: Record<string, PropItem> = {
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
        hasValue: true,
        subcommands: {
          x: {
            name: 'Position X',
            shortcut: 'x',
            hasValue: true,
            allowsNegative: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('x'),
            action: ({ param, value, nodes }) => setPosition({ param, value, nodes }),
          },
          y: {
            name: 'Position Y',
            shortcut: 'y',
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
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
          },
          dr: {
            name: 'Dock to Right',
            shortcut: 'dr',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
          },
          dt: {
            name: 'Dock to Top',
            shortcut: 'dt',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
            subcommands: {
              dtl: {
                name: 'Dock to Top Left',
                shortcut: 'dtl',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
              },
              dtr: {
                name: 'Dock to Top Right',
                shortcut: 'dtr',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
              },
            },
          },
          db: {
            name: 'Dock to Bottom',
            shortcut: 'db',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
            subcommands: {
              dbl: {
                name: 'Dock to Bottom Left',
                shortcut: 'dbl',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
              },
              dbr: {
                name: 'Dock to Bottom Right',
                shortcut: 'dbr',
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
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
          },
          DR: {
            name: 'Dock out Right',
            shortcut: 'DR',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
          },
          DT: {
            name: 'Dock out Top',
            shortcut: 'DT',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
            subcommands: {
              DTL: {
                name: 'Dock out to Top Left',
                shortcut: 'DTL',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
              },
              DTR: {
                name: 'Dock out to Top Right',
                shortcut: 'DTR',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
              },
            },
          },
          DB: {
            name: 'Dock out Bottom',
            shortcut: 'DB',
            hasValue: false,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
            subcommands: {
              DBL: {
                name: 'Dock out to Bottom Left',
                shortcut: 'DBL',
                hasValue: false,
                allowsNegative: true,
                action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
              },
              DBR: {
                name: 'Dock out to Bottom Right',
                shortcut: 'DBR',
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
        type: 'GROUP',
        subcommands: {
          'sc:w': {
            name: 'Scale to Width',
            shortcut: 'sc:w',
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
        hasValue: true,
        message: 'Fit element to parent (value: "", w, h)',
        action: ({ param, value, nodes }) => fitToParent({ param, value, nodes }),
      },
      fill: {
        name: 'Fill Auto-layout Space',
        shortcut: 'fill',
        hasValue: true,
        message: 'Set auto-layout sizing to fill (value: "", w, h)',
        action: ({ param, value, nodes }) => setAutolayoutBehavior({ command: param, value, nodes }),
      },
      hug: {
        name: 'Hug Auto-layout Content',
        shortcut: 'hug',
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
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readNumberProp('cornerRadius'),
        action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
        subcommands: {
          rt: {
            name: 'Top Corner Radius',
            shortcut: 'rt',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('topLeftRadius'),
            action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
            subcommands: {
              rtl: {
                name: 'Top Left Corner Radius',
                shortcut: 'rtl',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('topLeftRadius'),
                action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
              },
              rtr: {
                name: 'Top Right Corner Radius',
                shortcut: 'rtr',
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
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('bottomLeftRadius'),
            action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
            subcommands: {
              rbl: {
                name: 'Bottom Left Corner Radius',
                shortcut: 'rbl',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('bottomLeftRadius'),
                action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
              },
              rbr: {
                name: 'Bottom Right Corner Radius',
                shortcut: 'rbr',
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
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('topLeftRadius'),
            action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
          },
          rr: {
            name: 'Right Corner Radius',
            shortcut: 'rr',
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
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readPaddingLeft,
        subcommands: {
          pl: {
            name: 'Left Padding',
            shortcut: 'pl',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readPaddingLeft,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          pr: {
            name: 'Right Padding',
            shortcut: 'pr',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readPaddingRight,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          pt: {
            name: 'Top Padding',
            shortcut: 'pt',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readPaddingTop,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          pb: {
            name: 'Bottom Padding',
            shortcut: 'pb',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readPaddingBottom,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          px: {
            name: 'Horizontal Padding',
            shortcut: 'px',
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readPaddingLeft,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          py: {
            name: 'Vertical Padding',
            shortcut: 'py',
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
            hasValue: true,
            supportsModifiers: true,
            getModifierValue: readNumberProp('strokeWeight'),
            subcommands: {
              swl: {
                name: 'Left Stroke',
                shortcut: 'swl',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('strokeLeftWeight'),
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              swr: {
                name: 'Right Stroke',
                shortcut: 'swr',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('strokeRightWeight'),
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              swt: {
                name: 'Top Stroke',
                shortcut: 'swt',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('strokeTopWeight'),
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              swb: {
                name: 'Bottom Stroke',
                shortcut: 'swb',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('strokeBottomWeight'),
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              swx: {
                name: 'Horizontal Strokes',
                shortcut: 'swx',
                hasValue: true,
                supportsModifiers: true,
                getModifierValue: readNumberProp('strokeLeftWeight'),
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              swy: {
                name: 'Vertical Strokes',
                shortcut: 'swy',
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
            hasValue: false,
            action: ({ param, nodes }) => setStrokeAlign({ param, nodes }),
          },
          sac: {
            name: 'Stroke Align Center',
            message: 'Set alignment of stroke to center',
            shortcut: 'sac',
            hasValue: false,
            action: ({ param, nodes }) => setStrokeAlign({ param, nodes }),
          },
          sao: {
            name: 'Stroke Align Outside',
            message: 'Set alignment of stroke to outside',
            shortcut: 'sao',
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
            hasValue: false,
            allowsNegative: false,
            subcommands: {
              selr: {
                name: 'Select Right',
                shortcut: 'selr',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  setQuickSelect({ param, nodes });
                },
              },
              sell: {
                name: 'Select Left',
                shortcut: 'sell',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  setQuickSelect({ param, nodes });
                },
              },
              selt: {
                name: 'Select Top',
                shortcut: 'selt',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  setQuickSelect({ param, nodes });
                },
              },
              selb: {
                name: 'Select Bottom',
                shortcut: 'selb',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  setQuickSelect({ param, nodes });
                },
              },
              root: {
                name: 'Select Root Ancestor (Strict)',
                shortcut: 'root',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              leaf: {
                name: 'Select Leaf Descendants (Strict)',
                shortcut: 'leaf',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              selp: {
                name: 'Select Parent',
                shortcut: 'selp',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              selc: {
                name: 'Select Children',
                shortcut: 'selc',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              selns: {
                name: 'Select Next Sibling',
                shortcut: 'selns',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              selps: {
                name: 'Select Previous Sibling',
                shortcut: 'selps',
                hasValue: false,
                allowsNegative: false,
                action: ({ param, nodes }) => {
                  traverseSelection({ param, nodes });
                },
              },
              seli: {
                name: 'Select Inverse Within Parent',
                shortcut: 'seli',
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
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsg: {
            name: 'Filter Selection to Groups',
            shortcut: 'fsg',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fst: {
            name: 'Filter Selection to Text',
            shortcut: 'fst',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsc: {
            name: 'Filter Selection to Components',
            shortcut: 'fsc',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fscs: {
            name: 'Filter Selection to Component Sets',
            shortcut: 'fscs',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsi: {
            name: 'Filter Selection to Instances',
            shortcut: 'fsi',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsl: {
            name: 'Filter Selection to Lines',
            shortcut: 'fsl',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsv: {
            name: 'Filter Selection to Vectors',
            shortcut: 'fsv',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fse: {
            name: 'Filter Selection to Ellipses',
            shortcut: 'fse',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsp: {
            name: 'Filter Selection to Polygons',
            shortcut: 'fsp',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fss: {
            name: 'Filter Selection to Stars',
            shortcut: 'fss',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsr: {
            name: 'Filter Selection to Rectangles',
            shortcut: 'fsr',
            hasValue: false,
            action: ({ param, nodes }) => filterSelection({ param, nodes }),
          },
          fsb: {
            name: 'Filter Selection to Boolean Operations',
            shortcut: 'fsb',
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
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esg: {
            name: 'Exclude Groups from Selection',
            shortcut: 'esg',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          est: {
            name: 'Exclude Text from Selection',
            shortcut: 'est',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esc: {
            name: 'Exclude Components from Selection',
            shortcut: 'esc',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          escs: {
            name: 'Exclude Component Sets from Selection',
            shortcut: 'escs',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esi: {
            name: 'Exclude Instances from Selection',
            shortcut: 'esi',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esl: {
            name: 'Exclude Lines from Selection',
            shortcut: 'esl',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esv: {
            name: 'Exclude Vectors from Selection',
            shortcut: 'esv',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          ese: {
            name: 'Exclude Ellipses from Selection',
            shortcut: 'ese',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esp: {
            name: 'Exclude Polygons from Selection',
            shortcut: 'esp',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          ess: {
            name: 'Exclude Stars from Selection',
            shortcut: 'ess',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esr: {
            name: 'Exclude Rectangles from Selection',
            shortcut: 'esr',
            hasValue: false,
            action: ({ param, nodes }) => excludeSelection({ param, nodes }),
          },
          esb: {
            name: 'Exclude Boolean Operations from Selection',
            shortcut: 'esb',
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
        hasValue: true,
        message: 'Replace targeted fills with',
        unit: 'hex',
        action: ({ param, value, nodes }) => setFill({ param, value, nodes }),
      },
      fa: {
        name: 'Add Fill',
        shortcut: 'fa',
        hasValue: true,
        message: 'Append fill',
        unit: 'hex',
        action: ({ param, value, nodes }) => addFill({ param, value, nodes }),
      },
      fi: {
        name: 'Insert Fill',
        shortcut: 'fi',
        hasValue: true,
        message: 'Insert fill at target index with',
        unit: 'hex',
        action: ({ param, value, nodes }) => insertFill({ param, value, nodes }),
      },
      fd: {
        name: 'Delete Fill',
        shortcut: 'fd',
        hasValue: true,
        message: 'Delete targeted fills',
        action: ({ param, value, nodes }) => deleteFill({ param, value, nodes }),
      },
      s: {
        name: 'Replace Stroke Color',
        shortcut: 's',
        hasValue: true,
        message: 'Replace targeted strokes with',
        unit: 'hex',
        action: ({ param, value, nodes }) => setStroke({ param, value, nodes }),
      },
      sa: {
        name: 'Add Stroke',
        shortcut: 'sa',
        hasValue: true,
        message: 'Append stroke',
        unit: 'hex',
        action: ({ param, value, nodes }) => addStroke({ param, value, nodes }),
      },
      si: {
        name: 'Insert Stroke',
        shortcut: 'si',
        hasValue: true,
        message: 'Insert stroke at target index with',
        unit: 'hex',
        action: ({ param, value, nodes }) => insertStroke({ param, value, nodes }),
      },
      sd: {
        name: 'Delete Stroke',
        shortcut: 'sd',
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
        hasValue: false,
        action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
      },
      cc: {
        name: 'Center all Constraints',
        shortcut: 'cc',
        hasValue: false,
        action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
      },
      cs: {
        name: 'Scale all Constraints',
        shortcut: 'cs',
        hasValue: false,
        action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
      },
      cx: {
        name: 'Stretch Horizontal Constraints',
        shortcut: 'cx',
        hasValue: false,
        action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
        subcommands: {
          cxc: {
            name: 'Center all Horizontal Constraints',
            shortcut: 'cxc',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cxs: {
            name: 'Scale all Horizontal Constraints',
            shortcut: 'cxs',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cxl: {
            name: 'Set Horizontal Constraints to Left',
            shortcut: 'cxl',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cxr: {
            name: 'Set Horizontal Constraints to Right',
            shortcut: 'cxr',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
        },
      },
      cy: {
        name: 'Stretch Vertical Constraints',
        shortcut: 'cy',
        hasValue: false,
        action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
        subcommands: {
          cyc: {
            name: 'Center all Vertical Constraints',
            shortcut: 'cyc',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cys: {
            name: 'Scale all Vertical Constraints',
            shortcut: 'cys',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cyt: {
            name: 'Set Vertical Constraints to Top',
            shortcut: 'cyt',
            hasValue: false,
            action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
          },
          cyb: {
            name: 'Set Vertical Constraints to Bottom',
            shortcut: 'cyb',
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
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, value: '', nodes }),
      },
      ay: {
        name: 'Toggle Hug ↔ Fill Vertically',
        shortcut: 'ay',
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, value: '', nodes }),
      },

      // SMART AUTO
      aa: {
        name: 'Auto Behavior (Smart Fill/Hug)',
        shortcut: 'aa',
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, value: '', nodes }),
      },
      al: {
        name: 'Apply Auto Layout (Smart)',
        shortcut: 'al',
        hasValue: false,
        action: ({ param, nodes }) => applyAutolayout({ param, nodes }),
      },
      alx: {
        name: 'Apply Auto Layout Horizontal',
        shortcut: 'alx',
        hasValue: false,
        action: ({ param, nodes }) => applyAutolayout({ param, nodes }),
      },
      aly: {
        name: 'Apply Auto Layout Vertical',
        shortcut: 'aly',
        hasValue: false,
        action: ({ param, nodes }) => applyAutolayout({ param, nodes }),
      },
      gap: {
        name: 'Set Auto-layout Gap',
        shortcut: 'gap',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readGap,
        action: ({ param, value, nodes }) => setGap({ param, value, nodes }),
      },
      gapx: {
        name: 'Set Horizontal Gap',
        shortcut: 'gapx',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readGapX,
        action: ({ param, value, nodes }) => setGap({ param, value, nodes }),
      },
      gapy: {
        name: 'Set Vertical Gap',
        shortcut: 'gapy',
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
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readLineHeight,
        message: 'Set line height (supports px or %)',
        action: ({ param, value, nodes }) => setTextSpacing({ param, value, nodes }),
      },
      lsp: {
        name: 'Letter Spacing to %',
        shortcut: 'lsp',
        hasValue: false,
        message: 'Convert current letter spacing to %',
        action: ({ param, value, nodes }) => setTextSpacing({ param, value, nodes }),
      },
      lspx: {
        name: 'Letter Spacing to px',
        shortcut: 'lspx',
        hasValue: false,
        message: 'Convert current letter spacing to px',
        action: ({ param, value, nodes }) => setTextSpacing({ param, value, nodes }),
      },
      lhp: {
        name: 'Line Height to %',
        shortcut: 'lhp',
        hasValue: false,
        message: 'Convert current line height to %',
        action: ({ param, value, nodes }) => setTextSpacing({ param, value, nodes }),
      },
      lhpx: {
        name: 'Line Height to px',
        shortcut: 'lhpx',
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
            hasValue: false,
            message: 'Count top-level selected elements',
            action: ({ param }) => countSelectedElements({ param }),
            subcommands: {
              countn: {
                name: 'Count Nested Elements',
                shortcut: 'countn',
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
            hasValue: false,
            message: 'Swap position of two selected elements',
            action: ({ param, nodes }) => swapSelectedElements({ param, nodes }),
            subcommands: {
              swapx: {
                name: 'Swap Horizontally',
                shortcut: 'swapx',
                hasValue: false,
                message: 'Swap elements based on their x (horizontal) position',
                action: ({ param, nodes }) => swapSelectedElements({ param, nodes }),
              },
              swapy: {
                name: 'Swap Vertically',
                shortcut: 'swapy',
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
        hasValue: true,
        message: 'Duplicate selected nodes',
        action: ({ param, value, nodes }) => duplicateSelection({ param, value, nodes }),
      },
      rot: {
        name: 'Set Rotation',
        shortcut: 'rot',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readNumberProp('rotation'),
        unit: 'deg',
        action: ({ param, value, nodes }) => setRotation({ param, value, nodes }),
      },
      op: {
        name: 'Set Opacity',
        shortcut: 'op',
        hasValue: true,
        supportsModifiers: true,
        getModifierValue: readOpacityPct,
        unit: '%',
        action: ({ param, value, nodes }) => setOpacity({ param, value, nodes }),
      },
    },
  },
};

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
