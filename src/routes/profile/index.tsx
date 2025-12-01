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
  User,
  Mail,
  Phone,
  Lock,
  Save,
  ArrowLeft,
  Calendar,
  Shield,
  Edit2,
} from "lucide-react";
import { BRAND_CONFIG } from "~/config/branding";

export const Route = createFileRoute("/profile/")({
  component: ProfilePage,
});

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters").or(z.literal("")),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!user || !token) {
      void navigate({ to: "/login" });
    }
  }, [user, token, navigate]);

  // Fetch user profile
  const profileQuery = useQuery(
    token
      ? trpc.getUserProfile.queryOptions({ authToken: token })
      : { enabled: false, queryKey: ["disabled"] }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profileQuery.data) {
      reset({
        fullName: profileQuery.data.fullName,
        email: profileQuery.data.email || "",
        phoneNumber: profileQuery.data.phoneNumber || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [profileQuery.data, reset]);

  const updateProfileMutation = useMutation(
    trpc.updateUserProfile.mutationOptions({
      onSuccess: (data) => {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        setShowPasswordFields(false);
        
        // Update auth store with new user data
        if (token) {
          setAuth(token, data.user);
        }
        
        void queryClient.invalidateQueries({ queryKey: trpc.getUserProfile.queryKey() });
        reset({
          fullName: data.user.fullName,
          email: data.user.email || "",
          phoneNumber: data.user.phoneNumber || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update profile");
      },
    })
  );

  const onSubmit = (data: ProfileFormData) => {
    if (!token) return;

    const updateData: {
      authToken: string;
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      currentPassword?: string;
      newPassword?: string;
    } = {
      authToken: token,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
    };

    if (data.newPassword && data.currentPassword) {
      updateData.currentPassword = data.currentPassword;
      updateData.newPassword = data.newPassword;
    }

    updateProfileMutation.mutate(updateData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowPasswordFields(false);
    if (profileQuery.data) {
      reset({
        fullName: profileQuery.data.fullName,
        email: profileQuery.data.email || "",
        phoneNumber: profileQuery.data.phoneNumber || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700";
      case "STAFF":
        return "bg-purple-100 text-purple-700";
      case "CITIZEN":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
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
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-600">Manage your personal information</p>
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
        {profileQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        ) : profileQuery.data ? (
          <div className="space-y-6">
            {/* Profile Overview Card */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white">
                    {profileQuery.data.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profileQuery.data.fullName}
                    </h2>
                    <p className="text-sm text-gray-600">@{profileQuery.data.username}</p>
                    <div className="mt-2 flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeColor(profileQuery.data.role)}`}
                      >
                        <Shield className="h-3 w-3" />
                        <span>{profileQuery.data.role}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Joined {new Date(profileQuery.data.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {profileQuery.data.role === "CITIZEN" && (
                <div className="mt-6 rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Registrations</p>
                      <p className="mt-1 text-3xl font-bold text-blue-600">
                        {profileQuery.data.registrationCount}
                      </p>
                    </div>
                    <Link
                      to="/my-registrations"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      View History
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Form */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-xl font-bold text-gray-900">Personal Information</h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register("fullName")}
                      disabled={!isEditing}
                      className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      {...register("email")}
                      disabled={!isEditing}
                      className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      {...register("phoneNumber")}
                      disabled={!isEditing}
                      className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* Password Section */}
                {isEditing && (
                  <div className="border-t pt-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">Change Password</h4>
                      <button
                        type="button"
                        onClick={() => setShowPasswordFields(!showPasswordFields)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {showPasswordFields ? "Cancel" : "Change Password"}
                      </button>
                    </div>

                    {showPasswordFields && (
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Current Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="password"
                              {...register("currentPassword")}
                              className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter current password"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            New Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="password"
                              {...register("newPassword")}
                              className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter new password"
                            />
                          </div>
                          {errors.newPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Confirm New Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="password"
                              {...register("confirmPassword")}
                              className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Confirm new password"
                            />
                          </div>
                          {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex space-x-3 border-t pt-6">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      <Save className="h-4 w-4" />
                      <span>
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Quick Links</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  to="/settings"
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-purple-100 p-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Settings</p>
                      <p className="text-sm text-gray-600">Preferences & notifications</p>
                    </div>
                  </div>
                  <ArrowLeft className="h-5 w-5 rotate-180 text-gray-400" />
                </Link>

                {user.role === "CITIZEN" && (
                  <Link
                    to="/my-registrations"
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="rounded-full bg-green-100 p-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">My Registrations</p>
                        <p className="text-sm text-gray-600">View registration history</p>
                      </div>
                    </div>
                    <ArrowLeft className="h-5 w-5 rotate-180 text-gray-400" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-gray-600">Failed to load profile data.</p>
          </div>
        )}
      </main>
    </div>
  );
}
