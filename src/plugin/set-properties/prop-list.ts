import { parameterRoutingProps } from './param-routing';
import setHeight from './utils/set-dimensions/set-height';
import setPadding from './utils/set-padding';
import setPosition from './utils/set-pos';
import setRadius from './utils/set-radius';
import setStroke from './utils/set-stroke';
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

export interface PropItem {
  name: string;
  shortcut: string;
  hasValue: boolean;
  subcommands?: Record<string, PropItem>;
  allowsNegative?: boolean;
  unit?: string;
  action?: ({ param, value, node }: parameterRoutingProps) => void;
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
      },
      posy: {
        name: 'Position Y',
        shortcut: 'posy',
        hasValue: true,
        allowsNegative: true,
      },
    },
    allowsNegative: true,
    action: ({ param, value, node }) => setPosition({ param, value, node }),
  },

  //Width
  w: {
    name: 'Width',
    shortcut: 'w',
    hasValue: true,
    allowsNegative: false,
    action: ({ param, value, node }) => setWidth({ param, value, node }),
  },

  //Height
  h: {
    name: 'Height',
    shortcut: 'h',
    hasValue: true,
    allowsNegative: false,
    action: ({ param, value, node }) => setHeight({ param, value, node }),
  },

  //Scale
  sc: {
    name: 'Scale',
    shortcut: 'sc',
    hasValue: true,
    allowsNegative: true,
    unit: '%',
    action: ({ param, value, node }) => setScale({ param, value, node }),
    subcommands: {
      scw: {
        name: 'Scale Width',
        shortcut: 'scw',
        hasValue: true,
        allowsNegative: false,
        action: ({ param, value, node }) => setScaleWidth({ param, value, node }),
      },
      sch: {
        name: 'Scale Height',
        shortcut: 'sch',
        hasValue: true,
        allowsNegative: false,
        action: ({ param, value, node }) => setScaleHeight({ param, value, node }),
      },
    },
  },

  //Size
  s: {
    name: 'Size',
    shortcut: 's',
    hasValue: true,
    allowsNegative: false,
    action: ({ param, value, node }) => setSize({ param, value, node }),
  },

  //Radius
  r: {
    name: 'Corner Radius',
    shortcut: 'r',
    hasValue: true,
    subcommands: {
      rt: {
        name: 'Top Corner Radius',
        shortcut: 'rt',
        hasValue: true,
        subcommands: {
          rtl: {
            name: 'Top Left Corner Radius',
            shortcut: 'rtl',
            hasValue: true,
          },
          rtr: {
            name: 'Top Right Corner Radius',
            shortcut: 'rtr',
            hasValue: true,
          },
        },
      },
      rb: {
        name: 'Bottom Corner Radius',
        shortcut: 'rb',
        hasValue: true,
        subcommands: {
          rbl: {
            name: 'Bottom Left Corner Radius',
            shortcut: 'rbl',
            hasValue: true,
          },
          rbr: {
            name: 'Bottom Right Corner Radius',
            shortcut: 'rbr',
            hasValue: true,
          },
        },
      },
    },
    action: ({ param, value, node }) => setRadius({ param, value, node }),
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
      },
      pr: {
        name: 'Right Padding',
        shortcut: 'pr',
        hasValue: true,
      },
      pt: {
        name: 'Top Padding',
        shortcut: 'pt',
        hasValue: true,
      },
      pb: {
        name: 'Bottom Padding',
        shortcut: 'pb',
        hasValue: true,
      },
      px: {
        name: 'Horizontal Padding',
        shortcut: 'px',
        hasValue: true,
      },
      py: {
        name: 'Vertical Padding',
        shortcut: 'py',
        hasValue: true,
      },
    },
    action: ({ param, value, node }) => setPadding({ param, value, node }),
  },

  //Stroke
  st: {
    name: 'Strokes',
    shortcut: 'st',
    hasValue: true,
    subcommands: {
      stl: {
        name: 'Left Stroke',
        shortcut: 'stl',
        hasValue: true,
      },
      str: {
        name: 'Right Stroke',
        shortcut: 'str',
        hasValue: true,
      },
      stt: {
        name: 'Top Stroke',
        shortcut: 'stt',
        hasValue: true,
      },
      stb: {
        name: 'Bottom Stroke',
        shortcut: 'stb',
        hasValue: true,
      },
      stx: {
        name: 'Horizontal Strokes',
        shortcut: 'stx',
        hasValue: true,
      },
      sty: {
        name: 'Vertical Strokes',
        shortcut: 'sty',
        hasValue: true,
      },
    },
    action: ({ param, value, node }) => setStroke({ param, value, node }),
  },

  //Clip
  clip: {
    name: 'Toggle Clipping',
    shortcut: 'clip',
    hasValue: false,
    action: ({ node }) => toggleClip({ node }),
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
        action: ({ param, node, value }) => move({ param, node, value }),
      },
      mr: {
        name: 'Move Right',
        shortcut: 'mr',
        hasValue: true,
        action: ({ param, node, value }) => move({ param, node, value }),
      },
      mt: {
        name: 'Move Top',
        shortcut: 'mt',
        hasValue: true,
        action: ({ param, node, value }) => move({ param, node, value }),
      },
      mb: {
        name: 'Move Bottom',
        shortcut: 'mb',
        hasValue: true,
        action: ({ param, node, value }) => move({ param, node, value }),
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
        name: 'Dock Left with Constraints',
        shortcut: 'dl',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, node, value }) => dockWithConstraints({ param, node, value }),
      },
      dr: {
        name: 'Dock Right with Constraints',
        shortcut: 'dr',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, node, value }) => dockWithConstraints({ param, node, value }),
      },
      dt: {
        name: 'Dock Top with Constraints',
        shortcut: 'dt',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, node, value }) => dockWithConstraints({ param, node, value }),
      },
      db: {
        name: 'Dock Bottom with Constraints',
        shortcut: 'db',
        hasValue: true,
        allowsNegative: true,
        action: ({ param, node, value }) => dockWithConstraints({ param, node, value }),
      },
    },
  },

  //Constraints
  c: {
    name: 'Stretch all Constraints',
    shortcut: 'c',
    hasValue: false,
    action: ({ param, node }) => setConstraints({ shortcut: param, node }),
    subcommands: {
      cc: {
        name: 'Center all Constraints',
        shortcut: 'cc',
        hasValue: false,
        action: ({ param, node }) => setConstraints({ shortcut: param, node }),
      },
      cs: {
        name: 'Scale all Constraints',
        shortcut: 'cs',
        hasValue: false,
        action: ({ param, node }) => setConstraints({ shortcut: param, node }),
      },
      cx: {
        name: 'Stretch all Horizontal Constraints',
        shortcut: 'cx',
        hasValue: false,
        action: ({ param, node }) => setConstraints({ shortcut: param, node }),

        subcommands: {
          cxc: {
            name: 'Center all Horizontal Constraints',
            shortcut: 'cxc',
            hasValue: false,
            action: ({ param, node }) => setConstraints({ shortcut: param, node }),
          },
          cxs: {
            name: 'Scale all Horizontal Constraints',
            shortcut: 'cxs',
            hasValue: false,
            action: ({ param, node }) => setConstraints({ shortcut: param, node }),
          },
          cxl: {
            name: 'Set Horizontal Constraints to Left',
            shortcut: 'cxl',
            hasValue: false,
            action: ({ param, node }) => setConstraints({ shortcut: param, node }),
          },
          cxr: {
            name: 'Set Horizontal Constraints to Right',
            shortcut: 'cxr',
            hasValue: false,
            action: ({ param, node }) => setConstraints({ shortcut: param, node }),
          },
        },
      },
      cy: {
        name: 'Stretch all Vertical Constraints',
        shortcut: 'cy',
        hasValue: false,
        action: ({ param, node }) => setConstraints({ shortcut: param, node }),
        subcommands: {
          cyc: {
            name: 'Center all Vertical Constraints',
            shortcut: 'cyc',
            hasValue: false,
            action: ({ param, node }) => setConstraints({ shortcut: param, node }),
          },
          cys: {
            name: 'Scale all Vertical Constraints',
            shortcut: 'cys',
            hasValue: false,
            action: ({ param, node }) => setConstraints({ shortcut: param, node }),
          },
          cyt: {
            name: 'Set Vertical Constraints to Top',
            shortcut: 'cyt',
            hasValue: false,
            action: ({ param, node }) => setConstraints({ shortcut: param, node }),
          },
          cyb: {
            name: 'Set Vertical Constraints to Bottom',
            shortcut: 'cyb',
            hasValue: false,
            action: ({ param, node }) => setConstraints({ shortcut: param, node }),
          },
        },
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
        action: ({ param, node }) => {
          setQuickSelect({ param, node });
        },
      },
      sell: {
        name: 'Select Left',
        shortcut: 'sell',
        hasValue: false,
        allowsNegative: false,
        action: ({ param, node }) => {
          setQuickSelect({ param, node });
        },
      },
      selt: {
        name: 'Select Top',
        shortcut: 'selt',
        hasValue: false,
        allowsNegative: false,
        action: ({ param, node }) => {
          setQuickSelect({ param, node });
        },
      },
      selb: {
        name: 'Select Bottom',
        shortcut: 'selb',
        hasValue: false,
        allowsNegative: false,
        action: ({ param, node }) => {
          setQuickSelect({ param, node });
        },
      },
    },
  },
};

export function flattenCommands(
  commands: Record<string, PropItem>,
  flattenedCommands: Record<string, PropItem>
): Record<string, PropItem> {
  for (const key in commands) {
    flattenedCommands[key] = commands[key];
    if (commands[key].subcommands) {
      flattenCommands(commands[key].subcommands!, flattenedCommands);
    }
  }

  return flattenedCommands;
}
