import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
        eventId: sessionEventQuery.data.id,
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
      });
    }
  }, [session, sessionEventQuery.data, reset]);

  // Merge session event into events list if it exists and isn't already there
  const availableEvents = useMemo(() => {
    if (!eventsQuery.data) return [];
    
    // If we have a session event, ensure it's in the list
    if (session && sessionEventQuery.data) {
      const sessionEventExists = eventsQuery.data.some(
        (e) => e.id === sessionEventQuery.data.id
      );
      
      if (!sessionEventExists) {
        // Add the session event to the beginning of the list
        return [sessionEventQuery.data, ...eventsQuery.data];
      }
    }
    
    return eventsQuery.data;
  }, [eventsQuery.data, session, sessionEventQuery.data]);

  const selectedEventId = watch("eventId");
  const isHomeless = watch("isHomeless");
  
  // Determine the selected event
  // When a session is provided, use the session event directly
  // Otherwise, find it from the active events list
  const selectedEvent = session && sessionEventQuery.data
    ? sessionEventQuery.data
    : eventsQuery.data?.find((e) => e.id === selectedEventId);

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
        toast.error(error.message || "Registration failed");
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
              Registration Successful!
            </h1>
            <p className="mb-6 text-center text-gray-600">
              Thank you for registering. You will receive an SMS confirmation shortly.
            </p>
            <div className="mb-8 rounded-xl bg-blue-50 p-6">
              <p className="mb-2 text-center text-sm font-medium text-gray-700">
                Your Order Number
              </p>
              <p className="text-center text-3xl font-bold text-blue-600">
                {orderNumber}
              </p>
              
              {qrCodeUrl && (
                <div className="mt-6">
                  <p className="mb-3 text-center text-sm font-medium text-gray-700">
                    Scan this QR code to view your registration
                  </p>
                  <div className="flex justify-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="Order Number QR Code" 
                      className="rounded-lg border-4 border-white shadow-lg"
                    />
                  </div>
                  <p className="mt-3 text-center text-xs text-gray-600">
                    Save this QR code to quickly access your registration details
                  </p>
                </div>
              )}
              
              <p className="mt-4 text-center text-sm text-gray-600">
                Please save this number and present it when picking up your food bag.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                to="/"
                className="block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
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

      {/* Main Content */}
      <div className="mx-auto max-w-4xl p-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            FEEDING TAMPA BAY
          </h1>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            THE EMERGENCY FOOD ASSISTANCE PROGRAM (TEFAP)
          </h2>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">
            CERTIFICATION OF ELIGIBILITY TO TAKE FOOD HOME
          </h3>
          <p className="text-sm text-gray-600">7 CFR 251</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Registration Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Event Selection */}
                <div>
                  <label
                    htmlFor="eventId"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Select Event <span className="text-red-500">*</span>
                  </label>
                  {eventsQuery.isLoading || (session && sessionEventQuery.isLoading) ? (
                    <div className="rounded-lg border border-gray-300 p-4 text-center text-gray-500">
                      Loading events...
                    </div>
                  ) : availableEvents && availableEvents.length > 0 ? (
                    <select
                      id="eventId"
                      {...register("eventId", { valueAsNumber: true })}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!!session}
                    >
                      <option value={0}>Choose an event...</option>
                      {availableEvents.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name} - {event.remainingBags} bags available
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-center text-yellow-800">
                      No active events available at this time. Please check back later.
                    </div>
                  )}
                  {errors.eventId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.eventId.message}
                    </p>
                  )}
                </div>

                {/* TEFAP Information and Income Guidelines */}
                <div className="space-y-6 rounded-lg bg-blue-50 p-6">
                  <p className="text-sm text-gray-700">
                    If your household income is at or below the income listed for the number of people in your household, you are eligible to receive food.
                  </p>
                  
                  <div>
                    <h4 className="mb-3 text-center font-bold text-gray-900">
                      TEFAP Income Eligibility Guidelines - 2025
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 bg-white text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Household Size</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Annual Income</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Monthly Income</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Twice per Month</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Every two Weeks</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Weekly Income</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">1</td>
                            <td className="border border-gray-300 px-3 py-2">$46,950</td>
                            <td className="border border-gray-300 px-3 py-2">$3,913</td>
                            <td className="border border-gray-300 px-3 py-2">$1,956</td>
                            <td className="border border-gray-300 px-3 py-2">$1,806</td>
                            <td className="border border-gray-300 px-3 py-2">$903</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">2</td>
                            <td className="border border-gray-300 px-3 py-2">$63,450</td>
                            <td className="border border-gray-300 px-3 py-2">$5,288</td>
                            <td className="border border-gray-300 px-3 py-2">$2,644</td>
                            <td className="border border-gray-300 px-3 py-2">$2,440</td>
                            <td className="border border-gray-300 px-3 py-2">$1,220</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">3</td>
                            <td className="border border-gray-300 px-3 py-2">$79,950</td>
                            <td className="border border-gray-300 px-3 py-2">$6,663</td>
                            <td className="border border-gray-300 px-3 py-2">$3,331</td>
                            <td className="border border-gray-300 px-3 py-2">$3,075</td>
                            <td className="border border-gray-300 px-3 py-2">$1,538</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">4</td>
                            <td className="border border-gray-300 px-3 py-2">$96,450</td>
                            <td className="border border-gray-300 px-3 py-2">$8,038</td>
                            <td className="border border-gray-300 px-3 py-2">$4,019</td>
                            <td className="border border-gray-300 px-3 py-2">$3,710</td>
                            <td className="border border-gray-300 px-3 py-2">$1,855</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">5</td>
                            <td className="border border-gray-300 px-3 py-2">$112,950</td>
                            <td className="border border-gray-300 px-3 py-2">$9,413</td>
                            <td className="border border-gray-300 px-3 py-2">$4,706</td>
                            <td className="border border-gray-300 px-3 py-2">$4,344</td>
                            <td className="border border-gray-300 px-3 py-2">$2,172</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">6</td>
                            <td className="border border-gray-300 px-3 py-2">$129,450</td>
                            <td className="border border-gray-300 px-3 py-2">$10,788</td>
                            <td className="border border-gray-300 px-3 py-2">$5,394</td>
                            <td className="border border-gray-300 px-3 py-2">$4,979</td>
                            <td className="border border-gray-300 px-3 py-2">$2,489</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">7</td>
                            <td className="border border-gray-300 px-3 py-2">$145,950</td>
                            <td className="border border-gray-300 px-3 py-2">$12,163</td>
                            <td className="border border-gray-300 px-3 py-2">$6,081</td>
                            <td className="border border-gray-300 px-3 py-2">$5,613</td>
                            <td className="border border-gray-300 px-3 py-2">$2,807</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">8</td>
                            <td className="border border-gray-300 px-3 py-2">$162,450</td>
                            <td className="border border-gray-300 px-3 py-2">$13,538</td>
                            <td className="border border-gray-300 px-3 py-2">$6,769</td>
                            <td className="border border-gray-300 px-3 py-2">$6,248</td>
                            <td className="border border-gray-300 px-3 py-2">$3,124</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 font-semibold">For each additional family member add:</td>
                            <td className="border border-gray-300 px-3 py-2">$16,500</td>
                            <td className="border border-gray-300 px-3 py-2">$1,375</td>
                            <td className="border border-gray-300 px-3 py-2">$688</td>
                            <td className="border border-gray-300 px-3 py-2">$635</td>
                            <td className="border border-gray-300 px-3 py-2">$317</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Personal Information Section - TEFAP Format */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Applicant Information
                  </h3>

                  {/* Name - Full name on one line */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        {...register("firstName")}
                        className="block w-full rounded-lg border border-gray-300 py-3 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="First name"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="middleName"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Middle Name
                      </label>
                      <input
                        id="middleName"
                        type="text"
                        {...register("middleName")}
                        className="block w-full rounded-lg border border-gray-300 py-3 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Middle name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        {...register("lastName")}
                        className="block w-full rounded-lg border border-gray-300 py-3 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Last name"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Number of People and County on same row */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="totalIndividuals"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Number of People in Household <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="totalIndividuals"
                        type="number"
                        min="1"
                        {...register("totalIndividuals", { valueAsNumber: true })}
                        className="block w-full rounded-lg border border-gray-300 py-3 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Number of individuals"
                      />
                      {errors.totalIndividuals && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.totalIndividuals.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="county"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        County
                      </label>
                      <input
                        id="county"
                        type="text"
                        {...register("county")}
                        className="block w-full rounded-lg border border-gray-300 py-3 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="County"
                      />
                      {errors.county && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.county.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Address Information
                  </h3>

                  {/* Homeless Checkbox */}
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="isHomeless"
                        type="checkbox"
                        {...register("isHomeless")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="isHomeless" className="text-sm font-medium text-gray-700">
                        Homeless (No residence)
                      </label>
                      <p className="text-xs text-gray-500">
                        Check this box if you do not have a permanent address
                      </p>
                    </div>
                  </div>

                  {/* Conditional Address Fields - Only show if NOT homeless */}
                  {!isHomeless && (
                    <div className="space-y-4">
                      {/* Street Address */}
                      <div>
                        <label
                          htmlFor="address"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Street Address
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Home className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            id="address"
                            type="text"
                            {...register("address")}
                            className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="123 Main Street"
                          />
                        </div>
                        {errors.address && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.address.message}
                          </p>
                        )}
                      </div>

                      {/* Apartment/Suite */}
                      <div>
                        <label
                          htmlFor="apartmentSuite"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Apartment/Suite <span className="text-gray-400">(Optional)</span>
                        </label>
                        <input
                          id="apartmentSuite"
                          type="text"
                          {...register("apartmentSuite")}
                          className="block w-full rounded-lg border border-gray-300 py-3 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Apt 4B"
                        />
                        {errors.apartmentSuite && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.apartmentSuite.message}
                          </p>
                        )}
                      </div>

                      {/* City/Town and State/Province */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label
                            htmlFor="cityTown"
                            className="mb-2 block text-sm font-medium text-gray-700"
                          >
                            City/Town
                          </label>
                          <input
                            id="cityTown"
                            type="text"
                            {...register("cityTown")}
                            className="block w-full rounded-lg border border-gray-300 py-3 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Tampa"
                          />
                          {errors.cityTown && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.cityTown.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="stateProvince"
                            className="mb-2 block text-sm font-medium text-gray-700"
                          >
                            State/Province
                          </label>
                          <input
                            id="stateProvince"
                            type="text"
                            {...register("stateProvince")}
                            className="block w-full rounded-lg border border-gray-300 py-3 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="FL"
                          />
                          {errors.stateProvince && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.stateProvince.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Country */}
                      <div>
                        <label
                          htmlFor="country"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Country
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            id="country"
                            type="text"
                            {...register("country")}
                            className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="United States"
                          />
                        </div>
                        {errors.country && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.country.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Zip Code - Always visible */}
                  <div>
                    <label
                      htmlFor="zipPostalCode"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Zip/Postal Code
                    </label>
                    <input
                      id="zipPostalCode"
                      type="text"
                      {...register("zipPostalCode")}
                      className="block w-full rounded-lg border border-gray-300 py-3 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="33602"
                    />
                    {errors.zipPostalCode && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.zipPostalCode.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Contact Information
                  </h3>

                  {/* Phone Number */}
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="phoneNumber"
                        type="tel"
                        {...register("phoneNumber")}
                        className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      You'll receive an SMS confirmation at this number
                    </p>
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Email Address <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        {...register("email")}
                        className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Eligibility Information Section - TEFAP Format */}
                <div className="space-y-6">
                  <div>
                    <p className="mb-4 text-sm text-gray-700">
                      You are eligible to receive food from TEFAP if your household meets the income guidelines above or participates in any of the following programs. Please place a checkmark in the space next to the category that applies.
                    </p>
                  </div>

                  <div className="space-y-3 rounded-lg border border-gray-300 bg-gray-50 p-4">
                    {/* Income Eligibility */}
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="incomeEligibility"
                          type="checkbox"
                          {...register("incomeEligibility")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="incomeEligibility" className="text-sm font-medium text-gray-700">
                          Income eligibility
                        </label>
                      </div>
                    </div>

                    {/* SNAP */}
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="snap"
                          type="checkbox"
                          {...register("snap")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="snap" className="text-sm font-medium text-gray-700">
                          Supplemental Nutrition Assistance Program (SNAP) (aka Food Stamps)
                        </label>
                      </div>
                    </div>

                    {/* TANF */}
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="tanf"
                          type="checkbox"
                          {...register("tanf")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="tanf" className="text-sm font-medium text-gray-700">
                          Temporary Assistance to Needy Families (TANF)
                        </label>
                      </div>
                    </div>

                    {/* SSI */}
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="ssi"
                          type="checkbox"
                          {...register("ssi")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="ssi" className="text-sm font-medium text-gray-700">
                          Supplemental Security Income (SSI)
                        </label>
                      </div>
                    </div>

                    {/* Medicaid */}
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="medicaid"
                          type="checkbox"
                          {...register("medicaid")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="medicaid" className="text-sm font-medium text-gray-700">
                          Medicaid
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Income Salary Field */}
                  <div>
                    <label
                      htmlFor="incomeSalary"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Annual Income/Salary <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="incomeSalary"
                        type="number"
                        min="0"
                        step="1"
                        {...register("incomeSalary", { valueAsNumber: true })}
                        className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter annual income"
                      />
                    </div>
                    {errors.incomeSalary && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.incomeSalary.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your total annual household income
                    </p>
                  </div>
                </div>

                {/* Alternate Pickup Person */}
                <div>
                  <label
                    htmlFor="alternatePickupPerson"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Alternate Pick-up Person <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    id="alternatePickupPerson"
                    type="text"
                    {...register("alternatePickupPerson")}
                    className="block w-full rounded-lg border border-gray-300 py-3 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name of person authorized to pick up"
                  />
                  {errors.alternatePickupPerson && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.alternatePickupPerson.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    If someone else will be picking up on your behalf
                  </p>
                </div>

                {/* Certification Statement */}
                <div className="space-y-6 rounded-lg border-2 border-gray-300 bg-yellow-50 p-6">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-gray-900">
                      The Local Distributing Agency staff must check this box, after the applicant has read the below certification statement:
                    </p>
                    <div className="rounded-lg border border-gray-300 bg-white p-4">
                      <p className="mb-4 text-sm text-gray-700">
                        I certify, by self attesting, that my yearly household gross income is at or below the income listed on this form for households with the same number of people OR that I participate in the program(s) that I have checked on this form. I also certify that as of today, I reside in the State of Florida. This certification is being submitted in connection with the receipt of Federal assistance. I understand that making a false certification may result in having to pay the State agency for the value of the food improperly issued to me and may subject me to civil or criminal prosecution under State and Federal law.
                      </p>
                      <p className="mb-4 text-sm text-gray-700">
                        <strong>OPTIONAL:</strong> I authorize <span className="inline-block w-48 border-b border-gray-400">{watch("alternatePickupPerson") || ""}</span> to pick up USDA foods on my behalf.
                      </p>
                      <p className="text-sm text-gray-700">
                        Any changes in the household's circumstances must be reported to the distributing agency immediately.
                      </p>
                    </div>
                  </div>

                  {/* Digital Signature */}
                  <div>
                    <label
                      htmlFor="digitalSignature"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Digital Signature (Type your full name) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="digitalSignature"
                      type="text"
                      {...register("digitalSignature")}
                      className="block w-full rounded-lg border border-gray-300 bg-white py-3 px-3 font-serif text-lg italic focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Type your full name here"
                    />
                    {errors.digitalSignature && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.digitalSignature.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      By typing your name, you are digitally signing this certification
                    </p>
                  </div>
                </div>

                {/* USDA Non-Discrimination Statement */}
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
                  <p className="mb-4 text-xs text-gray-600">
                    In accordance with federal civil rights law and U.S. Department of Agriculture (USDA) civil rights regulations and policies, this institution is prohibited from discriminating on the basis of race, color, national origin, sex, disability, age, or reprisal or retaliation for prior civil rights activity.
                  </p>
                  <p className="mb-4 text-xs text-gray-600">
                    Program information may be made available in languages other than English. Persons with disabilities who require alternative means of communication to obtain program information (e.g., Braille, large print, audiotape, American Sign Language), should contact the responsible state or local agency that administers the program or USDA's TARGET Center at (202) 720-2600 (voice and TTY) or contact USDA through the Federal Relay Service at (800) 877-8339.
                  </p>
                  <p className="mb-4 text-xs text-gray-600">
                    To file a program discrimination complaint, a Complainant should complete a Form AD-3027, USDA Program Discrimination Complaint Form, which can be obtained online at: https://www.usda.gov/sites/default/files/documents/USDA-OASCR%20P-Complaint-Form-0508-0002-508-11-28-17Fax2Mail.pdf, from any USDA office, by calling (866) 632-9992, or by writing a letter addressed to USDA. The letter must contain the complainant's name, address, telephone number, and a written description of the alleged discriminatory action in sufficient detail to inform the Assistant Secretary for Civil Rights (ASCR) about the nature and date of an alleged civil rights violation. The completed AD-3027 form or letter must be submitted to USDA by:
                  </p>
                  <ol className="mb-4 ml-6 list-decimal text-xs text-gray-600">
                    <li>mail: U.S. Department of Agriculture Office of the Assistant Secretary for Civil Rights 1400 Independence Avenue, SW Washington, D.C. 20250-9410; or</li>
                    <li>fax: (833) 256-1665 or (202) 690-7442; or</li>
                    <li>email: program.intake@usda.gov</li>
                  </ol>
                  <p className="text-xs font-semibold text-gray-700">
                    This institution is an equal opportunity provider.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    registerMutation.isPending || 
                    (!session && (!availableEvents || availableEvents.length === 0))
                  }
                  className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {registerMutation.isPending ? "Registering..." : "Complete Registration"}
                </button>
              </form>
            </div>
          </div>

          {/* Event Info Sidebar */}
          <div className="space-y-6">
            {selectedEvent && (
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-bold text-gray-900">
                  Event Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Event Name</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedEvent.name}</p>
                  </div>
                  {selectedEvent.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Description</p>
                      <p className="mt-1 text-gray-700">{selectedEvent.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Availability</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Registered</span>
                        <span className="font-semibold">{selectedEvent.registeredCount} / {selectedEvent.availableBags}</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{
                            width: `${(selectedEvent.registeredCount / selectedEvent.availableBags) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-sm font-medium text-green-600">
                        {selectedEvent.remainingBags} bags remaining
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-blue-50 p-6">
              <h3 className="mb-3 flex items-center space-x-2 font-bold text-gray-900">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span>What to Expect</span>
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5 text-blue-600">•</span>
                  <span>SMS confirmation with order number</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5 text-blue-600">•</span>
                  <span>One registration per 14 days</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5 text-blue-600">•</span>
                  <span>Present order number at pickup</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="mt-0.5 text-blue-600">•</span>
                  <span>Free nutritious food packages</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
