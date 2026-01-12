import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Calendar,
  ArrowRight,
  CheckCircle,
  QrCode,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { BRAND_CONFIG } from "~/config/branding";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const trpc = useTRPC();

  // Fetch featured QR code for homepage
  const featuredQRQuery = useQuery(trpc.getFeaturedQRCode.queryOptions());

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <BRAND_CONFIG.Icon
                className={`h-8 w-8 ${BRAND_CONFIG.iconColorClass}`}
              />
              <span className="text-xl font-bold text-gray-900">
                {BRAND_CONFIG.organizationName}
              </span>
            </div>
            <Link
              to="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-16">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&q=80"
            alt="Community gathering"
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-rose-50"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
              Feeding Our Community
              <span className="block text-blue-600">
                With Love & Compassion
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600">
              Join us in our mission to ensure no family goes hungry. Register
              for food distribution events and receive the support you need.
            </p>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600">
              <img
                src="/food-pantry.png"
                alt="FOOD PANTRY"
                className="mx-auto"
              />
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="group flex items-center space-x-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
              >
                <span>Register for Food Distribution</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/citizen-search"
                className="group flex items-center space-x-2 rounded-xl border-2 border-blue-600 bg-white px-8 py-4 text-lg font-semibold text-blue-600 transition-all hover:bg-blue-50 hover:shadow-lg"
              >
                <Search className="h-5 w-5" />
                <span>Find My Registration</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold text-white">5,000+</div>
              <div className="text-lg text-blue-100">Families Served</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold text-white">50+</div>
              <div className="text-lg text-blue-100">Distribution Events</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold text-white">100%</div>
              <div className="text-lg text-blue-100">Community Supported</div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-4xl font-bold text-gray-900">
                Our Mission
              </h2>
              <p className="mb-6 text-lg text-gray-600">
                At {BRAND_CONFIG.organizationName}, we believe that no one
                should go hungry. Our mission is to provide nutritious food and
                essential support to families in need, while treating everyone
                with dignity and respect.
              </p>
              <p className="mb-8 text-lg text-gray-600">
                Through our regular distribution events, we serve hundreds of
                families each month, ensuring they have access to fresh produce,
                pantry staples, and other necessities.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Free Registration
                    </h3>
                    <p className="text-gray-600">
                      Easy online registration with SMS confirmation
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Regular Events
                    </h3>
                    <p className="text-gray-600">
                      Multiple distribution events throughout the month
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Quality Food
                    </h3>
                    <p className="text-gray-600">
                      Fresh produce and nutritious pantry items
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?w=800&q=80"
                alt="Food distribution"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 rounded-2xl bg-rose-600 p-6 shadow-xl">
                <Users className="mb-2 h-12 w-12 text-white" />
                <div className="text-2xl font-bold text-white">Together</div>
                <div className="text-rose-100">We Make a Difference</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Registration Section */}
      {featuredQRQuery.data && (
        <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <QrCode className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="mb-4 text-4xl font-bold text-gray-900">
                Quick Registration with QR Code
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                Scan the QR code below with your phone to register instantly for
                our current event
              </p>
            </div>

            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="rounded-3xl bg-white p-8 shadow-2xl">
                  <div className="mb-6 text-center">
                    <h3 className="mb-2 text-2xl font-bold text-gray-900">
                      {featuredQRQuery.data.event.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Scan to register instantly
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 p-6">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(featuredQRQuery.data.registrationUrl)}`}
                      alt="Registration QR Code"
                      className="h-auto w-full rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="mt-6 text-center">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      Or register online:
                    </p>
                    <Link
                      to="/register"
                      search={{ session: featuredQRQuery.data.sessionCode }}
                      className="inline-flex items-center space-x-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                    >
                      <span>Register Now</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Event Information */}
              <div className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-lg">
                  <h3 className="mb-4 text-xl font-bold text-gray-900">
                    Current Event Details
                  </h3>
                  <div className="space-y-4">
                    {featuredQRQuery.data.event.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Description
                        </p>
                        <p className="mt-1 text-gray-700">
                          {featuredQRQuery.data.event.description}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Event Schedule
                      </p>
                      <div className="mt-2 flex items-center space-x-2 text-gray-700">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span>
                          {new Date(
                            featuredQRQuery.data.event.startDatetime,
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(
                            featuredQRQuery.data.event.endDatetime,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-500">
                        Availability
                      </p>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Registered</span>
                        <span className="font-semibold">
                          {featuredQRQuery.data.event.registeredCount} /{" "}
                          {featuredQRQuery.data.event.availableBags}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all"
                          style={{
                            width: `${Math.min((featuredQRQuery.data.event.registeredCount / featuredQRQuery.data.event.availableBags) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-green-600">
                        {featuredQRQuery.data.event.remainingBags} bags still
                        available
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white">
                  <h3 className="mb-3 text-lg font-bold">
                    How to Use the QR Code
                  </h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="font-bold">1.</span>
                      <span>Open your phone's camera app</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-bold">2.</span>
                      <span>Point it at the QR code above</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-bold">3.</span>
                      <span>
                        Tap the notification to open the registration form
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-bold">4.</span>
                      <span>
                        Complete your registration and receive confirmation
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Getting help is easy with our simple registration process
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-8 shadow-lg transition-transform hover:scale-105">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">
                1. Check Event every Tuesday
              </h3>
              <p className="text-gray-600">
                Browse our upcoming food distribution events every Tuesday.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-lg transition-transform hover:scale-105">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">
                2. Register Online
              </h3>
              <p className="text-gray-600">
                Complete our quick registration form and receive an SMS
                confirmation with your order number.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-lg transition-transform hover:scale-105">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Search className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">
                3. Track Status
              </h3>
              <p className="text-gray-600">
                Use our search tool to find your registration and check your
                order status anytime.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-lg transition-transform hover:scale-105">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <BRAND_CONFIG.Icon className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">
                4. Pick Up Food
              </h3>
              <p className="text-gray-600">
                Visit us on the event day with your order number to receive your
                food package.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Find Registration Section */}
      <div className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-purple-50 to-blue-50 p-12">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
                <Search className="h-10 w-10 text-purple-600" />
              </div>
              <h2 className="mb-4 text-4xl font-bold text-gray-900">
                Already Registered?
              </h2>
              <p className="mb-8 text-xl text-gray-600">
                Search for your registration using your phone number to view
                your order details and check-in status.
              </p>
              <Link
                to="/citizen-search"
                className="inline-flex items-center space-x-2 rounded-xl bg-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-purple-700 hover:shadow-xl"
              >
                <Search className="h-5 w-5" />
                <span>Find My Registration</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-4xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-xl text-blue-100">
            Register for our next food distribution event and let us help
            support your family.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
          >
            <span>Register Now</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="flex items-center space-x-2">
              <BRAND_CONFIG.Icon className="h-6 w-6 text-rose-500" />
              <span className="text-lg font-semibold text-white">
                {BRAND_CONFIG.organizationName}
              </span>
            </div>
            <div className="text-gray-400">
              © 2026 {BRAND_CONFIG.copyrightName}. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
