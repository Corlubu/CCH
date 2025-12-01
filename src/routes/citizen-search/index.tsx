import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import {
  Search,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  Package,
  ArrowLeft,
  QrCode,
} from "lucide-react";
import { BRAND_CONFIG } from "~/config/branding";
import { z } from "zod";
import { RegistrationQRCodeModal } from "~/components/RegistrationQRCodeModal";

export const Route = createFileRoute("/citizen-search/")({
  component: CitizenSearchPage,
  validateSearch: z.object({
    orderNumber: z.string().optional(),
  }),
});

function CitizenSearchPage() {
  const { orderNumber: urlOrderNumber } = Route.useSearch();
  const trpc = useTRPC();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orderNumber, setOrderNumber] = useState(urlOrderNumber || "");
  const [searchType, setSearchType] = useState<"phone" | "order">(
    urlOrderNumber ? "order" : "phone",
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<{
    orderNumber: string;
    qrCodeUrl: string;
    searchUrl: string;
    eventName: string;
    eventStartDatetime: string;
    eventEndDatetime: string;
    fullName: string;
  } | null>(null);

  // Automatically search if orderNumber is in URL
  useEffect(() => {
    if (urlOrderNumber) {
      setOrderNumber(urlOrderNumber);
      setSearchType("order");
      setHasSearched(true);
    }
  }, [urlOrderNumber]);

  // Fetch search results
  const searchQuery = useQuery(
    hasSearched
      ? trpc.searchMyRegistrations.queryOptions({
          phoneNumber: searchType === "phone" ? phoneNumber : undefined,
          orderNumber: searchType === "order" ? orderNumber : undefined,
        })
      : { enabled: false, queryKey: ["disabled"] },
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchType === "phone" && phoneNumber.length >= 10) {
      setHasSearched(true);
    } else if (searchType === "order" && orderNumber.length > 0) {
      setHasSearched(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
                  Find My Registration
                </h1>
                <p className="text-sm text-gray-600">
                  {BRAND_CONFIG.organizationName}
                </p>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Search Form */}
        <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Search className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Search Your Registrations
            </h2>
            <p className="mt-2 text-gray-600">
              Enter your phone number to view your food distribution
              registrations
            </p>
          </div>

          <form onSubmit={handleSearch} className="mx-auto max-w-md">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search By
              </label>
              <div className="mb-4 flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="phone"
                    checked={searchType === "phone"}
                    onChange={(e) => {
                      setSearchType(e.target.value as "phone" | "order");
                      setHasSearched(false);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Phone Number</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="order"
                    checked={searchType === "order"}
                    onChange={(e) => {
                      setSearchType(e.target.value as "phone" | "order");
                      setHasSearched(false);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Order Number</span>
                </label>
              </div>
            </div>

            {searchType === "phone" ? (
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setHasSearched(false);
                    }}
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                    required
                    minLength={10}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the phone number you used when registering
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Order Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => {
                      setOrderNumber(e.target.value);
                      setHasSearched(false);
                    }}
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CCH-XXXXX-XXXXX"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter your order number or scan the QR code
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                (searchType === "phone" && phoneNumber.length < 10) ||
                (searchType === "order" && orderNumber.length === 0) ||
                searchQuery.isLoading
              }
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
            >
              {searchQuery.isLoading ? "Searching..." : "Search Registrations"}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="rounded-xl bg-white p-8 shadow-lg">
            <h3 className="mb-6 text-xl font-bold text-gray-900">
              Your Registrations
            </h3>

            {searchQuery.isLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-500">
                  Searching for your registrations...
                </p>
              </div>
            ) : searchQuery.data?.registrations &&
              searchQuery.data.registrations.length > 0 ? (
              <div className="space-y-4">
                {searchQuery.data.registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="rounded-lg border-2 border-gray-200 p-6 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {reg.eventName}
                        </h4>
                        {reg.eventDescription && (
                          <p className="mt-1 text-sm text-gray-600">
                            {reg.eventDescription}
                          </p>
                        )}
                      </div>
                      {reg.checkedIn ? (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span>Checked In</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                          <Clock className="h-4 w-4" />
                          <span>Registered</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex items-start space-x-3">
                        <Package className="mt-1 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Order Number
                          </p>
                          <p className="mt-1 font-mono text-sm font-semibold text-gray-900">
                            {reg.orderNumber}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Calendar className="mt-1 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Event Date
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(
                              reg.eventStartDatetime,
                            ).toLocaleDateString(undefined, {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              reg.eventStartDatetime,
                            ).toLocaleTimeString(undefined, {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                            {" - "}
                            {new Date(reg.eventEndDatetime).toLocaleTimeString(
                              undefined,
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Phone className="mt-1 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Registered Name
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {reg.fullName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Calendar className="mt-1 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Registration Date
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(
                              reg.registrationDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {reg.checkedIn && reg.checkedInAt && (
                      <div className="mt-4 rounded-lg bg-green-50 p-3">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">Checked in at:</span>{" "}
                          {new Date(reg.checkedInAt).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {!reg.checkedIn && (
                      <div className="mt-4 rounded-lg bg-blue-50 p-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Important:</span> Please
                          bring this order number ({reg.orderNumber}) when
                          picking up your food bag.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() =>
                        setSelectedRegistration({
                          orderNumber: reg.orderNumber,
                          qrCodeUrl: reg.qrCodeUrl,
                          searchUrl: reg.searchUrl,
                          eventName: reg.eventName,
                          eventStartDatetime: reg.eventStartDatetime,
                          eventEndDatetime: reg.eventEndDatetime,
                          fullName: reg.fullName,
                        })
                      }
                      className="mt-4 flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>View QR Code</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">No registrations found.</p>
                <p className="mt-2 text-sm text-gray-500">
                  Please make sure you entered the correct{" "}
                  {searchType === "phone" ? "phone number" : "order number"}.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Information Section */}
        {!hasSearched && (
          <div className="mt-8 rounded-xl bg-blue-50 p-6">
            <h3 className="mb-3 text-lg font-semibold text-blue-900">
              Need Help?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="mt-0.5">•</span>
                <span>
                  Search by phone number or order number to find your
                  registrations
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-0.5">•</span>
                <span>
                  You can scan the QR code from your registration confirmation
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-0.5">•</span>
                <span>
                  You'll see all your registrations and their current status
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-0.5">•</span>
                <span>
                  Make sure to bring your order number when picking up your food
                  bag
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-0.5">•</span>
                <span>
                  If you can't find your registration, please contact our
                  support team
                </span>
              </li>
            </ul>
          </div>
        )}
      </main>

      {selectedRegistration && (
        <RegistrationQRCodeModal
          isOpen={!!selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
          registration={selectedRegistration}
        />
      )}
    </div>
  );
}
