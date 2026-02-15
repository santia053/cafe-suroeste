import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./style.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'sonner';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Café de Origen | Suroeste Antioqueño",
  description: "Plataforma de e-commerce de café de especialidad del suroeste antioqueño.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${plusJakartaSans.variable} font-sans antialiased bg-background-dark text-white selection:bg-primary selection:text-white`}>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster position="top-center" richColors theme="dark" duration={2000} />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
