export interface BillRow {
  billReference: string;
  customerName: string | null;
  amount: number;
  period: string;
  dueDate: Date;
  billerId: string;
  status: string;
  currency: string;
}

export class CsvMapper {
//    Transforms a raw CSV row into a standardized Bill object.
   
  static toBill(
    row: any,
    targetBillerId: string,
    uiFallback: { period?: string; dueDate: Date | null },
  ): { bill: Partial<BillRow> | null; errors: string[] } {
    const errors: string[] = [];

    // 1. Normalize Headers (The "Smart" Logic)
    const billReference = (
      row.billReference ||
      row.customerReference ||
      row.reference ||
      row.BillRef ||
      row.bill_ref
    )
      ?.toString()
      .trim();
    const amountRaw = row.amount || row.Amount || row.Value || row.Total;
    const csvPeriod = (row.period || row.Period || row.Month)
      ?.toString()
      .trim();
    const csvDueDateRaw = (
      row.due_date ||
      row.DueDate ||
      row.Due_Date ||
      row.Expiry ||
      row.dueDate
    )
      ?.toString()
      .trim();
    const customerName =
      (row.customerName || row.Customer || row.Name)?.toString().trim() || null;
    
    const parseSafeDate = (val: any): Date | null => {
      if (!val) return null;
      if (val instanceof Date) return val;

      // If it's a number (Excel Serial), convert it
      if (typeof val === "number") {
        return new Date((val - (25567 + 2)) * 86400 * 1000);
      }

      // If it's a string, try parsing
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    // 2. Resolve Fallbacks
    const finalPeriod = csvPeriod || uiFallback.period;
    let finalDueDate: Date | null = csvDueDateRaw
      ? new Date(csvDueDateRaw)
      : uiFallback.dueDate;

    // 3. Validation Logic
    if (!billReference) errors.push("Missing Reference");

    const amount = parseFloat(amountRaw?.toString().replace(/[^0-9.-]+/g, ""));
    if (isNaN(amount)) errors.push("Invalid Amount");
    if (amount <= 0) errors.push("Amount must be > 0");

    if (!finalPeriod) errors.push("Missing Period");
    if (!finalDueDate || isNaN(finalDueDate.getTime()))
      errors.push("Invalid Due Date");

    if (errors.length > 0) return { bill: null, errors };

    return {
      bill: {
        billReference,
        customerName,
        amount,
        period: finalPeriod,
        dueDate: finalDueDate!,
        billerId: targetBillerId,
        status: "UNPAID",
        currency: "ETB",
      },
      errors: [],
    };
  }
}
