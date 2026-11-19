import "./globals.css";

export const metadata = {
  title: "Site em construção",
  description: "Estamos preparando algo especial.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
