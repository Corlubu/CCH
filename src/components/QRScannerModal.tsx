import { Fragment, useState, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, QrCode, Scan } from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (orderNumber: string) => void;
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScan,
}: QRScannerModalProps) {
  const [scannedData, setScannedData] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setScannedData("");
    }
  }, [isOpen]);

  const extractOrderNumber = (data: string): string | null => {
    // Trim whitespace
    const trimmed = data.trim();

    // If it's already an order number format (CCH-...)
    if (/^CCH-[A-Z0-9]+-[A-Z0-9]+$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }

    // If it's a URL, try to extract the orderNumber parameter
    try {
      const url = new URL(trimmed);
      const orderNumber = url.searchParams.get("orderNumber");
      if (orderNumber) {
        return orderNumber.toUpperCase();
      }
    } catch {
      // Not a valid URL, continue
    }

    // Try to find order number pattern in the string
    const match = trimmed.match(/CCH-[A-Z0-9]+-[A-Z0-9]+/i);
    if (match) {
      return match[0].toUpperCase();
    }

    return null;
  };

  const handleScan = () => {
    const orderNumber = extractOrderNumber(scannedData);

    if (orderNumber) {
      onScan(orderNumber);
      onClose();
    } else {
      // If we can't extract an order number, just pass the raw data
      // The search will handle it
      if (scannedData.trim()) {
        onScan(scannedData.trim());
        onClose();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleScan();
    }
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title
                    as="h3"
                    className="flex items-center space-x-2 text-lg font-semibold text-gray-900"
                  >
                    <QrCode className="h-5 w-5 text-blue-600" />
                    <span>Scan QR Code</span>
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 transition-colors hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="flex items-start space-x-3">
                      <Scan className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <div className="text-sm text-blue-900">
                        <p className="mb-1 font-medium">How to use:</p>
                        <ul className="list-inside list-disc space-y-1 text-blue-800">
                          <li>
                            Use your QR scanner to scan the citizen's QR code
                          </li>
                          <li>
                            The order number will appear in the field below
                          </li>
                          <li>Or manually paste/type the order number</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="qr-input"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Scanned Data / Order Number
                    </label>
                    <input
                      ref={inputRef}
                      id="qr-input"
                      type="text"
                      value={scannedData}
                      onChange={(e) => setScannedData(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="CCH-XXXXX or scan QR code..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Press Enter or click Search to continue
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleScan}
                      disabled={!scannedData.trim()}
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      Search
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
