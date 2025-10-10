import { parameterRoutingProps } from './param-routing';
import setHeight from './utils/set-dimensions/set-height';
import setPadding from './utils/padding/set-padding';
import setPosition from './utils/position/set-pos';
import setRadius from './utils/set-radius';
import setStrokeWidth from './utils/stroke/set-stroke-width';
import setWidth from './utils/set-dimensions/set-width';
import toggleClip from './utils/toggle-clip';
import setSize from './utils/set-dimensions/set-size';
import setScale from './utils/set-dimensions/set-scale';
import setScaleHeight from './utils/set-dimensions/set-scale-height';
import setScaleWidth from './utils/set-dimensions/set-scale-width';
import setQuickSelect from './utils/set-quick-select';
import setConstraints from './utils/set-constraints/set-constraints';
import dockWithConstraints from './utils/dock-with-constraints/dock-with-constraints';
import dockOutWithConstraints from './utils/dock-out-with-constraints/dock-out-with-constraints';
import setStrokeAlign from './utils/stroke/set-stroke-align';
import filterSelection from './utils/selection/filter-selection';
import excludeSelection from './utils/selection/exclude-selection';
import countSelectedElements from './utils/count/count';
import { swapSelectedElements } from './utils/swap/swap-position';
import { fitToParent } from './utils/fit/fit';
import setFill from './utils/color/replace-fill';
import setAutolayoutBehavior from './utils/autolayout/set-autolayout-behavior';
import wrapInFrame from './utils/wrap/wrap-in-frame';

