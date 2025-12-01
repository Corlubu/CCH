import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, CheckCircle, User, Calendar, Package, Phone, Mail, MapPin, Users } from "lucide-react";

interface QuickCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: {
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
  };
  onCheckIn: (registrationId: number, currentStatus: boolean) => void;
  isLoading?: boolean;
}

export function QuickCheckInModal({
  isOpen,
  onClose,
  registration,
  onCheckIn,
  isLoading = false,
}: QuickCheckInModalProps) {
  const handleCheckIn = () => {
    onCheckIn(registration.id, registration.checkedIn);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold text-gray-900 flex items-center space-x-2"
                  >
                    <Package className="h-6 w-6 text-blue-600" />
                    <span>Registration Found</span>
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Registration Details */}
                <div className="space-y-4 mb-6">
                  {/* Order Number - Large and prominent */}
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center border-2 border-blue-200">
                    <p className="text-sm font-medium text-gray-600 mb-2">Order Number</p>
                    <p className="text-3xl font-bold text-blue-600 font-mono">
                      {registration.orderNumber}
                    </p>
                  </div>

                  {/* Citizen Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-700">Name</p>
                          <p className="text-base font-semibold text-gray-900 break-words">
                            {registration.fullName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start space-x-3">
                        <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-700">Phone</p>
                          <p className="text-base text-gray-900 break-words">
                            {registration.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    {registration.email && (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start space-x-3">
                          <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-700">Email</p>
                            <p className="text-base text-gray-900 break-words">
                              {registration.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start space-x-3">
                        <Users className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-700">Household Size</p>
                          <p className="text-base text-gray-900">
                            {registration.totalIndividuals} {registration.totalIndividuals === 1 ? 'person' : 'people'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  {!registration.isHomeless && (registration.address || registration.cityTown) && (
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-1">Address</p>
                          {registration.address && (
                            <p className="text-sm text-gray-900">{registration.address}</p>
                          )}
                          <p className="text-sm text-gray-900">
                            {[
                              registration.cityTown,
                              registration.stateProvince,
                              registration.zipPostalCode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {registration.isHomeless && (
                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">No Permanent Address</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            This person is currently homeless
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-700">Event</p>
                        <p className="text-base font-semibold text-gray-900 break-words">
                          {registration.eventName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(registration.eventStartDatetime).toLocaleDateString(undefined, {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div
                    className={`rounded-lg border-2 p-4 ${
                      registration.checkedIn
                        ? "border-green-300 bg-green-50"
                        : "border-yellow-300 bg-yellow-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle
                        className={`h-6 w-6 ${
                          registration.checkedIn ? "text-green-600" : "text-yellow-600"
                        }`}
                      />
                      <div>
                        <p
                          className={`text-base font-semibold ${
                            registration.checkedIn ? "text-green-900" : "text-yellow-900"
                          }`}
                        >
                          {registration.checkedIn ? "Already Checked In" : "Not Yet Checked In"}
                        </p>
                        {registration.checkedIn && registration.checkedInAt && (
                          <p className="text-sm text-green-700 mt-1">
                            Checked in at{" "}
                            {new Date(registration.checkedInAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCheckIn}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center space-x-2 rounded-lg px-6 py-4 text-base font-bold text-white transition-all transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                      registration.checkedIn
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700 shadow-lg"
                    }`}
                  >
                    <CheckCircle className="h-6 w-6" />
                    <span>
                      {isLoading
                        ? "Processing..."
                        : registration.checkedIn
                          ? "Undo Check-In"
                          : "Check In Now"}
                    </span>
                  </button>
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 rounded-lg bg-gray-200 px-6 py-4 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
