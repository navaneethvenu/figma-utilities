interface propItem {
  name: string;
  shortcut: string;
  hasValue: boolean;
}

export const propList: Record<string, propItem> = {
  //Position
  pos: {
    name: 'Position',
    shortcut: 'pos',
    hasValue: true,
  },
  posx: {
    name: 'Position X',
    shortcut: 'posx',
    hasValue: true,
  },
  posy: {
    name: 'Position Y',
    shortcut: 'posy',
    hasValue: true,
  },
  //Width
  w: {
    name: 'Width',
    shortcut: 'w',
    hasValue: true,
  },
  //Height
  h: {
    name: 'Height',
    shortcut: 'h',
    hasValue: true,
  },
  //Radius
  r: {
    name: 'Corner Radius',
    shortcut: 'r',
    hasValue: true,
  },
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
  rt: {
    name: 'Top Corner Radius',
    shortcut: 'rt',
    hasValue: true,
  },
  rb: {
    name: 'Bottom Corner Radius',
    shortcut: 'rb',
    hasValue: true,
  },
  //Padding
  p: {
    name: 'Padding',
    shortcut: 'p',
    hasValue: true,
  },
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
  //Stroke
  st: {
    name: 'Strokes',
    shortcut: 'st',
    hasValue: true,
  },
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
  //Clip
  clip: {
    name: 'Toggle Clipping',
    shortcut: 'clip',
    hasValue: false,
  },
  //Corner Radius
  c: {
    name: 'Stretch all Constraints',
    shortcut: 'c',
    hasValue: false,
  },
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
  },
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
  cy: {
    name: 'Stretch all Vertical Constraints',
    shortcut: 'cy',
    hasValue: false,
  },
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
};