export interface PropItem {
  name: string;
  shortcut: string;
  hasValue?: boolean;
  subcommands?: Record<string, PropItem>;
  allowsNegative?: boolean;
  unit?: string;
  message?: string;
  description?: string;
  notes?: string;
  type?: 'GROUP' | 'ACTION';
  action?: ({ param, value, nodes }: parameterRoutingProps) => void;
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
            action: ({ param, value, nodes }) => setPosition({ param, value, nodes, mode: 'set' }),
            subcommands: {
              '-x': {
                name: 'Move Left',
                shortcut: '-x',
                hasValue: true,
                action: ({ param, nodes, value }) => setPosition({ param, nodes, value, mode: 'decrease' }),
              },
              '+x': {
                name: 'Move Right',
                shortcut: '+x',
                hasValue: true,
                action: ({ param, nodes, value }) => setPosition({ param, nodes, value, mode: 'increase' }),
              },
            },
          },
          y: {
            name: 'Position Y',
            shortcut: 'y',
            hasValue: true,
            allowsNegative: true,
            action: ({ param, value, nodes }) => setPosition({ param, value, nodes, mode: 'set' }),
            subcommands: {
              '-y': {
                name: 'Move Top',
                shortcut: '-y',
                hasValue: true,
                action: ({ param, nodes, value }) => setPosition({ param, nodes, value, mode: 'decrease' }),
              },
              '+y': {
                name: 'Move Bottom',
                shortcut: '+y',
                hasValue: true,
                action: ({ param, nodes, value }) => setPosition({ param, nodes, value, mode: 'increase' }),
              },
            },
          },
          //Move
        },
        allowsNegative: true,
        action: ({ param, value, nodes }) => setPosition({ param, value, nodes, mode: 'set' }),
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
        action: ({ param, value, nodes }) => setWidth({ param, value, nodes, mode: 'set' }),
        subcommands: {
          '+w': {
            name: 'Increase Width By',
            shortcut: '+w',
            hasValue: true,
            allowsNegative: true,
            action: ({ param, value, nodes }) => setWidth({ param, value, nodes, mode: 'increase' }),
          },
          '-w': {
            name: 'Decrease Width By',
            shortcut: '-w',
            hasValue: true,
            allowsNegative: true,
            action: ({ param, value, nodes }) => setWidth({ param, value, nodes, mode: 'decrease' }),
          },
        },
      },

      //Height
      h: {
        name: 'Height',
        shortcut: 'h',
        hasValue: true,
        allowsNegative: false,
        action: ({ param, value, nodes }) => setHeight({ param, value, nodes, mode: 'set' }),
        subcommands: {
          '+h': {
            name: 'Increase Height By',
            shortcut: '+h',
            hasValue: true,
            allowsNegative: true,
            action: ({ param, value, nodes }) => setHeight({ param, value, nodes, mode: 'increase' }),
          },
          '-h': {
            name: 'Decrease Height By',
            shortcut: '-h',
            hasValue: true,
            allowsNegative: true,
            action: ({ param, value, nodes }) => setHeight({ param, value, nodes, mode: 'decrease' }),
          },
        },
      },

      //Scale
      sc: {
        name: 'Scale',
        shortcut: 'sc',
        hasValue: true,
        allowsNegative: true,
        unit: '%',
        action: ({ param, value, nodes }) => setScale({ param, value, nodes }),
        subcommands: {
          scw: {
            name: 'Scale Width',
            shortcut: 'scw',
            hasValue: true,
            allowsNegative: false,
            action: ({ param, value, nodes }) => setScaleWidth({ param, value, nodes }),
          },
          sch: {
            name: 'Scale Height',
            shortcut: 'sch',
            hasValue: true,
            allowsNegative: false,
            action: ({ param, value, nodes }) => setScaleHeight({ param, value, nodes }),
          },
        },
      },

      //Size
      s: {
        name: 'Size',
        shortcut: 's',
        hasValue: true,
        allowsNegative: false,
        action: ({ param, value, nodes }) => setSize({ param, value, nodes }),
      },

      // Fit
      fit: {
        name: 'Fit to Parent',
        shortcut: 'fit',
        hasValue: false,
        message: 'Fit element to parent width and height',
        action: ({ param, nodes }) => fitToParent({ param, nodes }),
        subcommands: {
          fitw: {
            name: 'Fit to Parent Width',
            shortcut: 'fitw',
            hasValue: false,
            message: 'Fit element to parent width only',
            action: ({ param, nodes }) => fitToParent({ param, nodes }),
          },
          fith: {
            name: 'Fit to Parent Height',
            shortcut: 'fith',
            hasValue: false,
            message: 'Fit element to parent height only',
            action: ({ param, nodes }) => fitToParent({ param, nodes }),
          },
        },
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
        action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
        subcommands: {
          rt: {
            name: 'Top Corner Radius',
            shortcut: 'rt',
            hasValue: true,
            action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
            subcommands: {
              rtl: {
                name: 'Top Left Corner Radius',
                shortcut: 'rtl',
                hasValue: true,
                action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
              },
              rtr: {
                name: 'Top Right Corner Radius',
                shortcut: 'rtr',
                hasValue: true,
                action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
              },
            },
          },
          rb: {
            name: 'Bottom Corner Radius',
            shortcut: 'rb',
            hasValue: true,
            action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
            subcommands: {
              rbl: {
                name: 'Bottom Left Corner Radius',
                shortcut: 'rbl',
                hasValue: true,
                action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
              },
              rbr: {
                name: 'Bottom Right Corner Radius',
                shortcut: 'rbr',
                hasValue: true,
                action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
              },
            },
          },
          rl: {
            name: 'Left Corner Radius',
            shortcut: 'rl',
            hasValue: true,
            action: ({ param, value, nodes }) => setRadius({ param, value, nodes }),
          },
          rr: {
            name: 'Right Corner Radius',
            shortcut: 'rr',
            hasValue: true,
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
        subcommands: {
          pl: {
            name: 'Left Padding',
            shortcut: 'pl',
            hasValue: true,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          pr: {
            name: 'Right Padding',
            shortcut: 'pr',
            hasValue: true,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          pt: {
            name: 'Top Padding',
            shortcut: 'pt',
            hasValue: true,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          pb: {
            name: 'Bottom Padding',
            shortcut: 'pb',
            hasValue: true,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          px: {
            name: 'Horizontal Padding',
            shortcut: 'px',
            hasValue: true,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
          py: {
            name: 'Vertical Padding',
            shortcut: 'py',
            hasValue: true,
            action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
          },
        },
        action: ({ param, value, nodes }) => setPadding({ param, value, nodes }),
      },
    },
  },

  //Strokes
  st: {
    name: 'Strokes',
    description: 'Shortcuts for setting stroke width and alignment for elements, including individual edges.',
    shortcut: 'st',
    type: 'GROUP',
    subcommands: {
      //Set Stroke Width
      st: {
        name: 'Stroke Width',
        shortcut: 'st',
        description: 'These are the shortcuts related to adjusting the stroke width of any object',
        type: 'GROUP',
        subcommands: {
          st: {
            name: 'Strokes',
            shortcut: 'st',
            hasValue: true,
            subcommands: {
              stl: {
                name: 'Left Stroke',
                shortcut: 'stl',
                hasValue: true,
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              str: {
                name: 'Right Stroke',
                shortcut: 'str',
                hasValue: true,
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              stt: {
                name: 'Top Stroke',
                shortcut: 'stt',
                hasValue: true,
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              stb: {
                name: 'Bottom Stroke',
                shortcut: 'stb',
                hasValue: true,
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              stx: {
                name: 'Horizontal Strokes',
                shortcut: 'stx',
                hasValue: true,
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
              sty: {
                name: 'Vertical Strokes',
                shortcut: 'sty',
                hasValue: true,
                action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
              },
            },
            action: ({ param, value, nodes }) => setStrokeWidth({ param, value, nodes }),
          },
        },
      },

      //Set Stroke Align
      sta: {
        name: 'Stroke Alignment',
        shortcut: 'sta',
        description: 'These are the shortcuts related to adjusting the stroke alignment of any object',
        type: 'GROUP',
        subcommands: {
          sti: {
            name: 'Stroke Align Inside',
            message: 'Set alignment of stroke to inside',
            shortcut: 'sti',
            hasValue: false,
            action: ({ param, nodes }) => setStrokeAlign({ param, nodes }),
          },
          stc: {
            name: 'Stroke Align Center',
            message: 'Set alignment of stroke to center',
            shortcut: 'stc',
            hasValue: false,
            action: ({ param, nodes }) => setStrokeAlign({ param, nodes }),
          },
          sto: {
            name: 'Stroke Align Outside',
            message: 'Set alignment of stroke to outside',
            shortcut: 'sto',
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
        message: 'Replace fill color with',
        unit: 'hex',
        action: ({ param, value, nodes }) => setFill({ param, value, nodes }),
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
    description: 'Shortcuts for setting autolayout children behavior — hug, fill, fixed, toggle, or smart auto mode.',
    shortcut: 'a',
    type: 'GROUP',
    subcommands: {
      // HUG
      ah: {
        name: 'Hug Both',
        shortcut: 'ah',
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
        subcommands: {
          awh: {
            name: 'Hug Width',
            shortcut: 'awh',
            hasValue: false,
            action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
          },
          ahh: {
            name: 'Hug Height',
            shortcut: 'ahh',
            hasValue: false,
            action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
          },
        },
      },

      // FILL
      af: {
        name: 'Fill Both',
        shortcut: 'af',
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
        subcommands: {
          awf: {
            name: 'Fill Width',
            shortcut: 'awf',
            hasValue: false,
            action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
          },
          ahf: {
            name: 'Fill Height',
            shortcut: 'ahf',
            hasValue: false,
            action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
          },
        },
      },

      // FIXED
      afi: {
        name: 'Fixed Both',
        shortcut: 'afi',
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
        subcommands: {
          awfi: {
            name: 'Fixed Width',
            shortcut: 'awfi',
            hasValue: false,
            action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
          },
          ahfi: {
            name: 'Fixed Height',
            shortcut: 'ahfi',
            hasValue: false,
            action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
          },
        },
      },

      // TOGGLES
      ax: {
        name: 'Toggle Hug ↔ Fill Horizontally',
        shortcut: 'ax',
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
      },
      ay: {
        name: 'Toggle Hug ↔ Fill Vertically',
        shortcut: 'ay',
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
      },

      // SMART AUTO
      aa: {
        name: 'Auto Behavior (Smart Fill/Hug)',
        shortcut: 'aa',
        hasValue: false,
        action: ({ param, nodes }) => setAutolayoutBehavior({ command: param, nodes }),
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
