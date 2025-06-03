// app/AuthLayout.client.js
'use client';
import { CartProvider } from "@/hooks/use-cart";
import { SocketProvider } from "./contexts/SocketContext";
import ClientLayout from "./components/ClientLayout";
import ErrorLayout from "./erreur/layout";

export default function AuthLayout({ children, notFound, userRole }) {
  return (
    <SocketProvider userRole={userRole}>
      {notFound ? (
        <ErrorLayout>{children}</ErrorLayout>
      ) : (
        <CartProvider>
          <ClientLayout>{children}</ClientLayout>
        </CartProvider>
      )}
    </SocketProvider>
  );
}