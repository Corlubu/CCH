import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import {
  Calendar,
  Users,
  LogOut,
  UserPlus,
  Search,
  CheckCircle,
  Phone,
  Mail,
  User,
  Package,
  Settings,
  Home,
  MapPin,
  DollarSign,
  Download,
  Activity,
  TrendingUp,
  Filter,
  QrCode,
} from "lucide-react";
import { BRAND_CONFIG } from "~/config/branding";
import { QRScannerModal } from "~/components/QRScannerModal";
import { QuickCheckInModal } from "~/components/QuickCheckInModal";

export const Route = createFileRoute("/staff/")({
  component: StaffDashboard,
});

const registrationSchema = z.object({
  eventId: z.number().min(1, "Please select an event"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  isHomeless: z.boolean().default(false),
  totalIndividuals: z
    .number()
    .min(1, "Total individuals must be at least 1")
    .default(1),
  address: z.string().optional(),
  apartmentSuite: z.string().optional(),
  cityTown: z.string().optional(),
  stateProvince: z.string().optional(),
  zipPostalCode: z.string().optional(),
  country: z.string().optional(),
  county: z.string().optional(),
  alternatePickupPerson: z.string().optional(),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required").or(z.literal("")),
  incomeEligibility: z.boolean().default(false),
  snap: z.boolean().default(false),
  tanf: z.boolean().default(false),
  ssi: z.boolean().default(false),
  medicaid: z.boolean().default(false),
  incomeSalary: z.number().min(0).optional(),
  digitalSignature: z.string().min(1, "Digital signature is required"),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

function StaffDashboard() {
  const navigate = useNavigate();
  const { user, token, clearAuth } = useAuthStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState<
    "ADMIN" | "STAFF" | "CITIZEN" | undefined
  >(undefined);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [quickCheckInRegistration, setQuickCheckInRegistration] = useState<{
    id: number;
    orderNumber: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    address: string | null;
    cityTown: string | null;
    stateProvince: string | null;
    zipPostalCode: string | null;
    isHomeless: boolean;
    totalIndividuals: number;
    checkedIn: boolean;
    checkedInAt: string | null;
    eventName: string;
    eventStartDatetime: string;
  } | null>(null);

  // Check authentication
  useEffect(() => {
    if (!user || !token) {
      void navigate({ to: "/login" });
    } else if (user.role !== "STAFF" && user.role !== "ADMIN") {
      toast.error("Access denied. Staff privileges required.");
      void navigate({ to: "/" });
    }
  }, [user, token, navigate]);

  // Fetch active events
  const eventsQuery = useQuery(trpc.getActiveEvents.queryOptions());

  // Fetch search results for registrations
  const searchRegistrationsQuery = useQuery(
    token && searchQuery.length >= 3
      ? trpc.searchRegistrations.queryOptions({
          authToken: token,
          searchQuery: searchQuery,
        })
      : { enabled: false, queryKey: ["disabled"] },
  );

  // Fetch dashboard stats
  const statsQuery = useQuery(
    token
      ? trpc.getDashboardStats.queryOptions({ authToken: token })
      : { enabled: false, queryKey: ["disabled"] },
  );

  // Fetch all users with optional filter
  const allUsersQuery = useQuery(
    token
      ? trpc.getAllUsers.queryOptions({
          authToken: token,
          role: userRoleFilter,
        })
      : { enabled: false, queryKey: ["disabled"] },
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      eventId: 0,
      firstName: "",
      middleName: "",
      lastName: "",
      isHomeless: false,
      totalIndividuals: 1,
      address: "",
      apartmentSuite: "",
      cityTown: "",
      stateProvince: "",
      zipPostalCode: "",
      country: "",
      county: "",
      alternatePickupPerson: "",
      phoneNumber: "",
      email: "",
      incomeEligibility: false,
      snap: false,
      tanf: false,
      ssi: false,
      medicaid: false,
      incomeSalary: undefined,
      digitalSignature: "",
    },
  });

  const isHomeless = watch("isHomeless");
  const alternatePickupPerson = watch("alternatePickupPerson");

  const registerMutation = useMutation(
    trpc.registerCitizen.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Registration successful! Order #: ${data.orderNumber}`);
        reset();
        setShowRegistrationForm(false);
        void queryClient.invalidateQueries({
          queryKey: trpc.getActiveEvents.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Registration failed");
      },
    }),
  );

  const updateCheckInMutation = useMutation(
    trpc.updateRegistrationCheckIn.mutationOptions({
      onSuccess: (data) => {
        const wasCheckedIn = data.registration.checkedIn;
        toast.success(
          wasCheckedIn ? `✓ Checked in successfully!` : "Check-in undone",
        );
        void queryClient.invalidateQueries({
          queryKey: trpc.getActiveEvents.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.getDashboardStats.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.searchRegistrations.queryKey(),
        });

        // Close quick check-in modal after successful check-in
        if (quickCheckInRegistration && wasCheckedIn) {
          setTimeout(() => {
            setQuickCheckInRegistration(null);
            setSearchQuery("");
          }, 1500); // Small delay to let user see the success state
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update check-in status");
      },
    }),
  );

  // Auto-show quick check-in modal when QR scan results in exactly one match
  useEffect(() => {
    if (
      searchRegistrationsQuery.data?.registrations &&
      searchRegistrationsQuery.data.registrations.length === 1 &&
      searchQuery.length >= 3
    ) {
      const registration = searchRegistrationsQuery.data.registrations[0];
      // Only auto-show if the search query looks like an order number (QR code scan)
      if (searchQuery.toUpperCase().startsWith("CCH-")) {
        setQuickCheckInRegistration({
          id: registration.id,
          orderNumber: registration.orderNumber,
          fullName: registration.fullName,
          phoneNumber: registration.phoneNumber,
          email: registration.email,
          address: registration.address,
          cityTown: registration.cityTown,
          stateProvince: registration.stateProvince,
          zipPostalCode: registration.zipPostalCode,
          isHomeless: registration.isHomeless,
          totalIndividuals: registration.totalIndividuals,
          checkedIn: registration.checkedIn,
          checkedInAt: registration.checkedInAt,
          eventName: registration.eventName,
          eventStartDatetime: registration.eventStartDatetime,
        });
      }
    }
  }, [searchRegistrationsQuery.data, searchQuery]);

  const onSubmit = (data: RegistrationFormData) => {
    registerMutation.mutate(data);
  };

  const handleToggleCheckIn = (
    registrationId: number,
    currentStatus: boolean,
  ) => {
    if (!token) return;
    updateCheckInMutation.mutate({
      authToken: token,
      registrationId,
      checkedIn: !currentStatus,
    });
  };

  const handleLogout = () => {
    clearAuth();
    toast.success("Logged out successfully");
    void navigate({ to: "/" });
  };

  const handleQRScan = (orderNumber: string) => {
    setSearchQuery(orderNumber);
    toast.success(`QR Code scanned: ${orderNumber}`);
  };

  const handleExportCSV = async () => {
    if (!token) return;

    setIsExportingCSV(true);
    try {
      const result = await queryClient.fetchQuery(
        trpc.exportCitizenProfilesToCSV.queryOptions({
          authToken: token,
        }),
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

  const handleExportExcel = async () => {
    if (!token) return;

    setIsExportingExcel(true);
    try {
      const result = await queryClient.fetchQuery(
        trpc.exportRegistrationDataExcel.queryOptions({
          authToken: token,
        }),
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

  if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BRAND_CONFIG.Icon
                className={`h-8 w-8 ${BRAND_CONFIG.iconColorClass}`}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Staff Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  {BRAND_CONFIG.organizationName}
                </p>
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
              <Link to="/profile" className="text-right">
                <p className="text-sm font-medium text-gray-900 hover:text-blue-600">
                  {user.fullName}
                </p>
                <p className="text-xs text-gray-500">Staff Member</p>
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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Events
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statsQuery.isLoading
                    ? "..."
                    : (statsQuery.data?.activeEvents ?? 0)}
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
                <p className="text-sm font-medium text-gray-600">
                  Total Registrations
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statsQuery.isLoading
                    ? "..."
                    : (statsQuery.data?.totalRegistrations ?? 0)}
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
                <p className="text-sm font-medium text-gray-600">
                  Check-in Rate
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statsQuery.isLoading
                    ? "..."
                    : `${statsQuery.data?.checkInRate ?? 0}%`}
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
                <p className="text-sm font-medium text-gray-600">
                  Last 30 Days
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statsQuery.isLoading
                    ? "..."
                    : (statsQuery.data?.recentRegistrations ?? 0)}
                </p>
              </div>
              <div className="rounded-full bg-rose-100 p-3">
                <TrendingUp className="h-6 w-6 text-rose-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Export Data</h2>
              <p className="mt-1 text-sm text-gray-600">
                Download all citizen registration data in CSV or Excel format
              </p>
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
                <span>
                  {isExportingExcel ? "Exporting..." : "Export Excel"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Report Section */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Users Report</h2>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Filter by role:
              </span>
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
          </div>

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
                            <User className="h-3 w-3" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3">{user.registrationCount}</td>
                      <td className="py-3">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-gray-600">
                Total users: {allUsersQuery.data.length}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">
              No users found. {userRoleFilter && "Try changing the filter."}
            </p>
          )}
        </div>

        {/* Manual Registration Section */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Manual Registration
            </h2>
            <button
              onClick={() => setShowRegistrationForm(!showRegistrationForm)}
              className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register Walk-in</span>
            </button>
          </div>

          {showRegistrationForm && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-6 space-y-6 border-t pt-6"
            >
              {/* Event Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select Event <span className="text-red-500">*</span>
                </label>
                {eventsQuery.data && eventsQuery.data.length > 0 ? (
                  <select
                    {...register("eventId", { valueAsNumber: true })}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Choose an event...</option>
                    {eventsQuery.data.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} - {event.remainingBags} bags available
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-center text-sm text-yellow-800">
                    No active events available
                  </div>
                )}
                {errors.eventId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.eventId.message}
                  </p>
                )}
              </div>

              {/* TEFAP Information and Income Guidelines */}
              <div className="space-y-4 rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-gray-700">
                  If your household income is at or below the income listed for
                  the number of people in your household, you are eligible to
                  receive food.
                </p>

                <div>
                  <h4 className="mb-3 text-center text-sm font-bold text-gray-900">
                    TEFAP Income Eligibility Guidelines - 2025
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 bg-white text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-2 py-1 text-left font-semibold">
                            Household Size
                          </th>
                          <th className="border border-gray-300 px-2 py-1 text-left font-semibold">
                            Annual Income
                          </th>
                          <th className="border border-gray-300 px-2 py-1 text-left font-semibold">
                            Monthly Income
                          </th>
                          <th className="border border-gray-300 px-2 py-1 text-left font-semibold">
                            Twice per Month
                          </th>
                          <th className="border border-gray-300 px-2 py-1 text-left font-semibold">
                            Every two Weeks
                          </th>
                          <th className="border border-gray-300 px-2 py-1 text-left font-semibold">
                            Weekly Income
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">
                            1
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $46,950
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $3,913
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $1,956
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $1,806
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $903
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">
                            2
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $63,450
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $5,288
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $2,644
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $2,440
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $1,220
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">
                            3
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $79,950
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $6,663
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $3,331
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $3,075
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $1,538
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">
                            4
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $96,450
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $8,038
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $4,019
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $3,710
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $1,855
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">
                            5
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $112,950
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $9,413
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $4,706
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $4,344
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $2,172
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">
                            6
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $129,450
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $10,788
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $5,394
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $4,979
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $2,489
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">
                            7
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $145,950
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $12,163
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $6,081
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $5,613
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $2,807
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">
                            8
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $162,450
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $13,538
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $6,769
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $6,248
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $3,124
                          </td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1 font-semibold">
                            For each additional family member add:
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $16,500
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $1,375
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $688
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $635
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            $317
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="border-b pb-2 text-base font-semibold text-gray-900">
                  Applicant Information
                </h3>

                {/* Name - Full name on one line */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("firstName")}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="First name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      {...register("middleName")}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Middle name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("lastName")}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Number of People and County */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Number of People in Household{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register("totalIndividuals", { valueAsNumber: true })}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Number of individuals"
                    />
                    {errors.totalIndividuals && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.totalIndividuals.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      County
                    </label>
                    <input
                      type="text"
                      {...register("county")}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="County"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="space-y-4">
                <h3 className="border-b pb-2 text-base font-semibold text-gray-900">
                  Address Information
                </h3>

                {/* Homeless Checkbox */}
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      {...register("isHomeless")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-700">
                      Homeless (No residence)
                    </label>
                    <p className="text-xs text-gray-500">
                      Check this box if the person does not have a permanent
                      address
                    </p>
                  </div>
                </div>

                {/* Conditional Address Fields - Only show if NOT homeless */}
                {!isHomeless && (
                  <div className="space-y-4">
                    {/* Street Address */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Street Address
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Home className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          {...register("address")}
                          className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="123 Main Street"
                        />
                      </div>
                    </div>

                    {/* Apartment/Suite */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Apartment/Suite{" "}
                        <span className="text-gray-400">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        {...register("apartmentSuite")}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Apt 4B"
                      />
                    </div>

                    {/* City/Town and State/Province */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          City/Town
                        </label>
                        <input
                          type="text"
                          {...register("cityTown")}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Tampa"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          State/Province
                        </label>
                        <input
                          type="text"
                          {...register("stateProvince")}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="FL"
                        />
                      </div>
                    </div>

                    {/* Country */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          {...register("country")}
                          className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="United States"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Zip Code - Always visible */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Zip/Postal Code
                  </label>
                  <input
                    type="text"
                    {...register("zipPostalCode")}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="33602"
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="border-b pb-2 text-base font-semibold text-gray-900">
                  Contact Information
                </h3>

                {/* Phone Number */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register("phoneNumber")}
                      className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    SMS confirmation will be sent to this number
                  </p>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      {...register("email")}
                      className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Eligibility Information Section */}
              <div className="space-y-4">
                <div>
                  <p className="mb-4 text-sm text-gray-700">
                    You are eligible to receive food from TEFAP if your
                    household meets the income guidelines above or participates
                    in any of the following programs. Please place a checkmark
                    in the space next to the category that applies.
                  </p>
                </div>

                <div className="space-y-3 rounded-lg border border-gray-300 bg-gray-50 p-4">
                  {/* Income Eligibility */}
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        {...register("incomeEligibility")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-700">
                        Income eligibility
                      </label>
                    </div>
                  </div>

                  {/* SNAP */}
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        {...register("snap")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-700">
                        Supplemental Nutrition Assistance Program (SNAP) (aka
                        Food Stamps)
                      </label>
                    </div>
                  </div>

                  {/* TANF */}
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        {...register("tanf")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-700">
                        Temporary Assistance to Needy Families (TANF)
                      </label>
                    </div>
                  </div>

                  {/* SSI */}
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        {...register("ssi")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-700">
                        Supplemental Security Income (SSI)
                      </label>
                    </div>
                  </div>

                  {/* Medicaid */}
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        {...register("medicaid")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-700">
                        Medicaid
                      </label>
                    </div>
                  </div>
                </div>

                {/* Income Salary Field */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Annual Income/Salary{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      {...register("incomeSalary", { valueAsNumber: true })}
                      className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter annual income"
                    />
                  </div>
                  {errors.incomeSalary && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.incomeSalary.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter total annual household income
                  </p>
                </div>
              </div>

              {/* Alternate Pickup Person */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Alternate Pick-up Person{" "}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  {...register("alternatePickupPerson")}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Name of person authorized to pick up"
                />
                <p className="mt-1 text-xs text-gray-500">
                  If someone else will be picking up on their behalf
                </p>
              </div>

              {/* Certification Statement */}
              <div className="space-y-4 rounded-lg border-2 border-gray-300 bg-yellow-50 p-4">
                <div>
                  <p className="mb-3 text-sm font-semibold text-gray-900">
                    The Local Distributing Agency staff must check this box,
                    after the applicant has read the below certification
                    statement:
                  </p>
                  <div className="rounded-lg border border-gray-300 bg-white p-4">
                    <p className="mb-4 text-sm text-gray-700">
                      I certify, by self attesting, that my yearly household
                      gross income is at or below the income listed on this form
                      for households with the same number of people OR that I
                      participate in the program(s) that I have checked on this
                      form. I also certify that as of today, I reside in the
                      State of Florida. This certification is being submitted in
                      connection with the receipt of Federal assistance. I
                      understand that making a false certification may result in
                      having to pay the State agency for the value of the food
                      improperly issued to me and may subject me to civil or
                      criminal prosecution under State and Federal law.
                    </p>
                    <p className="mb-4 text-sm text-gray-700">
                      <strong>OPTIONAL:</strong> I authorize{" "}
                      <span className="inline-block w-48 border-b border-gray-400">
                        {alternatePickupPerson || ""}
                      </span>{" "}
                      to pick up USDA foods on my behalf.
                    </p>
                    <p className="text-sm text-gray-700">
                      Any changes in the household's circumstances must be
                      reported to the distributing agency immediately.
                    </p>
                  </div>
                </div>

                {/* Digital Signature */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Digital Signature (Type full name){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("digitalSignature")}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-serif text-lg italic focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type full name here"
                  />
                  {errors.digitalSignature && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.digitalSignature.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    By typing their name, they are digitally signing this
                    certification
                  </p>
                </div>
              </div>

              {/* USDA Non-Discrimination Statement */}
              <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                <p className="mb-3 text-xs text-gray-600">
                  In accordance with federal civil rights law and U.S.
                  Department of Agriculture (USDA) civil rights regulations and
                  policies, this institution is prohibited from discriminating
                  on the basis of race, color, national origin, sex, disability,
                  age, or reprisal or retaliation for prior civil rights
                  activity.
                </p>
                <p className="mb-3 text-xs text-gray-600">
                  Program information may be made available in languages other
                  than English. Persons with disabilities who require
                  alternative means of communication to obtain program
                  information (e.g., Braille, large print, audiotape, American
                  Sign Language), should contact the responsible state or local
                  agency that administers the program or USDA's TARGET Center at
                  (202) 720-2600 (voice and TTY) or contact USDA through the
                  Federal Relay Service at (800) 877-8339.
                </p>
                <p className="mb-3 text-xs text-gray-600">
                  To file a program discrimination complaint, a Complainant
                  should complete a Form AD-3027, USDA Program Discrimination
                  Complaint Form, which can be obtained online at:
                  https://www.usda.gov/sites/default/files/documents/USDA-OASCR%20P-Complaint-Form-0508-0002-508-11-28-17Fax2Mail.pdf,
                  from any USDA office, by calling (866) 632-9992, or by writing
                  a letter addressed to USDA. The letter must contain the
                  complainant's name, address, telephone number, and a written
                  description of the alleged discriminatory action in sufficient
                  detail to inform the Assistant Secretary for Civil Rights
                  (ASCR) about the nature and date of an alleged civil rights
                  violation. The completed AD-3027 form or letter must be
                  submitted to USDA by:
                </p>
                <ol className="mb-3 ml-6 list-decimal text-xs text-gray-600">
                  <li>
                    mail: U.S. Department of Agriculture Office of the Assistant
                    Secretary for Civil Rights 1400 Independence Avenue, SW
                    Washington, D.C. 20250-9410; or
                  </li>
                  <li>fax: (833) 256-1665 or (202) 690-7442; or</li>
                  <li>email: program.intake@usda.gov</li>
                </ol>
                <p className="text-xs font-semibold text-gray-700">
                  This institution is an equal opportunity provider.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {registerMutation.isPending
                    ? "Registering..."
                    : "Complete Registration"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegistrationForm(false);
                    reset();
                  }}
                  className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Active Events */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Active Events
          </h2>
          {eventsQuery.isLoading ? (
            <p className="text-center text-gray-500">Loading events...</p>
          ) : eventsQuery.data && eventsQuery.data.length > 0 ? (
            <div className="space-y-4">
              {eventsQuery.data.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {event.name}
                      </h3>
                      {event.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(event.startDatetime).toLocaleDateString()}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.registeredCount} / {event.availableBags}{" "}
                            registered
                          </span>
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Capacity</span>
                          <span>{event.remainingBags} remaining</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-blue-600 transition-all"
                            style={{
                              width: `${(event.registeredCount / event.availableBags) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              No active events at this time
            </p>
          )}
        </div>

        {/* Search and Recent Registrations */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Search Registrations
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowQRScanner(true)}
                className="flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
              >
                <QrCode className="h-4 w-4" />
                <span>Scan QR Code</span>
              </button>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by phone, order #, or name"
                />
              </div>
            </div>
          </div>

          {searchQuery.length < 3 ? (
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
                      <td className="py-3 font-mono text-xs">
                        {reg.orderNumber}
                      </td>
                      <td className="py-3">{reg.fullName}</td>
                      <td className="py-3">{reg.phoneNumber}</td>
                      <td className="py-3">{reg.eventName}</td>
                      <td className="py-3">
                        {new Date(reg.registrationDate).toLocaleString()}
                      </td>
                      <td className="py-3">
                        {reg.checkedIn ? (
                          <span className="inline-flex items-center space-x-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            <CheckCircle className="h-3 w-3" />
                            <span>Checked In</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                            <CheckCircle className="h-3 w-3" />
                            <span>Confirmed</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() =>
                            handleToggleCheckIn(reg.id, reg.checkedIn)
                          }
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
      </main>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />

      {/* Quick Check-In Modal */}
      {quickCheckInRegistration && (
        <QuickCheckInModal
          isOpen={!!quickCheckInRegistration}
          onClose={() => setQuickCheckInRegistration(null)}
          registration={quickCheckInRegistration}
          onCheckIn={handleToggleCheckIn}
          isLoading={updateCheckInMutation.isPending}
        />
      )}
    </div>
  );
}
