import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatDisplayDate } from "@/lib/mock-library-api";
import { TabAssetData, EmptyStateRow, SubmitBar } from "./TransactionTabs";

export const RenewTab = ({
  assetData,
  loading,
  renewMutation,
  onSubmitRenew,
  hasDueCharges,
}: {
  assetData?: TabAssetData | null;
  loading?: boolean;
  renewMutation: any;
  onSubmitRenew: (totalDueCharges: number, createInvoice: number) => void;
  hasDueCharges?: boolean;
}) => {
  const md = assetData?.member_details;
  const submitDisabled = !assetData || !md || renewMutation.isPending || hasDueCharges;
  const [totalDueCharges, setTotalDueCharges] = useState(0);
  const [createInvoice, setCreateInvoice] = useState(1);
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setTotalDueCharges(assetData?.total_due_charges || 0);
  }, [assetData]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="section-frame flex gap-3 ">
          <div>
            <p className="section-heading">Issue Date</p>
            {md?.transaction_date ? <p className="mt-1 text-sm text-foreground">{formatDisplayDate(md.transaction_date)}</p> : <p className="mt-1 text-sm text-foreground">--</p>}
          </div>
          <div>
            <p className="section-heading">Return Date</p>
            <Input
              type="date"
              className="mt-1 w-auto"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
          <div>
            <p className="section-heading">Due Date</p>
            {md?.due_date ? <p className="mt-1 text-sm text-foreground">{formatDisplayDate(md.due_date)}</p> : <p className="mt-1 text-sm text-foreground">--</p>}
          </div>
        </div>
        <div>
          <p className="section-heading">Renew transaction</p>
          <p className="mt-1 text-sm text-muted-foreground">Review queued books before renewing.</p>
        </div>
        <div className="table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Access No</TableHead>
                <TableHead>Book Title</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Previous Due Date</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Due Charges</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto animate-spin" />
                  </TableCell>
                </TableRow>
              ) : assetData && md ? (
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>{assetData.asset_id}</TableCell>
                  <TableCell className="font-medium text-foreground">{assetData.asset_name}</TableCell>
                  <TableCell>{formatDisplayDate(md.transaction_date)}</TableCell>
                  <TableCell>{formatDisplayDate(md.due_date)}</TableCell>
                  <TableCell>{formatDisplayDate(returnDate)}</TableCell>
                  <TableCell>{md?.due_date ? formatDisplayDate(md.due_date) : "—"}</TableCell>
                  <TableCell>{assetData.total_due_charges ?? 0}</TableCell>
                </TableRow>
              ) : (
                <EmptyStateRow message="Scan a barcode above and click Renew tab to load transaction." colSpan={8} />
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="flex justify-end gap-4">
        <div className="flex items-center justify-end gap-4 py-4">
          <label className="text-sm font-medium">Total Due Charges</label>
          <Input
            type="number"
            value={totalDueCharges}
            onChange={(e) => setTotalDueCharges(Number(e.target.value))}
            className="w-32"
          />
        </div>
        <div className="flex items-center justify-end gap-2 py-4">
          <Switch
            id="createInvoiceCheckbox"
            checked={createInvoice === 1}
            onCheckedChange={(checked) => setCreateInvoice(checked ? 1 : 0)}
          />
          <label htmlFor="createInvoiceCheckbox" className="text-sm font-medium">Create Invoice</label>
        </div>
      </div>
      <SubmitBar
        disabled={submitDisabled}
        loading={renewMutation.isPending}
        label="Submit Renew"
        onClick={() => onSubmitRenew(totalDueCharges, createInvoice)}
      />
    </div>
  );
};

export default RenewTab;
