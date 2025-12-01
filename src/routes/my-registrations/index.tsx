import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Package,
  AlertCircle,
  ChevronRight,
  QrCode,
} from "lucide-react";
import { BRAND_CONFIG } from "~/config/branding";
import { RegistrationQRCodeModal } from "~/components/RegistrationQRCodeModal";

export const Route = createFileRoute("/my-registrations/")({
  component: MyRegistrationsPage,
});

function MyRegistrationsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const trpc = useTRPC();
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [selectedRegistration, setSelectedRegistration] = useState<{
    orderNumber: string;
    qrCodeUrl: string;
    searchUrl: string;
    eventName: string;
    eventStartDatetime: string;
    eventEndDatetime: string;
    fullName: string;
  } | null>(null);

  // Check authentication
  useEffect(() => {
    if (!user || !token) {
      void navigate({ to: "/login" });
    } else if (user.role !== "CITIZEN") {
      void navigate({ to: "/" });
    }
  }, [user, token, navigate]);

  // Fetch user registrations
  const registrationsQuery = useQuery(
    token
      ? trpc.getUserRegistrations.queryOptions({
          authToken: token,
          limit: 20,
          cursor,
        })
      : { enabled: false, queryKey: ["disabled"] }
  );

  const getEventStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "INACTIVE":
        return "bg-yellow-100 text-yellow-700";
      case "COMPLETED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const isEventUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const isEventPast = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  if (!user || user.role !== "CITIZEN") {
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
                <h1 className="text-2xl font-bold text-gray-900">My Registrations</h1>
                <p className="text-sm text-gray-600">View your event registration history</p>
              </div>
            </div>
            <Link
              to="/profile"
              className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profile</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {registrationsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="text-gray-600">Loading registrations...</p>
            </div>
          </div>
        ) : registrationsQuery.data && registrationsQuery.data.registrations.length > 0 ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {registrationsQuery.data.registrations.length}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Checked In</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                      {registrationsQuery.data.registrations.filter((r) => r.checkedIn).length}
                    </p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming</p>
                    <p className="mt-2 text-3xl font-bold text-purple-600">
                      {
                        registrationsQuery.data.registrations.filter((r) =>
                          isEventUpcoming(r.event.startDatetime)
                        ).length
                      }
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-100 p-3">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Registrations List */}
            <div className="rounded-xl bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-bold text-gray-900">Registration History</h2>
              </div>

              <div className="divide-y divide-gray-200">
                {registrationsQuery.data.registrations.map((registration) => (
                  <div key={registration.id} className="p-6 transition-colors hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {registration.event.name}
                          </h3>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getEventStatusBadge(registration.event.status)}`}
                          >
                            {registration.event.status}
                          </span>
                        </div>

                        {registration.event.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {registration.event.description}
                          </p>
                        )}

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="flex items-center space-x-2 text-sm">
                            <Package className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-700">Order Number</p>
                              <p className="font-mono text-xs text-gray-900">
                                {registration.orderNumber}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-700">Event Date</p>
                              <p className="text-gray-900">
                                {new Date(registration.event.startDatetime).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-700">Registered</p>
                              <p className="text-gray-900">
                                {new Date(registration.registrationDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-sm">
                            {registration.checkedIn ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="font-medium text-green-700">Checked In</p>
                                  <p className="text-xs text-gray-600">
                                    {registration.checkedInAt
                                      ? new Date(registration.checkedInAt).toLocaleDateString()
                                      : "—"}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <div>
                                  <p className="font-medium text-yellow-700">Pending</p>
                                  <p className="text-xs text-gray-600">Not checked in yet</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Event Time Info */}
                        <div className="mt-3 rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">
                                <span className="font-medium">Event Time:</span>{" "}
                                {new Date(registration.event.startDatetime).toLocaleString()} -{" "}
                                {new Date(registration.event.endDatetime).toLocaleString()}
                              </span>
                            </div>
                            {isEventUpcoming(registration.event.startDatetime) && (
                              <span className="inline-flex items-center space-x-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                                <AlertCircle className="h-3 w-3" />
                                <span>Upcoming</span>
                              </span>
                            )}
                            {isEventPast(registration.event.endDatetime) && (
                              <span className="inline-flex items-center space-x-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                <CheckCircle className="h-3 w-3" />
                                <span>Completed</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* QR Code Button */}
                        <div className="mt-4">
                          <button
                            onClick={() =>
                              setSelectedRegistration({
                                orderNumber: registration.orderNumber,
                                qrCodeUrl: registration.qrCodeUrl,
                                searchUrl: registration.searchUrl,
                                eventName: registration.event.name,
                                eventStartDatetime: registration.event.startDatetime,
                                eventEndDatetime: registration.event.endDatetime,
                                fullName: registration.fullName,
                              })
                            }
                            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                          >
                            <QrCode className="h-4 w-4" />
                            <span>View QR Code</span>
                          </button>
                        </div>
                      </div>

                      <ChevronRight className="ml-4 h-5 w-5 flex-shrink-0 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {registrationsQuery.data.nextCursor && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <button
                    onClick={() => setCursor(registrationsQuery.data.nextCursor)}
                    className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No Registrations Yet</h3>
            <p className="mb-6 text-gray-600">
              You haven't registered for any events yet. Check out our upcoming events and register
              to receive food assistance.
            </p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Calendar className="h-4 w-4" />
              <span>Browse Events</span>
            </Link>
          </div>
        )}

        {selectedRegistration && (
          <RegistrationQRCodeModal
            isOpen={!!selectedRegistration}
            onClose={() => setSelectedRegistration(null)}
            registration={selectedRegistration}
          />
        )}
      </main>
    </div>
  );
}
