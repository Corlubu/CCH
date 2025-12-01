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
import { BRAND_CONFIG } from "~/config/branding";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Local state for form inputs
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("America/New_York");

  // Check authentication
  useEffect(() => {
    if (!user || !token) {
      void navigate({ to: "/login" });
    }
  }, [user, token, navigate]);

  // Fetch user preferences
  const preferencesQuery = useQuery(
    token
      ? trpc.getUserPreferences.queryOptions({ authToken: token })
      : { enabled: false, queryKey: ["disabled"] }
  );

  // Update local state when preferences load
  useEffect(() => {
    if (preferencesQuery.data) {
      setEmailNotifications(preferencesQuery.data.emailNotifications);
      setSmsNotifications(preferencesQuery.data.smsNotifications);
      setEventReminders(preferencesQuery.data.eventReminders);
      setTheme(preferencesQuery.data.theme as "light" | "dark");
      setLanguage(preferencesQuery.data.language);
      setTimezone(preferencesQuery.data.timezone);
    }
  }, [preferencesQuery.data]);

  const updatePreferencesMutation = useMutation(
    trpc.updateUserPreferences.mutationOptions({
      onSuccess: () => {
        toast.success("Settings saved successfully!");
        void queryClient.invalidateQueries({ queryKey: trpc.getUserPreferences.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save settings");
      },
    })
  );

  const handleSave = () => {
    if (!token) return;

    updatePreferencesMutation.mutate({
      authToken: token,
      emailNotifications,
      smsNotifications,
      eventReminders,
      theme,
      language,
      timezone,
    });
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
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-600">Manage your preferences</p>
              </div>
            </div>
            <Link
              to={getDashboardLink()}
              className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
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
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Notifications Section */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                  <p className="text-sm text-gray-600">
                    Choose how you want to receive updates
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">
                        Receive updates and announcements via email
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
                      <p className="font-medium text-gray-900">SMS Notifications</p>
                      <p className="text-sm text-gray-600">
                        Get text messages for important updates
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
                      <p className="font-medium text-gray-900">Event Reminders</p>
                      <p className="text-sm text-gray-600">
                        Receive reminders before registered events
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
                  <h2 className="text-xl font-bold text-gray-900">Display</h2>
                  <p className="text-sm text-gray-600">Customize how the app looks</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Theme */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Theme
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
                      <span className="font-medium">Light</span>
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
                      <span className="font-medium">Dark</span>
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Note: Dark theme will be available in a future update
                  </p>
                </div>
              </div>
            </div>

            {/* Regional Settings */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="rounded-full bg-green-100 p-2">
                  <Globe className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Regional Settings</h2>
                  <p className="text-sm text-gray-600">Language and timezone preferences</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Language */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="zh">中文 (Chinese)</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Additional languages will be available in future updates
                  </p>
                </div>

                {/* Timezone */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Timezone</span>
                    </div>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Anchorage">Alaska Time (AKT)</option>
                    <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-3">
              <Link
                to="/profile"
                className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={updatePreferencesMutation.isPending}
                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Save className="h-4 w-4" />
                <span>
                  {updatePreferencesMutation.isPending ? "Saving..." : "Save Settings"}
                </span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
