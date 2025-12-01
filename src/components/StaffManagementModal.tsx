import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import { X, User, Lock, Mail, Phone } from "lucide-react";

const staffFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters").or(z.literal("")),
});

type StaffFormData = z.infer<typeof staffFormSchema>;

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  authToken: string;
  staff?: {
    id: number;
    username: string;
    fullName: string;
    email: string | null;
    phoneNumber: string | null;
  };
}

export function StaffManagementModal({
  isOpen,
  onClose,
  mode,
  authToken,
  staff,
}: StaffManagementModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: mode === "edit" && staff ? {
      username: staff.username,
      fullName: staff.fullName,
      email: staff.email || "",
      phoneNumber: staff.phoneNumber || "",
      password: "",
    } : undefined,
  });

  const createMutation = useMutation(
    trpc.createStaff.mutationOptions({
      onSuccess: () => {
        toast.success("Staff user created successfully!");
        reset();
        onClose();
        void queryClient.invalidateQueries({ queryKey: trpc.getAllUsers.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create staff user");
      },
    })
  );

  const updateMutation = useMutation(
    trpc.updateStaff.mutationOptions({
      onSuccess: () => {
        toast.success("Staff user updated successfully!");
        reset();
        onClose();
        void queryClient.invalidateQueries({ queryKey: trpc.getAllUsers.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update staff user");
      },
    })
  );

  const onSubmit = (data: StaffFormData) => {
    if (mode === "create") {
      createMutation.mutate({
        authToken,
        username: data.username,
        password: data.password || "",
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
      });
    } else if (staff) {
      updateMutation.mutate({
        authToken,
        staffId: staff.id,
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        newPassword: data.password || undefined,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === "create" ? "Create New Staff User" : "Edit Staff User"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                {...register("username")}
                disabled={mode === "edit"}
                className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Enter username"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password {mode === "edit" && <span className="text-gray-400">(leave blank to keep current)</span>}
              {mode === "create" && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                {...register("password")}
                className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={mode === "edit" ? "Enter new password" : "Enter password"}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

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
                className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email <span className="text-gray-400">(Optional)</span>
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
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone Number <span className="text-gray-400">(Optional)</span>
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
              <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : mode === "create"
                  ? "Create Staff User"
                  : "Update Staff User"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
