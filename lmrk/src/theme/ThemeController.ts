// ThemeController: manages global theme colors for the app

export type ThemeName = "default" | "moonlight" | "mint";
  

export interface ThemeColors {
  main: string; // Main accent color
  gradientFrom: string; // Gradient start
  gradientTo: string;   // Gradient end
  menuBarBg: string;
  menuBarText: string;
  floatingMenuBg: string;
  floatingMenuIcon: string;
  pageBg: string;
  buttonBg: string; // Primary button background
  buttonHover: string; // Primary button hover
  buttonText: string; // Primary button text
  badgeBg: string; // Badge background
  badgeText: string; // Badge text
  cardBorder: string; // Card border accent
  pageHeading: string; // Page heading text on gradient background
  pageSubtext: string; // Page subtext on gradient background
}

export class ThemeController {
  private static instance: ThemeController;
  private _theme: ThemeName = "default";
  private _colors: ThemeColors;

  private constructor() {
    this._colors = ThemeController.defaultColors();
  }

  static moonlightColors(): ThemeColors {
    return {
      main: "#15507a",
      gradientFrom: "#15507a",
      gradientTo: "#4fd1c5", // teal blue for contrast
      menuBarBg: "#15507a",
      menuBarText: "#fff",
      floatingMenuBg: "#fff",
      floatingMenuIcon: "#15507a",
      pageBg: "linear-gradient(135deg, #15507a 0%, #4fd1c5 100%)",
      buttonBg: "#15507a",
      buttonHover: "#0e3a5a",
      buttonText: "#fff",
      badgeBg: "#e0f2fe",
      badgeText: "#15507a",
      cardBorder: "#15507a",
      pageHeading: "#ffffff",
      pageSubtext: "rgba(20, 10, 33, 0.9)",
    };
  }

  setMoonlight() {
    this._theme = "moonlight";
    this._colors = ThemeController.moonlightColors();
    this.applyTheme();
  }

  static getInstance(): ThemeController {
    if (!ThemeController.instance) {
      ThemeController.instance = new ThemeController();
    }
    return ThemeController.instance;
  }

  static defaultColors(): ThemeColors {
    return {
      main: "#6d28d9",
      gradientFrom: "#6d28d9",
      gradientTo: "#a78bfa",
      menuBarBg: "#6d28d9",
      menuBarText: "#fff",
      floatingMenuBg: "#fff",
      floatingMenuIcon: "#6d28d9",
      pageBg: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
      buttonBg: "#6d28d9",
      buttonHover: "#5b21b6",
      buttonText: "#fff",
      badgeBg: "#f3e8ff",
      badgeText: "#6d28d9",
      cardBorder: "#6d28d9",
      pageHeading: "#ffffff",
      pageSubtext: "rgba(0, 0, 0, 0.9)",
    };
  }

  setDefault() {
    this._theme = "default";
    this._colors = ThemeController.defaultColors();
    this.applyTheme();
  }

  static mintColors(): ThemeColors {
    return {
      main: "#2eccb6", // Mint green, accessible
      gradientFrom: "#2eccb6",
      gradientTo: "#a3f7bf", // Soft light mint
      menuBarBg: "#2eccb6",
      menuBarText: "#1a2e2b", // Very dark teal for contrast
      floatingMenuBg: "#fff",
      floatingMenuIcon: "#2eccb6",
      pageBg: "linear-gradient(135deg, #2eccb6 0%, #a3f7bf 100%)",
      buttonBg: "#2eccb6",
      buttonHover: "#25a896",
      buttonText: "#1a2e2b",
      badgeBg: "#d1fae5",
      badgeText: "#065f46",
      cardBorder: "#2eccb6",
      pageHeading: "#ffffff",
      pageSubtext: "rgba(5, 39, 35, 0.9)",
    };
  }

  setMint() {
    this._theme = "mint";
    this._colors = ThemeController.mintColors();
    this.applyTheme();
  }

  get theme(): ThemeName {
    return this._theme;
  }

  get colors(): ThemeColors {
    return this._colors;
  }

  // Applies the theme colors to CSS variables on :root
  applyTheme() {
    const root = document.documentElement;
    Object.entries(this._colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // Add RGB values for transparency effects
    // Convert main color to RGB
    const mainColor = this._colors.main;
    const rgb = this.hexToRgb(mainColor);
    if (rgb) {
      root.style.setProperty('--theme-main-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// On first load, apply default theme
if (typeof window !== "undefined") {
  ThemeController.getInstance().applyTheme();
}
