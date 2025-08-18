// Foundation colors
const grayscale = {
  900: "#2D3035",
  800: "#6A737D",
  100: "#F5F5F5",
  50: "#FFFFFF",
};

const primary = {
  dark: "#004D33",
  main: "#027A48",
  light: "#E6F5EF",
};

// Text colors
const text = {
  heading: grayscale[900],
  body: grayscale[800],
  button: grayscale[50],
};

// Theme colors
const light = {
  background: grayscale[50],
  tint: primary.main,
  tabIconDefault: grayscale[800],
  tabIconSelected: primary.main,
  text: text,
};

const dark = {
  background: grayscale[900],
  tint: primary.light,
  tabIconDefault: grayscale[100],
  tabIconSelected: primary.light,
  text: {
    heading: grayscale[50],
    body: grayscale[100],
    button: grayscale[900],
  },
};

export default {
  primary,
  grayscale,
  light,
  dark,
  text,
};
