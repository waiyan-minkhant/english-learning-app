import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", "[data-theme='dark']"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        surface: {
          DEFAULT: "var(--color-surface)",
          secondary: "var(--color-surface-secondary)"
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)"
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)"
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)"
        },
        brand: {
          background: "var(--color-brand-background)",
          subtle: "var(--color-brand-gradient-from)",
          "gradient-from": "var(--color-brand-gradient-from)",
          "gradient-to": "var(--color-brand-gradient-to)"
        },
        locked: {
          "gradient-from": "var(--color-locked-gradient-from)",
          "gradient-to": "var(--color-locked-gradient-to)"
        },
        icon: {
          DEFAULT: "var(--color-icon)",
          onBrand: "var(--color-icon-on-brand)"
        },
        success: {
          DEFAULT: "var(--color-success)",
          foreground: "var(--color-success-foreground)"
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          foreground: "var(--color-danger-foreground)"
        },
        warning: {
          DEFAULT: "var(--color-warning)"
        },
        media: "var(--color-media)"
      },
      fontSize: {
        "title-32": [
          "var(--font-size-title-32)",
          { lineHeight: "var(--line-height-title-32)" }
        ],
        "title-24": [
          "var(--font-size-title-24)",
          { lineHeight: "var(--line-height-title-24)" }
        ],
        "title-20": [
          "var(--font-size-title-20)",
          { lineHeight: "var(--line-height-title-20)" }
        ],
        "title-16": [
          "var(--font-size-title-16)",
          { lineHeight: "var(--line-height-title-16)" }
        ],
        "body-20": [
          "var(--font-size-body-20)",
          { lineHeight: "var(--line-height-body-20)" }
        ],
        "body-16": [
          "var(--font-size-body-16)",
          { lineHeight: "var(--line-height-body-16)" }
        ],
        "body-14": [
          "var(--font-size-body-14)",
          { lineHeight: "var(--line-height-body-14)" }
        ],
        "body-12": [
          "var(--font-size-body-12)",
          { lineHeight: "var(--line-height-body-12)" }
        ]
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "9999px"
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)"
      },
      zIndex: {
        dropdown: "var(--z-dropdown)",
        overlay: "var(--z-overlay)",
        modal: "var(--z-modal)",
        tooltip: "var(--z-tooltip)"
      }
    }
  },
  plugins: []
};

export default config;
