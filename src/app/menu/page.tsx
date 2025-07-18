"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MenuRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la página principal
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p className="text-lg">Redirigiendo al menú...</p>
      </div>
    </div>
  );
} 