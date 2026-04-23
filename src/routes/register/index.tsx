import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import { Calendar, Users, CheckCircle, ArrowLeft, Phone, Mail, User, Home, MapPin, DollarSign } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { BRAND_CONFIG } from "~/config/branding";

export const Route = createFileRoute("/register/")({
  component: RegisterPage,
  validateSearch: z.object({
    session: z.string().optional(),
  }),
});

const registrationSchema = z.object({
  eventId: z.number().min(1, "Please select an event"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  isHomeless: z.boolean().default(false),
  totalIndividuals: z.number().min(1, "Total individuals must be at least 1").default(1),
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

function RegisterPage() {
  const { session } = Route.useSearch();
  const trpc = useTRPC();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [searchUrl, setSearchUrl] = useState("");

  // Fetch active events
  const eventsQuery = useQuery(trpc.getActiveEvents.queryOptions());

  // Fetch event by session if session code is provided
  const sessionEventQuery = useQuery(
    trpc.getEventBySession.queryOptions(
      { sessionCode: session || "" },
      { enabled: !!session }
    )
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
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

  // Update form when session event is loaded
  useEffect(() => {
    if (session && sessionEventQuery.data) {
      reset({
        ...registrationSchema.parse({}), // Get default empty values
        eventId: sessionEventQuery.data.id,
      });
    }
  }, [session, sessionEventQuery.data, reset]);

  // Merge session event into events list if it exists and isn't already there
  const availableEvents = useMemo(() => {
    if (!eventsQuery.data) return [];

    if (session && sessionEventQuery.data) {
      const sessionEventExists = eventsQuery.data.some(
        (e) => e.id === sessionEventQuery.data.id
      );

      if (!sessionEventExists) {
        return [sessionEventQuery.data, ...eventsQuery.data];
      }
    }

    return eventsQuery.data;
  }, [eventsQuery.data, session, sessionEventQuery.data]);

  const selectedEventId = watch("eventId");

  // ÚNICA DECLARACIÓN DE selectedEvent para evitar el error de duplicidad
  const selectedEvent = useMemo(() => {
    if (session && sessionEventQuery.data) {
      return sessionEventQuery.data;
    }
    return eventsQuery.data?.find((e) => e.id === selectedEventId);
  }, [session, sessionEventQuery.data, eventsQuery.data, selectedEventId]);

  // Control de disponibilidad de bolsas: Si el evento existe, calculamos si está lleno
  const isEventFull = useMemo(() => {
    if (!selectedEvent) return false;
    // Usamos remainingBags si existe, de lo contrario calculamos manualmente
    const remaining = selectedEvent.remainingBags ?? (selectedEvent.availableBags - selectedEvent.registeredCount);
    return remaining <= 0;
  }, [selectedEvent]);

  const registerMutation = useMutation(
    trpc.registerCitizen.mutationOptions({
      onSuccess: (data) => {
        setOrderNumber(data.orderNumber);
        setQrCodeUrl(data.qrCodeUrl);
        setSearchUrl(data.searchUrl);
        setRegistrationSuccess(true);
        toast.success(data.message);
      },
      onError: (error) => {
        toast.error(error.message || "Registration failed/Fallo Registro");
      },
    })
  );

  const onSubmit = (data: RegistrationFormData) => {
    registerMutation.mutate(data);
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
        <div className="mx-auto max-w-2xl pt-20">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="mb-4 text-center text-3xl font-bold text-gray-900">
              Registration Successful! /
              <span className="text-blue-600"> ¡Registro completado con éxito!</span>
            </h1>
            <p className="mb-6 text-center text-gray-600">
              Thank you for registering. You will receive an SMS confirmation shortly.<br />
              <span className="text-blue-600">Gracias por registrarte. En breve recibirás un SMS de confirmación.</span>
            </p>
            <div className="mb-8 rounded-xl bg-blue-50 p-6">
              <p className="mb-2 text-center text-sm font-medium text-gray-700">
                Your Order Number <span className="text-blue-600">(Sú número de orden)</span>
              </p>
              <p className="text-center text-3xl font-bold text-blue-600">
                {orderNumber}
              </p>

              {qrCodeUrl && (
                <div className="mt-6">
                  <p className="mb-3 text-center text-sm font-medium text-gray-700">
                    Scan this QR code to view your registration<br />
                    <span className="text-blue-600">Escanea este código QR para ver tu inscripción</span>
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={qrCodeUrl}
                      alt="Order Number QR Code"
                      className="rounded-lg border-4 border-white shadow-lg"
                    />
                  </div>
                </div>
              )}

              <p className="mt-4 text-center text-sm text-gray-600">
                Please save this number and present it when picking up your food bag.<br />
                <span className="text-blue-600">Guarda este número y preséntalo cuando vayas a recoger tu bolsa de comida.</span>
              </p>
            </div>
            <div className="space-y-3">
              <Link
                to="/"
                className="block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Return to Home (Regresar)
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="mt-4 flex items-center space-x-2">
            <BRAND_CONFIG.Icon className={`h-8 w-8 ${BRAND_CONFIG.iconColorClass}`} />
            <span className="text-xl font-bold text-gray-900">
              {BRAND_CONFIG.organizationName}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">FEEDING TAMPA BAY</h1>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">THE EMERGENCY FOOD ASSISTANCE PROGRAM (TEFAP)</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="eventId" className="mb-2 block text-sm font-medium text-gray-700">
                    Select Event <span className="text-red-500">*</span> <span className="text-blue-600">(Seleccionar Evento)</span>
                  </label>
                  {eventsQuery.isLoading ? (
                    <div className="rounded-lg border border-gray-300 p-4 text-center text-gray-500">Loading...</div>
                  ) : availableEvents.length > 0 ? (
                    <select
                      id="eventId"
                      {...register("eventId", { valueAsNumber: true })}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!!session}
                    >
                      <option value={0}>Choose an event...</option>
                      {availableEvents.map((event) => {
                         const remaining = event.remainingBags ?? (event.availableBags - event.registeredCount);
                         return (
                          <option key={event.id} value={event.id}>
                            {event.name} - {remaining > 0 ? `${remaining} bags available` : 'FULL / AGOTADO'}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-center text-yellow-800">
                      No active events available.
                    </div>
                  )}
                  {errors.eventId && <p className="mt-1 text-sm text-red-600">{errors.eventId.message}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">First Name *</label>
                      <input type="text" {...register("firstName")} className="block w-full rounded-lg border border-gray-300 py-3 px-3" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Last Name *</label>
                      <input type="text" {...register("lastName")} className="block w-full rounded-lg border border-gray-300 py-3 px-3" />
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number *</label>
                    <input type="tel" {...register("phoneNumber")} className="block w-full rounded-lg border border-gray-300 py-3 px-3" />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Digital Signature *</label>
                    <input type="text" {...register("digitalSignature")} className="block w-full rounded-lg border border-gray-300 py-3 px-3 italic" placeholder="Type full name" />
                </div>

                {/* MENSAJE DE ADVERTENCIA DE CUPO LLENO (Implementado) */}
                {isEventFull && (
                  <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-center animate-pulse">
                    <p className="text-sm font-bold text-red-800">
                      We're sorry, but meal bags are not available for this event.
                    </p>
                    <p className="text-xs text-red-700 mt-1 font-semibold">
                      Lo sentimos, no hay disponibilidad de bolsas de comida para este evento. Por favor, esté pendiente del próximo registro.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    registerMutation.isPending ||
                    isEventFull || // Deshabilita el botón si no hay disponibilidad
                    (!session && availableEvents.length === 0) ||
                    selectedEventId === 0
                  }
                  className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {registerMutation.isPending
                    ? "Registering..."
                    : isEventFull
                    ? "No Availability (Cupo Lleno)"
                    : "Complete Registration"}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {selectedEvent && (
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Event Details</h3>
                <div className="space-y-4 text-sm">
                  <p><strong>{selectedEvent.name}</strong></p>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Availability:</span>
                      <span className={`font-bold ${isEventFull ? 'text-red-600' : 'text-gray-900'}`}>
                        {selectedEvent.registeredCount} / {selectedEvent.availableBags}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                       <div
                        className={`h-full ${isEventFull ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min((selectedEvent.registeredCount / selectedEvent.availableBags) * 100, 100)}%` }}
                       />
                    </div>
                    <p className={`mt-2 font-bold ${isEventFull ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.max(0, selectedEvent.availableBags - selectedEvent.registeredCount)} bags remaining
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
