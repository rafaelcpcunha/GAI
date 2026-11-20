import "./globals.css";
import { pixelFont } from "./fonts";

export const metadata = {
  title: "Estrada Neon",
  description: "Corrida arcade pseudo-3D no navegador, com visual synthwave dos anos 80.",
};

export const viewport = {
  themeColor: "#0b0221",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={pixelFont.className}>{children}</body>
    </html>
  );
}
