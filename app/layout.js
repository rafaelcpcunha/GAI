import "./globals.css";
import { pixelFont } from "./fonts";

export const metadata = {
  title: "Estrada Neon",
  description: "Corrida arcade pseudo-3D no navegador, num deserto em plena noite de Halloween.",
};

export const viewport = {
  themeColor: "#040109",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={pixelFont.className}>{children}</body>
    </html>
  );
}
