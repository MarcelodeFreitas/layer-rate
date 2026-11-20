import type { LayerRateQuoteResult } from "layer-rate-core";
import { formatMoney } from "../lib/quote";

export function BreakdownTable(props: { result: LayerRateQuoteResult; currency: string; quantity: number }) {
  const { result, currency, quantity } = props;
  const q = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

  const rows: { label: string; perJob: number; allJobs: number; bold?: boolean }[] = [
    { label: "Material", perJob: result.perJob.material, allJobs: result.allJobs.material },
    { label: "Printer power", perJob: result.perJob.printerPower, allJobs: result.allJobs.printerPower },
    { label: "Machine time", perJob: result.perJob.runtime, allJobs: result.allJobs.runtime },
    { label: "Machine maintenance", perJob: result.perJob.machineMaintenanceSurcharge, allJobs: result.allJobs.machineMaintenanceSurcharge },
    { label: "Operations", perJob: result.perJob.operations, allJobs: result.allJobs.operations },
    { label: "Post-processing", perJob: result.perJob.postProcessing, allJobs: result.allJobs.postProcessing },
    { label: "Setup", perJob: result.perJob.setup, allJobs: result.allJobs.setup },
    { label: "Design", perJob: result.perJob.design, allJobs: result.allJobs.design },
    { label: "Components", perJob: result.perJob.components, allJobs: result.allJobs.components },
    { label: "Failed prints", perJob: result.perJob.failedJobSurcharge, allJobs: result.allJobs.failedJobSurcharge },
    { label: "Total cost", perJob: result.totalCostPerJob, allJobs: result.productionCostAllJobs, bold: true },
    { label: "Profit", perJob: result.totalProfitAllJobs / q, allJobs: result.totalProfitAllJobs, bold: true },
    { label: "Tax", perJob: result.tax / q, allJobs: result.tax, bold: true },
    { label: "Customer price", perJob: result.perJobCustomerPrice, allJobs: result.customerPriceAllJobs, bold: true },
  ];

  return (
    <table>
      <caption>Price breakdown</caption>
      <thead>
        <tr>
          <th>Item</th>
          <th className="num">Per job</th>
          <th className="num">All jobs</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} style={row.bold ? { fontWeight: 600 } : undefined}>
            <th scope="row">{row.label}</th>
            <td className="num">{formatMoney(row.perJob, currency)}</td>
            <td className="num">{formatMoney(row.allJobs, currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
