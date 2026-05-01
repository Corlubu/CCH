import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Definición de la interfaz de Usuario basada en el esquema de la base de datos
interface User {
  id: number;
  username: string;
  role: "ADMIN" | "STAFF" | "CITIZEN"; // Roles estrictos según el esquema
  fullName: string;
  email: string | null;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

/**
 * Almacén de autenticación con Zustand.
 * Se ha cambiado el almacenamiento a sessionStorage para mejorar la seguridad
 * frente a ataques persistentes, garantizando que la sesión se limpie al cerrar la pestaña.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      // Establece el token y la información del usuario tras un login exitoso
      setAuth: (token: string, user: User) => {
        set({ token, user });
      },

      // Limpia la sesión (Logout)
      clearAuth: () => {
        set({ token: null, user: null });
      },

      // Verifica si existe un token activo
      isAuthenticated: () => {
        return get().token !== null;
      },
    }),
    {
      name: "foodbank-auth-storage",
      /**
       * SUGERENCIA DE SEGURIDAD IMPLEMENTADA:
       * Se utiliza 'sessionStorage' en lugar de 'localStorage' para que el token
       * no persista indefinidamente en el disco del cliente.
       */
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
