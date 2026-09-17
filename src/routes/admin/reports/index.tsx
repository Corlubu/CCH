// src/routes/admin/reports/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useTRPC } from "~/trpc/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/authStore";
import { useState } from "react";
import { Search, FileText, Download } from "lucide-react";

export const Route = createFileRoute("/admin/reports/")({
  component: RegistrationsReportPage,
});

interface Filters {
  eventId?: number;
  phoneNumber?: string;
  name?: string;
}

const PAGE_SIZE = 25;

function RegistrationsReportPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { token } = useAuthStore(); // ajusta el nombre del campo si tu store usa otro

  const [filters, setFilters] = useState<Filters>({});
  const [appliedFilters, setAppliedFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const { data: events } = useQuery(
    trpc.listEventsForReport.queryOptions({ authToken: token! }),
  );

  const { data: reportData, isLoading } = useQuery(
    trpc.getRegistrationsReport.queryOptions({
      authToken: token!,
      ...appliedFilters,
      page,
      pageSize: PAGE_SIZE,
    }),
  );

  const registrations = reportData?.registrations ?? [];
  const totalPages = reportData?.totalPages ?? 1;
  const totalCount = reportData?.totalCount ?? 0;
  const selectedEventName = events?.find(
    (e) => e.id === appliedFilters.eventId,
  )?.name;

  const handleSearch = () => {
    setAppliedFilters(filters);
    setPage(1); // vuelve a la página 1 en cada búsqueda nueva
  };

  const handleExport = async (mode: "html" | "pdf") => {
    setIsExporting(true);
    try {
      const result = await queryClient.fetchQuery(
        trpc.getRegistrationsReport.queryOptions({
          authToken: token!,
          ...appliedFilters,
          page: 1,
          pageSize: 2000, // trae TODO lo que cumple el filtro, no solo la página visible
        }),
      );
      const html = buildReportHtml(result.registrations, {
        eventName: selectedEventName,
        phoneNumber: appliedFilters.phoneNumber,
        name: appliedFilters.name,
      });
      mode === "html" ? exportAsHtml(html) : exportAsPdf(html);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">
        Registration Report / Reporte de Registros
      </h1>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-4">
        <select
          className="rounded border p-2"
          value={filters.eventId ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              eventId: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
        >
          <option value="">All events / Todos los eventos</option>
          {events?.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} — {new Date(ev.startDatetime).toLocaleDateString()}
            </option>
          ))}
        </select>

        <input
          className="rounded border p-2"
          placeholder="Phone / Teléfono"
          value={filters.phoneNumber ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, phoneNumber: e.target.value }))
          }
        />

        <input
          className="rounded border p-2"
          placeholder="Name / Nombre"
          value={filters.name ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
        />

        <button
          onClick={handleSearch}
          className="flex items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Search className="h-4 w-4" /> Search / Buscar
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {isLoading
            ? "Loading... / Cargando..."
            : `${totalCount} result(s) / resultado(s)`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("html")}
            disabled={isExporting || totalCount === 0}
            className="flex items-center gap-2 rounded border px-3 py-2 text-sm disabled:opacity-40"
          >
            <FileText className="h-4 w-4" />{" "}
            {isExporting ? "..." : "Export HTML"}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={isExporting || totalCount === 0}
            className="flex items-center gap-2 rounded border px-3 py-2 text-sm disabled:opacity-40"
          >
            <Download className="h-4 w-4" />{" "}
            {isExporting ? "..." : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Order / Orden</th>
              <th className="p-2 text-left">Name / Nombre</th>
              <th className="p-2 text-left">Phone / Teléfono</th>
              <th className="p-2 text-left">Event / Evento</th>
              <th className="p-2 text-left">Date / Fecha</th>
              <th className="p-2 text-left">Check-in</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.orderNumber}</td>
                <td className="p-2">
                  {r.firstName} {r.lastName}
                </td>
                <td className="p-2">{r.phoneNumber}</td>
                <td className="p-2">{r.event.name}</td>
                <td className="p-2">
                  {new Date(r.registrationDate).toLocaleDateString()}
                </td>
                <td className="p-2">{r.checkedIn ? "✅" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Page / Página {page} of/de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            Previous / Anterior
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next / Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Generación del documento y exportación ----

function buildReportHtml(
  registrations: any[],
  filters: { eventName?: string; phoneNumber?: string; name?: string },
) {
  const generatedAt = new Date().toLocaleString("en-US");
  const filterSummary =
    [
      filters.eventName ? `Event/Evento: ${filters.eventName}` : null,
      filters.phoneNumber ? `Phone/Teléfono: ${filters.phoneNumber}` : null,
      filters.name ? `Name/Nombre: ${filters.name}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "No filters applied / Sin filtros aplicados";

  const recordsHtml = registrations
    .map(
      (r, idx) => `
    <section class="record">
      <div class="record-header">
        <span>Record / Registro ${idx + 1} of/de ${registrations.length}</span>
        <span>Order / Orden: ${r.orderNumber}</span>
      </div>
      <table class="record-table">
        <tr><th>Full name / Nombre completo</th><td>${r.firstName} ${r.middleName ?? ""} ${r.lastName}</td></tr>
        <tr><th>Phone / Teléfono</th><td>${r.phoneNumber}</td></tr>
        <tr><th>Email / Correo</th><td>${r.email ?? "—"}</td></tr>
        <tr><th>Event / Evento</th><td>${r.event.name}</td></tr>
        <tr><th>Registration date / Fecha de registro</th><td>${new Date(r.registrationDate).toLocaleString("en-US")}</td></tr>
        <tr><th>Address / Dirección</th><td>${
          [
            r.address,
            r.apartmentSuite,
            r.cityTown,
            r.stateProvince,
            r.zipPostalCode,
          ]
            .filter(Boolean)
            .join(", ") || "—"
        }</td></tr>
        <tr><th>Total individuals / Total de individuos</th><td>${r.totalIndividuals}</td></tr>
        <tr><th>Homeless? / ¿Sin hogar?</th><td>${r.isHomeless ? "Yes / Sí" : "No"}</td></tr>
        <tr><th>Checked in / Check-in</th><td>${
          r.checkedIn
            ? `Yes / Sí (${r.checkedInAt ? new Date(r.checkedInAt).toLocaleString("en-US") : ""})`
            : "No"
        }</td></tr>
        <tr><th>Registered by / Registrado por</th><td>${r.registeredBy}</td></tr>
      </table>
    </section>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><title>Registration Report / Reporte de Registros — CCH</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; color: #1f2937; margin: 0; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
  .record {
    border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin-bottom: 20px;
    page-break-after: always; break-inside: avoid;
  }
  .record:last-child { page-break-after: auto; }
  .record-header {
    display: flex; justify-content: space-between; font-weight: 600;
    margin-bottom: 10px; border-bottom: 2px solid #2563eb; padding-bottom: 6px;
  }
  .record-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .record-table th { text-align: left; width: 220px; padding: 4px 8px; color: #4b5563; vertical-align: top; }
  .record-table td { padding: 4px 8px; }
</style></head>
<body>
  <h1>Registration Report / Reporte de Registros</h1>
  <div class="meta">Generated/Generado: ${generatedAt} · ${filterSummary} · Total: ${registrations.length}</div>
  ${recordsHtml}
</body></html>`;
}

function exportAsHtml(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAsPdf(html: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert(
      "Please allow pop-ups to export as PDF. / Por favor permite las ventanas emergentes para exportar a PDF.",
    );
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
