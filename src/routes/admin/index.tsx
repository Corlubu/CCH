import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import { CitizenManagementModal } from "~/components/CitizenManagementModal";
import { StaffManagementModal } from "~/components/StaffManagementModal";
import { QRScannerModal } from "~/components/QRScannerModal";
import {
  Calendar,
  Users,
  Package,
  QrCode,
  Plus,
  LogOut,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  UserCheck,
  Activity,
  BarChart3,
  Settings,
  Eye,
  X,
  Filter,
  Search,
  Edit,
  UserX,
  UserPlus,
  Download,
} from "lucide-react";
import { BRAND_CONFIG } from "~/config/branding";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().optional(),
  availableBags: z.number().min(1, "Must have at least 1 bag available"),
  startDatetime: z.string().min(1, "Start date is required").refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "Invalid start date" }
  ),
  endDatetime: z.string().min(1, "End date is required").refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "Invalid end date" }
  ),
});

type EventFormData = z.infer<typeof eventSchema>;

const registrationCooldownSchema = z.object({
  registrationCooldownEnabled: z.boolean(),
  registrationCooldownDays: z.number().min(1, "Must be at least 1 day").max(365, "Must be at most 365 days"),
});

type RegistrationCooldownFormData = z.infer<typeof registrationCooldownSchema>;

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, clearAuth } = useAuthStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEventForQR, setSelectedEventForQR] = useState<number | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "registrations" | "users" | "citizens" | "settings">("overview");
  const [eventStatusFilter, setEventStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "COMPLETED" | undefined>(undefined);
  const [userRoleFilter, setUserRoleFilter] = useState<"ADMIN" | "STAFF" | "CITIZEN" | undefined>(undefined);
  const [selectedEventDetails, setSelectedEventDetails] = useState<number | null>(null);
  const [registrationSearchQuery, setRegistrationSearchQuery] = useState("");
  const [showCitizenModal, setShowCitizenModal] = useState(false);
  const [citizenModalMode, setCitizenModalMode] = useState<"create" | "edit">("create");
  const [selectedCitizen, setSelectedCitizen] = useState<{
    id: number;
    username: string;
    fullName: string;
    email: string | null;
    phoneNumber: string | null;
  } | undefined>(undefined);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffModalMode, setStaffModalMode] = useState<"create" | "edit">("create");
  const [selectedStaff, setSelectedStaff] = useState<{
    id: number;
    username: string;
    fullName: string;
    email: string | null;
    phoneNumber: string | null;
  } | undefined>(undefined);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!user || !token) {
      void navigate({ to: "/login" });
    } else if (user.role !== "ADMIN") {
      toast.error("Access denied. Admin privileges required.");
      void navigate({ to: "/" });
    }
  }, [user, token, navigate]);

  // Fetch dashboard stats
  const statsQuery = useQuery(
    token
      ? trpc.getDashboardStats.queryOptions({ authToken: token })
      : { enabled: false, queryKey: ["disabled"] }
  );

  // Fetch all events with optional filter
  const allEventsQuery = useQuery(
    token
      ? trpc.getAllEvents.queryOptions({
          authToken: token,
          status: eventStatusFilter,
        })
      : { enabled: false, queryKey: ["disabled"] }
  );

  // Fetch recent registrations
  const recentRegistrationsQuery = useQuery(
    token
      ? trpc.getRecentRegistrations.queryOptions({
          authToken: token,
          limit: 20,
        })
      : { enabled: false, queryKey: ["disabled"] }
  );

  // Fetch all users with optional filter
  const allUsersQuery = useQuery(
    token
      ? trpc.getAllUsers.queryOptions({
          authToken: token,
          role: userRoleFilter,
        })
      : { enabled: false, queryKey: ["disabled"] }
  );

  // Fetch event details when selected
  const eventDetailsQuery = useQuery(
    token && selectedEventDetails
      ? trpc.getEventDetails.queryOptions({
          authToken: token,
          eventId: selectedEventDetails,
        })
      : { enabled: false, queryKey: ["disabled"] }
  );

  // Fetch search results for registrations
  const searchRegistrationsQuery = useQuery(
    token && registrationSearchQuery.length >= 3
      ? trpc.searchRegistrations.queryOptions({
          authToken: token,
          searchQuery: registrationSearchQuery,
        })
      : { enabled: false, queryKey: ["disabled"] }
  );

  // Fetch registration cooldown settings
  const cooldownSettingsQuery = useQuery(
    token
      ? trpc.getRegistrationCooldownSettings.queryOptions({
          authToken: token,
        })
      : { enabled: false, queryKey: ["disabled"] }
  );

  // Fetch all citizen profiles
  const citizenProfilesQuery = useQuery(
    token
      ? trpc.getAllCitizenProfiles.queryOptions({
          authToken: token,
        })
      : { enabled: false, queryKey: ["disabled"] }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const {
    register: registerCooldown,
    handleSubmit: handleSubmitCooldown,
    formState: { errors: cooldownErrors },
    watch: watchCooldown,
    setValue: setValueCooldown,
  } = useForm<RegistrationCooldownFormData>({
    resolver: zodResolver(registrationCooldownSchema),
    defaultValues: {
      registrationCooldownEnabled: true,
      registrationCooldownDays: 14,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (cooldownSettingsQuery.data) {
      setValueCooldown("registrationCooldownEnabled", cooldownSettingsQuery.data.registrationCooldownEnabled);
      setValueCooldown("registrationCooldownDays", cooldownSettingsQuery.data.registrationCooldownDays);
    }
  }, [cooldownSettingsQuery.data, setValueCooldown]);

  const cooldownEnabled = watchCooldown("registrationCooldownEnabled");

  const createEventMutation = useMutation(
    trpc.createEvent.mutationOptions({
      onSuccess: () => {
        toast.success("Event created successfully!");
        reset();
        setShowEventForm(false);
        void queryClient.invalidateQueries({ queryKey: trpc.getAllEvents.queryKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.getDashboardStats.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create event");
      },
    })
  );

  const generateQRMutation = useMutation(
    trpc.generateQRCode.mutationOptions({
      onSuccess: (data) => {
        setQrCodeUrl(data.registrationUrl);
        toast.success("QR code generated successfully!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate QR code");
      },
    })
  );

  const updateEventStatusMutation = useMutation(
    trpc.updateEventStatus.mutationOptions({
      onSuccess: () => {
        toast.success("Event status updated successfully!");
        void queryClient.invalidateQueries({ queryKey: trpc.getAllEvents.queryKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.getDashboardStats.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update event status");
      },
    })
  );

  const updateCheckInMutation = useMutation(
    trpc.updateRegistrationCheckIn.mutationOptions({
      onSuccess: () => {
        toast.success("Check-in status updated!");
        void queryClient.invalidateQueries({ queryKey: trpc.getRecentRegistrations.queryKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.getEventDetails.queryKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.getDashboardStats.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update check-in status");
      },
    })
  );

  const toggleCitizenStatusMutation = useMutation(
    trpc.toggleCitizenStatus.mutationOptions({
      onSuccess: () => {
        toast.success("Citizen status updated successfully!");
        void queryClient.invalidateQueries({ queryKey: trpc.getAllUsers.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update citizen status");
      },
    })
  );

  const toggleStaffStatusMutation = useMutation(
    trpc.toggleStaffStatus.mutationOptions({
      onSuccess: () => {
        toast.success("Staff status updated successfully!");
        void queryClient.invalidateQueries({ queryKey: trpc.getAllUsers.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update staff status");
      },
    })
  );

  const updateCooldownSettingsMutation = useMutation(
    trpc.updateRegistrationCooldownSettings.mutationOptions({
      onSuccess: () => {
        toast.success("Settings updated successfully!");
        void queryClient.invalidateQueries({ queryKey: trpc.getRegistrationCooldownSettings.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update settings");
      },
    })
  );

  const autoCompleteEventsMutation = useMutation(
    trpc.autoCompleteExpiredEvents.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message);
        void queryClient.invalidateQueries({ queryKey: trpc.getAllEvents.queryKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.getDashboardStats.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to auto-complete events");
      },
    })
  );

  const onSubmit = (data: EventFormData) => {
    if (!token) return;
    
    // Convert datetime-local strings to ISO strings
    const startDate = new Date(data.startDatetime);
    const endDate = new Date(data.endDatetime);
    
    // Additional validation
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error("Invalid date format");
      return;
    }
    
    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }
    
    createEventMutation.mutate({
      authToken: token,
      name: data.name,
      description: data.description,
      availableBags: data.availableBags,
      startDatetime: startDate.toISOString(),
      endDatetime: endDate.toISOString(),
    });
  };

  const onSubmitCooldownSettings = (data: RegistrationCooldownFormData) => {
    if (!token) return;
    
    updateCooldownSettingsMutation.mutate({
      authToken: token,
      registrationCooldownEnabled: data.registrationCooldownEnabled,
      registrationCooldownDays: data.registrationCooldownDays,
    });
  };

  const handleGenerateQR = (eventId: number) => {
    if (!token) return;
    setSelectedEventForQR(eventId);
    generateQRMutation.mutate({
      authToken: token,
      eventId,
      expirationHours: 72,
    });
  };

  const handleUpdateEventStatus = (eventId: number, status: "ACTIVE" | "INACTIVE" | "COMPLETED") => {
    if (!token) return;
    updateEventStatusMutation.mutate({
      authToken: token,
      eventId,
      status,
    });
  };

  const handleToggleCheckIn = (registrationId: number, currentStatus: boolean) => {
    if (!token) return;
    updateCheckInMutation.mutate({
      authToken: token,
      registrationId,
      checkedIn: !currentStatus,
    });
  };

  const handleCreateCitizen = () => {
    setCitizenModalMode("create");
    setSelectedCitizen(undefined);
    setShowCitizenModal(true);
  };

  const handleEditCitizen = (citizen: {
    id: number;
    username: string;
    fullName: string;
    email: string | null;
    phoneNumber: string | null;
  }) => {
    setCitizenModalMode("edit");
    setSelectedCitizen(citizen);
    setShowCitizenModal(true);
  };

  const handleToggleCitizenStatus = (citizenId: number, currentStatus: boolean) => {
    if (!token) return;
    toggleCitizenStatusMutation.mutate({
      authToken: token,
      citizenId,
      isActive: !currentStatus,
    });
  };

  const handleCreateStaff = () => {
    setStaffModalMode("create");
    setSelectedStaff(undefined);
    setShowStaffModal(true);
  };

  const handleEditStaff = (staff: {
    id: number;
    username: string;
    fullName: string;
    email: string | null;
    phoneNumber: string | null;
  }) => {
    setStaffModalMode("edit");
    setSelectedStaff(staff);
    setShowStaffModal(true);
  };

  const handleToggleStaffStatus = (staffId: number, currentStatus: boolean) => {
    if (!token) return;
    toggleStaffStatusMutation.mutate({
      authToken: token,
      staffId,
      isActive: !currentStatus,
    });
  };

  const handleAutoCompleteEvents = () => {
    if (!token) return;
    autoCompleteEventsMutation.mutate({
      authToken: token,
    });
  };

  const handleExportCSV = async () => {
    if (!token) return;
    
    setIsExportingCSV(true);
    try {
      const result = await queryClient.fetchQuery(
        trpc.exportCitizenData.queryOptions({
          authToken: token,
        })
      );
      
      // Create a blob from the CSV data
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", result.filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${result.rowCount} records to CSV`);
    } catch (error) {
      toast.error("Failed to export citizen data");
      console.error("Export error:", error);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportExcel = async () => {
    if (!token) return;
    
    setIsExportingExcel(true);
    try {
      const result = await queryClient.fetchQuery(
        trpc.exportRegistrationDataExcel.queryOptions({
          authToken: token,
        })
      );
      
      // Convert base64 to blob
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.mimeType });
      
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", result.filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${result.rowCount} records to Excel`);
    } catch (error) {
      toast.error("Failed to export registration data");
      console.error("Export error:", error);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportCitizenProfilesCSV = async () => {
    if (!token) return;
    
    setIsExportingCSV(true);
    try {
      const result = await queryClient.fetchQuery(
        trpc.exportCitizenProfilesToCSV.queryOptions({
          authToken: token,
        })
      );
      
      // Create a blob from the CSV data
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", result.filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${result.rowCount} records to CSV`);
    } catch (error) {
      toast.error("Failed to export citizen profiles");
      console.error("Export error:", error);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleQRScan = (orderNumber: string) => {
    setRegistrationSearchQuery(orderNumber);
  };

  const handleLogout = () => {
    clearAuth();
    toast.success("Logged out successfully");
    void navigate({ to: "/" });
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  const stats = statsQuery.data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BRAND_CONFIG.Icon className={`h-8 w-8 ${BRAND_CONFIG.iconColorClass}`} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">{BRAND_CONFIG.organizationName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/settings"
                className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <Link
                to="/profile"
                className="text-right"
              >
                <p className="text-sm font-medium text-gray-900 hover:text-blue-600">{user.fullName}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === "events"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Events</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("registrations")}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === "registrations"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4" />
                <span>Registrations</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("citizens")}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === "citizens"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Citizen Profiles</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === "settings"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "overview" && (
          <>
            {/* Statistics Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {statsQuery.isLoading ? "..." : stats?.totalEvents ?? 0}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {statsQuery.isLoading ? "..." : stats?.totalRegistrations ?? 0}
                    </p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Check-in Rate</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {statsQuery.isLoading ? "..." : `${stats?.checkInRate ?? 0}%`}
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-100 p-3">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Capacity</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {statsQuery.isLoading ? "..." : `${stats?.avgCapacity ?? 0}%`}
                    </p>
                  </div>
                  <div className="rounded-full bg-rose-100 p-3">
                    <Package className="h-6 w-6 text-rose-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Events</p>
                    <p className="mt-2 text-2xl font-bold text-green-600">
                      {statsQuery.isLoading ? "..." : stats?.activeEvents ?? 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Events</p>
                    <p className="mt-2 text-2xl font-bold text-blue-600">
                      {statsQuery.isLoading ? "..." : stats?.completedEvents ?? 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {statsQuery.isLoading ? "..." : stats?.totalUsers ?? 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-gray-600" />
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last 30 Days</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {statsQuery.isLoading ? "..." : stats?.recentRegistrations ?? 0}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Quick Statistics</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-700">Total Check-ins</p>
                  <p className="mt-1 text-2xl font-bold text-green-900">
                    {statsQuery.isLoading ? "..." : stats?.checkedInCount ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-green-600">
                    Out of {stats?.totalRegistrations ?? 0} registrations
                  </p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-4">
                  <p className="text-sm font-medium text-yellow-700">Inactive Events</p>
                  <p className="mt-1 text-2xl font-bold text-yellow-900">
                    {statsQuery.isLoading ? "..." : stats?.inactiveEvents ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-yellow-600">Currently paused</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-700">Pending Check-ins</p>
                  <p className="mt-1 text-2xl font-bold text-blue-900">
                    {statsQuery.isLoading
                      ? "..."
                      : (stats?.totalRegistrations ?? 0) - (stats?.checkedInCount ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-blue-600">Not yet checked in</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "events" && (
          <>
            {/* Create Event Section */}
            <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Event Management</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAutoCompleteEvents}
                    disabled={autoCompleteEventsMutation.isPending}
                    className="flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:bg-gray-400"
                    title="Mark expired events as completed"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{autoCompleteEventsMutation.isPending ? "Processing..." : "Auto-Complete Events"}</span>
                  </button>
                  <button
                    onClick={() => setShowEventForm(!showEventForm)}
                    className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New Event</span>
                  </button>
                </div>
              </div>

              {showEventForm && (
                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 border-t pt-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Event Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("name")}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Weekly Food Distribution"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Available Bags <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        {...register("availableBags", { valueAsNumber: true })}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="100"
                      />
                      {errors.availableBags && (
                        <p className="mt-1 text-sm text-red-600">{errors.availableBags.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Start Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        {...register("startDatetime")}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.startDatetime && (
                        <p className="mt-1 text-sm text-red-600">{errors.startDatetime.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        End Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        {...register("endDatetime")}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.endDatetime && (
                        <p className="mt-1 text-sm text-red-600">{errors.endDatetime.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional event description"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={createEventMutation.isPending}
                      className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {createEventMutation.isPending ? "Creating..." : "Create Event"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEventForm(false)}
                      className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Event Filter */}
            <div className="mb-4 flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
              <button
                onClick={() => setEventStatusFilter(undefined)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  eventStatusFilter === undefined
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setEventStatusFilter("ACTIVE")}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  eventStatusFilter === "ACTIVE"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setEventStatusFilter("INACTIVE")}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  eventStatusFilter === "INACTIVE"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Inactive
              </button>
              <button
                onClick={() => setEventStatusFilter("COMPLETED")}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  eventStatusFilter === "COMPLETED"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Completed
              </button>
            </div>

            {/* All Events List */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">All Events</h2>
              {allEventsQuery.isLoading ? (
                <p className="text-center text-gray-500">Loading events...</p>
              ) : allEventsQuery.data && allEventsQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {allEventsQuery.data.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900">{event.name}</h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              event.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : event.status === "INACTIVE"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {event.status}
                          </span>
                        </div>
                        {event.description && (
                          <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(event.startDatetime).toLocaleString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {event.registeredCount} / {event.availableBags}
                            </span>
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full bg-blue-600"
                              style={{
                                width: `${Math.min((event.registeredCount / event.availableBags) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          {event.status !== "ACTIVE" && (
                            <button
                              onClick={() => handleUpdateEventStatus(event.id, "ACTIVE")}
                              disabled={updateEventStatusMutation.isPending}
                              className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
                            >
                              Activate
                            </button>
                          )}
                          {event.status !== "INACTIVE" && (
                            <button
                              onClick={() => handleUpdateEventStatus(event.id, "INACTIVE")}
                              disabled={updateEventStatusMutation.isPending}
                              className="rounded-lg bg-yellow-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-yellow-700 disabled:bg-gray-400"
                            >
                              Pause
                            </button>
                          )}
                          {event.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleUpdateEventStatus(event.id, "COMPLETED")}
                              disabled={updateEventStatusMutation.isPending}
                              className="rounded-lg bg-gray-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-gray-700 disabled:bg-gray-400"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedEventDetails(event.id)}
                            className="flex items-center space-x-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleGenerateQR(event.id)}
                            disabled={generateQRMutation.isPending}
                            className="flex items-center space-x-1 rounded-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-purple-700 disabled:bg-gray-400"
                          >
                            <QrCode className="h-3 w-3" />
                            <span>QR</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  No events found. {eventStatusFilter && "Try changing the filter or"} Create one to get started!
                </p>
              )}
            </div>

            {/* QR Code Display */}
            {qrCodeUrl && (
              <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Generated QR Code</h2>
                  <button
                    onClick={() => setQrCodeUrl("")}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="rounded-lg bg-gray-50 p-6 text-center">
                  <div className="mb-4 inline-block rounded-lg bg-white p-4 shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                      alt="QR Code"
                      className="h-48 w-48"
                    />
                  </div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Registration URL:</p>
                  <p className="mb-4 break-all text-sm text-gray-600">{qrCodeUrl}</p>
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(qrCodeUrl);
                      toast.success("URL copied to clipboard!");
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "registrations" && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Search Registrations</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Scan QR Code</span>
                </button>
                <div className="relative w-96">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={registrationSearchQuery}
                    onChange={(e) => setRegistrationSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search by phone, order #, or name..."
                  />
                </div>
              </div>
            </div>

            {registrationSearchQuery.length < 3 ? (
              <div className="py-12 text-center">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">
                  Enter at least 3 characters to search for registrations
                </p>
              </div>
            ) : searchRegistrationsQuery.isLoading ? (
              <p className="py-8 text-center text-gray-500">Searching...</p>
            ) : searchRegistrationsQuery.data?.registrations &&
              searchRegistrationsQuery.data.registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-600">
                      <th className="pb-3">Order #</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Event</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-900">
                    {searchRegistrationsQuery.data.registrations.map((reg) => (
                      <tr key={reg.id} className="border-b border-gray-100">
                        <td className="py-3 font-mono text-xs">{reg.orderNumber}</td>
                        <td className="py-3">{reg.fullName}</td>
                        <td className="py-3">{reg.phoneNumber}</td>
                        <td className="py-3">{reg.eventName}</td>
                        <td className="py-3">{new Date(reg.registrationDate).toLocaleString()}</td>
                        <td className="py-3">
                          {reg.checkedIn ? (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              <span>Checked In</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                              <Clock className="h-3 w-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleCheckIn(reg.id, reg.checkedIn)}
                            disabled={updateCheckInMutation.isPending}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold text-white transition-colors disabled:bg-gray-400 ${
                              reg.checkedIn
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {reg.checkedIn ? "Undo" : "Check In"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">No registrations found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <>
            {/* User Filter and Create Button */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by role:</span>
                <button
                  onClick={() => setUserRoleFilter(undefined)}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                    userRoleFilter === undefined
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setUserRoleFilter("ADMIN")}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                    userRoleFilter === "ADMIN"
                      ? "bg-red-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => setUserRoleFilter("STAFF")}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                    userRoleFilter === "STAFF"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Staff
                </button>
                <button
                  onClick={() => setUserRoleFilter("CITIZEN")}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                    userRoleFilter === "CITIZEN"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Citizen
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleExportCSV}
                  disabled={isExportingCSV}
                  className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExportingCSV ? "Exporting..." : "Export CSV"}</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={isExportingExcel}
                  className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-gray-400"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExportingExcel ? "Exporting..." : "Export Excel"}</span>
                </button>
                <button
                  onClick={handleCreateStaff}
                  className="flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Staff</span>
                </button>
                <button
                  onClick={handleCreateCitizen}
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Citizen</span>
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">User Management</h2>
              {allUsersQuery.isLoading ? (
                <p className="text-center text-gray-500">Loading users...</p>
              ) : allUsersQuery.data && allUsersQuery.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-600">
                        <th className="pb-3">Username</th>
                        <th className="pb-3">Full Name</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Phone</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Registrations</th>
                        <th className="pb-3">Created</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-900">
                      {allUsersQuery.data.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100">
                          <td className="py-3 font-medium">{user.username}</td>
                          <td className="py-3">{user.fullName}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                user.role === "ADMIN"
                                  ? "bg-red-100 text-red-700"
                                  : user.role === "STAFF"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3">{user.email || "—"}</td>
                          <td className="py-3">{user.phoneNumber || "—"}</td>
                          <td className="py-3">
                            {user.isActive ? (
                              <span className="inline-flex items-center space-x-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                <CheckCircle className="h-3 w-3" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                                <XCircle className="h-3 w-3" />
                                <span>Inactive</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3">{user.registrationCount}</td>
                          <td className="py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            {user.role === "CITIZEN" && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditCitizen({
                                    id: user.id,
                                    username: user.username,
                                    fullName: user.fullName,
                                    email: user.email,
                                    phoneNumber: user.phoneNumber,
                                  })}
                                  className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                  title="Edit citizen"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleToggleCitizenStatus(user.id, user.isActive)}
                                  disabled={toggleCitizenStatusMutation.isPending}
                                  className={`rounded-lg px-2 py-1 text-xs font-semibold text-white transition-colors disabled:bg-gray-400 ${
                                    user.isActive
                                      ? "bg-red-600 hover:bg-red-700"
                                      : "bg-green-600 hover:bg-green-700"
                                  }`}
                                  title={user.isActive ? "Deactivate" : "Activate"}
                                >
                                  {user.isActive ? (
                                    <UserX className="h-3 w-3" />
                                  ) : (
                                    <UserCheck className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            )}
                            {user.role === "STAFF" && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditStaff({
                                    id: user.id,
                                    username: user.username,
                                    fullName: user.fullName,
                                    email: user.email,
                                    phoneNumber: user.phoneNumber,
                                  })}
                                  className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                  title="Edit staff"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleToggleStaffStatus(user.id, user.isActive)}
                                  disabled={toggleStaffStatusMutation.isPending}
                                  className={`rounded-lg px-2 py-1 text-xs font-semibold text-white transition-colors disabled:bg-gray-400 ${
                                    user.isActive
                                      ? "bg-red-600 hover:bg-red-700"
                                      : "bg-green-600 hover:bg-green-700"
                                  }`}
                                  title={user.isActive ? "Deactivate" : "Activate"}
                                >
                                  {user.isActive ? (
                                    <UserX className="h-3 w-3" />
                                  ) : (
                                    <UserCheck className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  No users found. {userRoleFilter && "Try changing the filter."}
                </p>
              )}
            </div>
          </>
        )}

        {activeTab === "citizens" && (
          <>
            {/* Export Buttons */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Citizen Profiles</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleExportCitizenProfilesCSV}
                  disabled={isExportingCSV}
                  className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExportingCSV ? "Exporting..." : "Export CSV"}</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={isExportingExcel}
                  className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-gray-400"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExportingExcel ? "Exporting..." : "Export Excel"}</span>
                </button>
              </div>
            </div>

            {/* Citizen Profiles List */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm text-gray-600">
                All registered citizens, including those who registered without creating an account.
              </p>
              {citizenProfilesQuery.isLoading ? (
                <p className="text-center text-gray-500">Loading citizen profiles...</p>
              ) : citizenProfilesQuery.data && citizenProfilesQuery.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-600">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Phone</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3">Homeless</th>
                        <th className="pb-3">Has Account</th>
                        <th className="pb-3">Registrations</th>
                        <th className="pb-3">First Seen</th>
                        <th className="pb-3">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-900">
                      {citizenProfilesQuery.data.map((profile) => (
                        <tr key={profile.id} className="border-b border-gray-100">
                          <td className="py-3 font-medium">{profile.fullName}</td>
                          <td className="py-3">{profile.phoneNumber}</td>
                          <td className="py-3">{profile.email || "—"}</td>
                          <td className="py-3">
                            {profile.cityTown && profile.stateProvince
                              ? `${profile.cityTown}, ${profile.stateProvince}`
                              : profile.zipPostalCode || "—"}
                          </td>
                          <td className="py-3">
                            {profile.isHomeless ? (
                              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                                Yes
                              </span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                          <td className="py-3">
                            {profile.hasUserAccount ? (
                              <span className="inline-flex items-center space-x-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                <CheckCircle className="h-3 w-3" />
                                <span>{profile.username}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                              {profile.registrationCount}
                            </span>
                          </td>
                          <td className="py-3">{new Date(profile.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">{new Date(profile.updatedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-sm text-gray-600">
                    Total citizen profiles: {citizenProfilesQuery.data.length}
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">No citizen profiles found.</p>
              )}
            </div>
          </>
        )}

        {activeTab === "settings" && (
          <div className="space-y-8">
            {/* Registration Cooldown Settings */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Registration Cooldown Settings</h2>
              <p className="mb-6 text-sm text-gray-600">
                Configure how often citizens can register for food distribution events.
              </p>

              {cooldownSettingsQuery.isLoading ? (
                <p className="text-center text-gray-500">Loading settings...</p>
              ) : (
                <form onSubmit={handleSubmitCooldown(onSubmitCooldownSettings)} className="space-y-6">
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="flex-1">
                      <label htmlFor="cooldownEnabled" className="block text-sm font-medium text-gray-900">
                        Enable Registration Cooldown
                      </label>
                      <p className="mt-1 text-sm text-gray-600">
                        When enabled, citizens must wait a specified number of days between registrations.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        id="cooldownEnabled"
                        type="checkbox"
                        {...registerCooldown("registrationCooldownEnabled")}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Days Input */}
                  <div className={cooldownEnabled ? "" : "opacity-50"}>
                    <label htmlFor="cooldownDays" className="mb-2 block text-sm font-medium text-gray-700">
                      Number of Days <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="cooldownDays"
                      type="number"
                      disabled={!cooldownEnabled}
                      {...registerCooldown("registrationCooldownDays", { valueAsNumber: true })}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="14"
                      min="1"
                      max="365"
                    />
                    {cooldownErrors.registrationCooldownDays && (
                      <p className="mt-1 text-sm text-red-600">
                        {cooldownErrors.registrationCooldownDays.message}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      Citizens will need to wait this many days after their last registration before they can register again.
                    </p>
                  </div>

                  {/* Current Settings Display */}
                  {cooldownSettingsQuery.data && (
                    <div className="rounded-lg bg-blue-50 p-4">
                      <h3 className="mb-2 text-sm font-semibold text-blue-900">Current Settings</h3>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          {cooldownSettingsQuery.data.registrationCooldownEnabled ? (
                            <span className="text-green-700">Enabled</span>
                          ) : (
                            <span className="text-red-700">Disabled</span>
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Cooldown Period:</span>{" "}
                          {cooldownSettingsQuery.data.registrationCooldownDays} days
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={updateCooldownSettingsMutation.isPending}
                      className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {updateCooldownSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Event Details Modal */}
      {selectedEventDetails && eventDetailsQuery.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Event Details</h2>
              <button
                onClick={() => setSelectedEventDetails(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {eventDetailsQuery.data.name}
              </h3>
              {eventDetailsQuery.data.description && (
                <p className="mt-1 text-sm text-gray-600">{eventDetailsQuery.data.description}</p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Status:</span>{" "}
                  <span
                    className={`ml-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      eventDetailsQuery.data.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : eventDetailsQuery.data.status === "INACTIVE"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {eventDetailsQuery.data.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Capacity:</span>{" "}
                  {eventDetailsQuery.data.registeredCount} / {eventDetailsQuery.data.availableBags}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Start:</span>{" "}
                  {new Date(eventDetailsQuery.data.startDatetime).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium text-gray-700">End:</span>{" "}
                  {new Date(eventDetailsQuery.data.endDatetime).toLocaleString()}
                </div>
              </div>
            </div>

            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Registrations ({eventDetailsQuery.data.registrations.length})
            </h3>

            {eventDetailsQuery.data.registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-600">
                      <th className="pb-3">Order #</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Registered</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-900">
                    {eventDetailsQuery.data.registrations.map((reg) => (
                      <tr key={reg.id} className="border-b border-gray-100">
                        <td className="py-3 font-mono text-xs">{reg.orderNumber}</td>
                        <td className="py-3">{reg.fullName}</td>
                        <td className="py-3">{reg.phoneNumber}</td>
                        <td className="py-3">{new Date(reg.registrationDate).toLocaleString()}</td>
                        <td className="py-3">
                          {reg.checkedIn ? (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              <span>Checked In</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                              <Clock className="h-3 w-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleCheckIn(reg.id, reg.checkedIn)}
                            disabled={updateCheckInMutation.isPending}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold text-white transition-colors disabled:bg-gray-400 ${
                              reg.checkedIn
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {reg.checkedIn ? "Undo" : "Check In"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500">No registrations yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Citizen Management Modal */}
      {token && (
        <CitizenManagementModal
          isOpen={showCitizenModal}
          onClose={() => setShowCitizenModal(false)}
          mode={citizenModalMode}
          authToken={token}
          citizen={selectedCitizen}
        />
      )}

      {/* Staff Management Modal */}
      {token && (
        <StaffManagementModal
          isOpen={showStaffModal}
          onClose={() => setShowStaffModal(false)}
          mode={staffModalMode}
          authToken={token}
          staff={selectedStaff}
        />
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </div>
  );
}
