import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  Moon,
  Sun,
  Globe,
  Clock,
  Save,
} from "lucide-react";
import { useTranslation } from "react-i18next"; // 👈 Importamos el hook de i18n
import { BRAND_CONFIG } from "~/config/branding";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation(); // 👈 Inicializamos i18n

  // Estado local para los inputs del formulario
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("America/New_York");

  const isSpanish = i18n.language === 'es';

  // Verificar autenticación
  useEffect(() => {
    if (!user || !token) {
      void navigate({ to: "/login" });
    }
  }, [user, token, navigate]);

  // Obtener preferencias del usuario
  const preferencesQuery = useQuery(
    token
      ? trpc.getUserPreferences.queryOptions({ authToken: token })
      : { enabled: false, queryKey: ["disabled"] }
  );

  // Actualizar estado local cuando carguen las preferencias
  useEffect(() => {
    if (preferencesQuery.data) {
      setEmailNotifications(preferencesQuery.data.emailNotifications);
      setSmsNotifications(preferencesQuery.data.smsNotifications);
      setEventReminders(preferencesQuery.data.eventReminders);
      setTheme(preferencesQuery.data.theme as "light" | "dark");
      setLanguage(preferencesQuery.data.language);
      setTimezone(preferencesQuery.data.timezone);

      // 👈 SUGERENCIA IMPLEMENTADA: Sincronizar el idioma actual con el guardado en BD al cargar
      if (i18n.language !== preferencesQuery.data.language) {
        // Asegurarse de que el idioma en la UI coincide con el de las preferencias cargadas
        void i18n.changeLanguage(preferencesQuery.data.language);
      }
    }
  }, [preferencesQuery.data, i18n]);

  const updatePreferencesMutation = useMutation(
    trpc.updateUserPreferences.mutationOptions({
      onSuccess: () => {
        toast.success(isSpanish ? "¡Configuración guardada exitosamente!" : "Settings saved successfully!");
        void queryClient.invalidateQueries({ queryKey: trpc.getUserPreferences.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || (isSpanish ? "Error al guardar la configuración" : "Failed to save settings"));
      },
    })
  );

  const handleSave = () => {
    if (!token) return;

    // Guardar en el backend
    updatePreferencesMutation.mutate({
      authToken: token,
      emailNotifications,
      smsNotifications,
      eventReminders,
      theme,
      language,
      timezone,
    });

    // 👈 SUGERENCIA IMPLEMENTADA: Cambiar el idioma en el frontend de forma inmediata
    void i18n.changeLanguage(language);
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (user.role) {
      case "ADMIN":
        return "/admin";
      case "STAFF":
        return "/staff";
      default:
        return "/";
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BRAND_CONFIG.Icon className={`h-8 w-8 ${BRAND_CONFIG.iconColorClass}`} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isSpanish ? "Configuración" : "Settings"}
                </h1>
                <p className="text-sm text-gray-600">
                  {isSpanish ? "Administra tus preferencias" : "Manage your preferences"}
                </p>
              </div>
            </div>
            <Link
              to={getDashboardLink()}
              className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isSpanish ? "Volver al Panel" : "Back to Dashboard"}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {preferencesQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="text-gray-600">{isSpanish ? "Cargando configuración..." : "Loading settings..."}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Sección de Configuración Regional (Movida arriba por relevancia) */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="rounded-full bg-green-100 p-2">
                  <Globe className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isSpanish ? "Configuración Regional" : "Regional Settings"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {isSpanish ? "Preferencias de idioma y zona horaria" : "Language and timezone preferences"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Idioma */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {isSpanish ? "Idioma de la interfaz" : "Language"}
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Español (Spanish)</option>
                    {/* Ocultamos idiomas que aún no hemos implementado en i18n */}
                    {/* <option value="fr">Français (French)</option> */}
                    {/* <option value="zh">中文 (Chinese)</option> */}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    {isSpanish
                      ? "Este idioma se aplicará automáticamente la próxima vez que inicie sesión."
                      : "This language will be applied automatically next time you log in."}
                  </p>
                </div>

                {/* Zona Horaria */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{isSpanish ? "Zona Horaria" : "Timezone"}</span>
                    </div>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/New_York">{isSpanish ? "Hora del Este (ET)" : "Eastern Time (ET)"}</option>
                    <option value="America/Chicago">{isSpanish ? "Hora Central (CT)" : "Central Time (CT)"}</option>
                    <option value="America/Denver">{isSpanish ? "Hora de la Montaña (MT)" : "Mountain Time (MT)"}</option>
                    <option value="America/Los_Angeles">{isSpanish ? "Hora del Pacífico (PT)" : "Pacific Time (PT)"}</option>
                    <option value="America/Anchorage">{isSpanish ? "Hora de Alaska (AKT)" : "Alaska Time (AKT)"}</option>
                    <option value="Pacific/Honolulu">{isSpanish ? "Hora de Hawaii (HT)" : "Hawaii Time (HT)"}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isSpanish ? "Notificaciones" : "Notifications"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {isSpanish ? "Elige cómo deseas recibir actualizaciones" : "Choose how you want to receive updates"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {isSpanish ? "Notificaciones por Correo" : "Email Notifications"}
                      </p>
                      <p className="text-sm text-gray-600 hidden sm:block">
                        {isSpanish ? "Recibe actualizaciones y anuncios por correo" : "Receive updates and announcements via email"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      emailNotifications ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        emailNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* SMS Notifications */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {isSpanish ? "Notificaciones por SMS" : "SMS Notifications"}
                      </p>
                      <p className="text-sm text-gray-600 hidden sm:block">
                        {isSpanish ? "Recibe mensajes de texto para alertas importantes" : "Get text messages for important updates"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSmsNotifications(!smsNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      smsNotifications ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        smsNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Event Reminders */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {isSpanish ? "Recordatorios de Eventos" : "Event Reminders"}
                      </p>
                      <p className="text-sm text-gray-600 hidden sm:block">
                        {isSpanish ? "Recibe recordatorios antes de tus eventos" : "Receive reminders before registered events"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEventReminders(!eventReminders)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      eventReminders ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        eventReminders ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Display Preferences */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="rounded-full bg-purple-100 p-2">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-purple-600" />
                  ) : (
                    <Sun className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isSpanish ? "Apariencia" : "Display"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {isSpanish ? "Personaliza cómo se ve la aplicación" : "Customize how the app looks"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Theme */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {isSpanish ? "Tema" : "Theme"}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex items-center justify-center space-x-2 rounded-lg border-2 p-4 transition-colors ${
                        theme === "light"
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <Sun className="h-5 w-5" />
                      <span className="font-medium">{isSpanish ? "Claro" : "Light"}</span>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex items-center justify-center space-x-2 rounded-lg border-2 p-4 transition-colors ${
                        theme === "dark"
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <Moon className="h-5 w-5" />
                      <span className="font-medium">{isSpanish ? "Oscuro" : "Dark"}</span>
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {isSpanish
                      ? "Nota: El tema oscuro estará disponible en una futura actualización"
                      : "Note: Dark theme will be available in a future update"}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-3">
              <Link
                to="/profile"
                className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300"
              >
                {isSpanish ? "Cancelar" : "Cancel"}
              </Link>
              <button
                onClick={handleSave}
                disabled={updatePreferencesMutation.isPending}
                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Save className="h-4 w-4" />
                <span>
                  {updatePreferencesMutation.isPending
                    ? (isSpanish ? "Guardando..." : "Saving...")
                    : (isSpanish ? "Guardar Configuración" : "Save Settings")}
                </span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
