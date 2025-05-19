import { parameterRoutingProps } from './param-routing';
import setHeight from './utils/set-dimensions/set-height';
import setPadding from './utils/set-padding';
import setPosition from './utils/set-pos';
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
import move from './utils/move/move';
import dockWithConstraints from './utils/dock-with-constraints/dock-with-constraints';
import dockOutWithConstraints from './utils/dock-out-with-constraints/dock-out-with-constraints';
import setStrokeAlign from './utils/stroke/set-stroke-align';
import filterSelection from './utils/selection/filter-selection';
import excludeSelection from './utils/selection/exclude-selection';
import countSelectedElements from './utils/count/count';
import { swapSelectedElements } from './utils/swap/swap';
import { fitToParent } from './utils/fit/fit';

export interface PropItem {
  name: string;
  shortcut: string;
  hasValue: boolean;
  subcommands?: Record<string, PropItem>;
  allowsNegative?: boolean;
  unit?: string;
  message?: string;
  action?: ({ param, value, nodes }: parameterRoutingProps) => void;
}

export const propList: Record<string, PropItem> = {
  //Position
  pos: {
    name: 'Position',
    shortcut: 'pos',
    hasValue: true,
    subcommands: {
      posx: {
        name: 'Position X',
        shortcut: 'posx',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, value, nodes }) => setPosition({ param, value, nodes }),
      },
      posy: {
        name: 'Position Y',
        shortcut: 'posy',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, value, nodes }) => setPosition({ param, value, nodes }),
      },
    },
    allowsNegative: true,
    action: ({ param, value, nodes }) => setPosition({ param, value, nodes }),
  },

  //Width
  w: {
    name: 'Width',
    shortcut: 'w',
    hasValue: true,
    allowsNegative: false,
    action: ({ param, value, nodes }) => setWidth({ param, value, nodes }),
  },

  //Height
  h: {
    name: 'Height',
    shortcut: 'h',
    hasValue: true,
    allowsNegative: false,
    action: ({ param, value, nodes }) => setHeight({ param, value, nodes }),
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

  //Radius
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
    },
  },

  //Padding
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

  //Set Stroke Width
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

  //Set Stroke Align
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

  //Filter Selection
  fs: {
    name: 'Filter Selection',
    shortcut: 'fs',
    hasValue: false,
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
    hasValue: false,
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

  //Clip
  clip: {
    name: 'Toggle Clipping',
    shortcut: 'clip',
    hasValue: false,
    action: ({ nodes }) => toggleClip({ nodes }),
  },

  // Count
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

  //Move
  m: {
    name: 'Move',
    shortcut: 'm',
    hasValue: false,
    subcommands: {
      ml: {
        name: 'Move Left',
        shortcut: 'ml',
        hasValue: true,
        action: ({ param, nodes, value }) => move({ param, nodes, value }),
      },
      mr: {
        name: 'Move Right',
        shortcut: 'mr',
        hasValue: true,
        action: ({ param, nodes, value }) => move({ param, nodes, value }),
      },
      mt: {
        name: 'Move Top',
        shortcut: 'mt',
        hasValue: true,
        action: ({ param, nodes, value }) => move({ param, nodes, value }),
      },
      mb: {
        name: 'Move Bottom',
        shortcut: 'mb',
        hasValue: true,
        action: ({ param, nodes, value }) => move({ param, nodes, value }),
      },
    },
  },

  //Dock with Constraints
  d: {
    name: 'Dock',
    shortcut: 'd',
    hasValue: false,
    allowsNegative: true,
    subcommands: {
      dl: {
        name: 'Dock to Left',
        shortcut: 'dl',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
      },
      dr: {
        name: 'Dock to Right',
        shortcut: 'dr',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
      },
      dt: {
        name: 'Dock to Top',
        shortcut: 'dt',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
        subcommands: {
          dtl: {
            name: 'Dock to Top Left',
            shortcut: 'dtl',
            hasValue: true,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
          },
          dtr: {
            name: 'Dock to Top Right',
            shortcut: 'dtr',
            hasValue: true,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
          },
        },
      },
      db: {
        name: 'Dock to Bottom',
        shortcut: 'db',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
        subcommands: {
          dbl: {
            name: 'Dock to Bottom Left',
            shortcut: 'dbl',
            hasValue: true,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
          },
          dbr: {
            name: 'Dock to Bottom Right',
            shortcut: 'dbr',
            hasValue: true,
            allowsNegative: true,
            action: ({ param, nodes, value }) => dockWithConstraints({ param, nodes, value }),
          },
        },
      },
    },
  },

  //Dock out with Constraints
  D: {
    name: 'Dock',
    shortcut: 'D',
    hasValue: false,
    allowsNegative: true,
    subcommands: {
      DL: {
        name: 'Dock out Lefts',
        shortcut: 'DL',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
      },
      DR: {
        name: 'Dock out Right',
        shortcut: 'DR',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
      },
      DT: {
        name: 'Dock out Top',
        shortcut: 'DT',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
      },
      DB: {
        name: 'Dock out Bottom',
        shortcut: 'DB',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, nodes, value }) => dockOutWithConstraints({ param, nodes, value }),
      },
    },
  },

  //Constraints
  c: {
    name: 'Stretch all Constraints',
    shortcut: 'c',
    hasValue: false,
    action: ({ param, nodes }) => setConstraints({ shortcut: param, nodes }),
    subcommands: {
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
        name: 'Stretch all Horizontal Constraints',
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
        name: 'Stretch all Vertical Constraints',
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
};

export function flattenCommands(
  commands: Record<string, PropItem>,
  flattenedCommands: Record<string, PropItem> = {}
): Record<string, PropItem> {
  for (const key in commands) {
    flattenedCommands[key] = commands[key];

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
