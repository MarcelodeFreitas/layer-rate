import type { LayerRateQuoteResult, QuoteCostBreakdown } from "layer-rate-core";

export function formatQuoteTable(result: LayerRateQuoteResult): string {
  const lines: string[] = [
    "LayerRate Quote",
    "",
    "Summary",
    row("Per job customer price", result.perJobCustomerPrice),
    row("Customer price (all jobs)", result.customerPriceAllJobs),
    row("Base customer price", result.baseCustomerPriceAllJobs),
    row("Production cost (all jobs)", result.productionCostAllJobs),
    row("Seller receives", result.sellerReceivesAllJobs),
    row("Total profit", result.totalProfitAllJobs),
    row("Recoverable fees", result.recoverableFees),
    row("Add-on fees", result.addOnTopFees),
    row("Tax", result.tax),
    "",
    "Per-job breakdown",
    ...breakdownRows(result.perJob),
    "",
    "All-jobs breakdown",
    ...breakdownRows(result.allJobs),
    "",
    "Materials",
    ...result.materials.map((material, index) => {
      const label = material.name ?? `Material ${index + 1}`;
      return row(`${label} (${formatNumber(material.amountGrams)}g)`, material.cost);
    }),
    "",
    "Normalized values",
    row("Print hours", result.printHours),
    row("Printer lifetime hours", result.printerLifetimeHours),
  ];

  if (result.fees.recoverable.length > 0 || result.fees.addOnTop.length > 0) {
    lines.push("", "Fees");

    for (const fee of [...result.fees.recoverable, ...result.fees.addOnTop]) {
      lines.push(row(`${fee.name} (${fee.behavior})`, fee.amount));
    }
  }

  return lines.join("\n");
}

function breakdownRows(breakdown: QuoteCostBreakdown): string[] {
  return [
    row("Material", breakdown.material),
    row("Printer power", breakdown.printerPower),
    row("Runtime depreciation", breakdown.runtime),
    row("Operations labor", breakdown.operations),
    row("Post-processing labor", breakdown.postProcessing),
    row("Failed job surcharge", breakdown.failedJobSurcharge),
    row("Machine maintenance", breakdown.machineMaintenanceSurcharge),
    row("Design", breakdown.design),
    row("Setup", breakdown.setup),
    row("Components", breakdown.components),
  ];
}

function row(label: string, value: number): string {
  return `${label.padEnd(32)} ${formatNumber(value)}`;
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}
