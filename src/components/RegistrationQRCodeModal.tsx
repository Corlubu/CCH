import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, QrCode, Printer, Download, Mail, Calendar, Package } from "lucide-react";

interface RegistrationQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: {
    orderNumber: string;
    qrCodeUrl: string;
    searchUrl: string;
    eventName: string;
    eventStartDatetime: string;
    eventEndDatetime: string;
    fullName: string;
  };
}

export function RegistrationQRCodeModal({
  isOpen,
  onClose,
  registration,
}: RegistrationQRCodeModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Open QR code image in a new tab so user can save it
    window.open(registration.qrCodeUrl, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`My Food Distribution Registration - ${registration.orderNumber}`);
    const body = encodeURIComponent(
      `Here is my food distribution registration:\n\n` +
      `Order Number: ${registration.orderNumber}\n` +
      `Event: ${registration.eventName}\n` +
      `Date: ${new Date(registration.eventStartDatetime).toLocaleDateString()}\n\n` +
      `View registration: ${registration.searchUrl}\n\n` +
      `QR Code: ${registration.qrCodeUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 100%;
              max-width: 600px;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      
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
                  <div className="no-print flex items-center justify-between mb-6">
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-bold text-gray-900 flex items-center space-x-2"
                    >
                      <QrCode className="h-6 w-6 text-blue-600" />
                      <span>Registration QR Code</span>
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Printable Content */}
                  <div className="print-content space-y-6">
                    {/* QR Code Display */}
                    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8">
                      <img
                        src={registration.qrCodeUrl}
                        alt="Registration QR Code"
                        className="w-64 h-64 rounded-lg border-4 border-white shadow-lg"
                      />
                      <div className="mt-6 text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">
                          Order Number
                        </p>
                        <p className="text-3xl font-bold text-blue-600 font-mono">
                          {registration.orderNumber}
                        </p>
                      </div>
                    </div>

                    {/* Registration Details */}
                    <div className="space-y-4">
                      <div className="rounded-lg border-2 border-gray-200 p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Event</p>
                            <p className="text-base font-semibold text-gray-900">
                              {registration.eventName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 mb-3">
                          <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Date & Time</p>
                            <p className="text-base text-gray-900">
                              {new Date(registration.eventStartDatetime).toLocaleDateString(undefined, {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(registration.eventStartDatetime).toLocaleTimeString(undefined, {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                              {" - "}
                              {new Date(registration.eventEndDatetime).toLocaleTimeString(undefined, {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Registered Name</p>
                            <p className="text-base text-gray-900">{registration.fullName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-blue-50 p-4">
                        <p className="text-sm text-blue-900">
                          <span className="font-semibold">Important:</span> Please present this QR
                          code or order number when picking up your food bag at the distribution
                          event.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="no-print mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handlePrint}
                      className="flex-1 flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print QR Code</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download QR Code</span>
                    </button>
                    <button
                      onClick={handleEmail}
                      className="flex-1 flex items-center justify-center space-x-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Email Details</span>
                    </button>
                  </div>

                  <div className="no-print mt-4 text-center">
                    <button
                      onClick={onClose}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
