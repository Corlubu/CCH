// src/routes/admin/reports/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
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

function RegistrationsReportPage() {
  const trpc = useTRPC();
  const { token } = useAuthStore(); // ajusta el nombre del campo si tu store usa otro

  const [filters, setFilters] = useState<Filters>({});
  const [appliedFilters, setAppliedFilters] = useState<Filters>({});

  const { data: events } = useQuery(
    trpc.listEventsForReport.queryOptions({ authToken: token! }),
  );

  const { data: registrations, isLoading } = useQuery(
    trpc.getRegistrationsReport.queryOptions({
      authToken: token!,
      ...appliedFilters,
    }),
  );

  const selectedEventName = events?.find(
    (e) => e.id === appliedFilters.eventId,
  )?.name;

  const handleExport = (mode: "html" | "pdf") => {
    if (!registrations || registrations.length === 0) return;
    const html = buildReportHtml(registrations, {
      eventName: selectedEventName,
      phoneNumber: appliedFilters.phoneNumber,
      name: appliedFilters.name,
    });
    mode === "html" ? exportAsHtml(html) : exportAsPdf(html);
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">
        Reporte de registros de ciudadanos
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
          <option value="">Todos los eventos</option>
          {events?.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} — {new Date(ev.startDatetime).toLocaleDateString()}
            </option>
          ))}
        </select>

        <input
          className="rounded border p-2"
          placeholder="Teléfono"
          value={filters.phoneNumber ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, phoneNumber: e.target.value }))
          }
        />

        <input
          className="rounded border p-2"
          placeholder="Nombre o apellido"
          value={filters.name ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
        />

        <button
          onClick={() => setAppliedFilters(filters)}
          className="flex items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Search className="h-4 w-4" /> Buscar
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {isLoading
            ? "Cargando..."
            : `${registrations?.length ?? 0} registro(s) encontrado(s)`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("html")}
            disabled={!registrations?.length}
            className="flex items-center gap-2 rounded border px-3 py-2 text-sm disabled:opacity-40"
          >
            <FileText className="h-4 w-4" /> Exportar HTML
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={!registrations?.length}
            className="flex items-center gap-2 rounded border px-3 py-2 text-sm disabled:opacity-40"
          >
            <Download className="h-4 w-4" /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Orden</th>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Teléfono</th>
              <th className="p-2 text-left">Evento</th>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Check-in</th>
            </tr>
          </thead>
          <tbody>
            {registrations?.map((r) => (
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
    </div>
  );
}

// ---- Generación del documento y exportación ----

function buildReportHtml(
  registrations: any[],
  filters: { eventName?: string; phoneNumber?: string; name?: string },
) {
  const generatedAt = new Date().toLocaleString("es-US");
  const filterSummary =
    [
      filters.eventName ? `Evento: ${filters.eventName}` : null,
      filters.phoneNumber ? `Teléfono: ${filters.phoneNumber}` : null,
      filters.name ? `Nombre: ${filters.name}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Sin filtros aplicados";

  const recordsHtml = registrations
    .map(
      (r, idx) => `
    <section class="record">
      <div class="record-header">
        <span>Registro ${idx + 1} de ${registrations.length}</span>
        <span>Orden: ${r.orderNumber}</span>
      </div>
      <table class="record-table">
        <tr><th>Nombre completo</th><td>${r.firstName} ${r.middleName ?? ""} ${r.lastName}</td></tr>
        <tr><th>Teléfono</th><td>${r.phoneNumber}</td></tr>
        <tr><th>Email</th><td>${r.email ?? "—"}</td></tr>
        <tr><th>Evento</th><td>${r.event.name}</td></tr>
        <tr><th>Fecha de registro</th><td>${new Date(r.registrationDate).toLocaleString("es-US")}</td></tr>
        <tr><th>Dirección</th><td>${
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
        <tr><th>Total de individuos</th><td>${r.totalIndividuals}</td></tr>
        <tr><th>¿Sin hogar?</th><td>${r.isHomeless ? "Sí" : "No"}</td></tr>
        <tr><th>Check-in</th><td>${
          r.checkedIn
            ? `Sí (${r.checkedInAt ? new Date(r.checkedInAt).toLocaleString("es-US") : ""})`
            : "No"
        }</td></tr>
        <tr><th>Registrado por</th><td>${r.registeredBy}</td></tr>
      </table>
    </section>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8" /><title>Reporte de registros — CCH</title>
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
  .record-table th { text-align: left; width: 180px; padding: 4px 8px; color: #4b5563; vertical-align: top; }
  .record-table td { padding: 4px 8px; }
</style></head>
<body>
  <h1>Reporte de registros de ciudadanos</h1>
  <div class="meta">Generado: ${generatedAt} · ${filterSummary} · Total: ${registrations.length}</div>
  ${recordsHtml}
</body></html>`;
}

function exportAsHtml(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-registros-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAsPdf(html: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor permite las ventanas emergentes para exportar a PDF.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print(); // el usuario elige "Guardar como PDF" en el diálogo de impresión
  };
}
