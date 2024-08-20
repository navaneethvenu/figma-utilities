import { parameterRoutingProps } from './param-routing';
import setConstraints from './utils/set-constraints';
import setHeight from './utils/set-height';
import setPadding from './utils/set-padding';
import setPosition from './utils/set-pos';
import setRadius from './utils/set-radius';
import setStroke from './utils/set-stroke';
import setWidth from './utils/set-width';
import toggleClip from './utils/toggle-clip';

export interface PropItem {
  name: string;
  shortcut: string;
  hasValue: boolean;
  subcommands?: Record<string, PropItem>;
  allowsNegative?: boolean;
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
  //Corner Radius
  c: {
    name: 'Stretch all Constraints',
    shortcut: 'c',
    hasValue: false,
    subcommands: {
      cc: {
        name: 'Center all Constraints',
        shortcut: 'cc',
        hasValue: false,
      },
      cs: {
        name: 'Scale all Constraints',
        shortcut: 'cs',
        hasValue: false,
      },
      cx: {
        name: 'Stretch all Horizontal Constraints',
        shortcut: 'cx',
        hasValue: false,
        subcommands: {
          cxc: {
            name: 'Center all Horizontal Constraints',
            shortcut: 'cxc',
            hasValue: false,
          },
          cxs: {
            name: 'Scale all Horizontal Constraints',
            shortcut: 'cxs',
            hasValue: false,
          },
          cxl: {
            name: 'Set Horizontal Constraints to Left',
            shortcut: 'cxl',
            hasValue: false,
          },
          cxr: {
            name: 'Set Horizontal Constraints to Right',
            shortcut: 'cxr',
            hasValue: false,
          },
        },
      },
      cy: {
        name: 'Stretch all Vertical Constraints',
        shortcut: 'cy',
        hasValue: false,
        subcommands: {
          cyc: {
            name: 'Center all Vertical Constraints',
            shortcut: 'cyc',
            hasValue: false,
          },
          cys: {
            name: 'Scale all Vertical Constraints',
            shortcut: 'cxs',
            hasValue: false,
          },
          cyt: {
            name: 'Set Vertical Constraints to Top',
            shortcut: 'cyl',
            hasValue: false,
          },
          cyb: {
            name: 'Set Vertical Constraints to Bottom',
            shortcut: 'cyr',
            hasValue: false,
          },
        },
      },
    },
    action: ({ param, node }) => setConstraints({ param, node }),
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
