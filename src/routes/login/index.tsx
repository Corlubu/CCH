import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import toast from "react-hot-toast";
import { Lock, User, ArrowLeft } from "lucide-react";
import { BRAND_CONFIG } from "~/config/branding";

export const Route = createFileRoute("/login/")({
  component: LoginPage,
});

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation(
    trpc.login.mutationOptions({
      onSuccess: (data) => {
        setAuth(data.token, data.user);
        toast.success(`Welcome back, ${data.user.fullName}!`);

        // Redirect based on role
        if (data.user.role === "ADMIN") {
          void navigate({ to: "/admin" });
        } else if (data.user.role === "STAFF") {
          void navigate({ to: "/staff" });
        }
      },
      onError: (error) => {
        toast.error(error.message || "Login failed");
      },
    }),
  );

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Left Side - Branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="mb-8 flex items-center space-x-3">
            <BRAND_CONFIG.Icon className="h-10 w-10 text-white" />
            <span className="text-2xl font-bold text-white">
              {BRAND_CONFIG.organizationName}
            </span>
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white">
            Welcome Back
          </h1>
          <p className="text-xl text-blue-100">
            Sign in to manage food distribution events and help serve our
            community.
          </p>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">5,000+</div>
            <div className="text-blue-100">Families Served This Year</div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center space-x-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          <div className="mb-8">
            <div className="mb-2 flex items-center space-x-2 lg:hidden">
              <BRAND_CONFIG.Icon
                className={`h-8 w-8 ${BRAND_CONFIG.iconColorClass}`}
              />
              <span className="text-xl font-bold text-gray-900">
                {BRAND_CONFIG.organizationShortName}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Staff Login</h2>
            <p className="mt-2 text-gray-600">
              Enter your credentials to access the system
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  {...register("username")}
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
