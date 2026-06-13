import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "X Control - Accounts",
  description: "Enterprise X Management Suite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          id="tailwind-config"
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: "class",
                theme: {
                  extend: {
                    colors: {
                      "surface": "#f8f9ff",
                      "on-surface": "#0b1c30",
                      "secondary-fixed": "#e5e1e4",
                      "on-tertiary-fixed-variant": "#454748",
                      "tertiary": "#5c5f60",
                      "inverse-on-surface": "#eaf1ff",
                      "error": "#ba1a1a",
                      "background": "#f8f9ff",
                      "on-tertiary-container": "#2b2e2f",
                      "surface-bright": "#f8f9ff",
                      "on-surface-variant": "#3f4851",
                      "outline": "#6f7883",
                      "inverse-primary": "#99cbff",
                      "surface-dim": "#cbdbf5",
                      "surface-container-highest": "#d3e4fe",
                      "secondary-container": "#e5e1e4",
                      "primary": "#00629d",
                      "on-primary": "#ffffff",
                      "on-secondary": "#ffffff",
                      "surface-variant": "#d3e4fe",
                      "tertiary-fixed-dim": "#c5c7c8",
                      "error-container": "#ffdad6",
                      "surface-container": "#e5eeff",
                      "on-error": "#ffffff",
                      "on-tertiary-fixed": "#191c1d",
                      "surface-container-lowest": "#ffffff",
                      "surface-container-low": "#eff4ff",
                      "secondary": "#5f5e60",
                      "surface-tint": "#00629d",
                      "tertiary-container": "#939596",
                      "on-background": "#0b1c30",
                      "secondary-fixed-dim": "#c8c6c8",
                      "on-tertiary": "#ffffff",
                      "primary-fixed-dim": "#99cbff",
                      "on-primary-container": "#003050",
                      "on-primary-fixed": "#001d33",
                      "on-error-container": "#93000a",
                      "inverse-surface": "#213145",
                      "on-secondary-fixed-variant": "#474649",
                      "primary-container": "#1d9bf0",
                      "surface-container-high": "#dce9ff",
                      "outline-variant": "#bfc7d3",
                      "on-primary-fixed-variant": "#004a78",
                      "on-secondary-container": "#656466",
                      "tertiary-fixed": "#e1e3e4",
                      "primary-fixed": "#cfe5ff",
                      "on-secondary-fixed": "#1c1b1d"
                    },
                    borderRadius: {
                      DEFAULT: "0.25rem",
                      lg: "0.5rem",
                      xl: "0.75rem",
                      full: "9999px"
                    },
                    spacing: {
                      base: "4px",
                      lg: "24px",
                      gutter: "24px",
                      md: "16px",
                      sm: "8px",
                      xs: "4px",
                      xl: "32px",
                      "max-width": "1440px",
                      "margin-desktop": "40px",
                      "margin-mobile": "16px"
                    },
                    fontFamily: {
                      display: ["Inter"],
                      "body-md": ["Inter"],
                      "headline-md": ["Inter"],
                      "label-sm": ["Inter"],
                      "body-lg": ["Inter"],
                      "headline-lg-mobile": ["Inter"],
                      "label-md": ["Inter"],
                      "title-lg": ["Inter"],
                      "headline-lg": ["Inter"]
                    },
                    fontSize: {
                      display: ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
                      "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
                      "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
                      "label-sm": ["11px", { lineHeight: "16px", fontWeight: "600" }],
                      "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
                      "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
                      "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "500" }],
                      "title-lg": ["18px", { lineHeight: "28px", fontWeight: "600" }],
                      "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }]
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className="font-body-md text-body-md antialiased overflow-x-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}
