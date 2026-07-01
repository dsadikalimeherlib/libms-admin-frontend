import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatDisplayDate } from "@/lib/mock-library-api";
import { TabAssetData, EmptyStateRow, SubmitBar } from "./TransactionTabs";

export const ReturnTab = ({
  assetData,
  loading,
  returnMutation,
  onSubmitReturn,
}: {
  assetData?: TabAssetData | null;
  loading?: boolean;
  returnMutation: any;
  onSubmitReturn: (totalDueCharges: number) => void;
}) => {
  const md = assetData?.member_details;
  const submitDisabled = !assetData || !md || returnMutation.isPending;
  const [totalDueCharges, setTotalDueCharges] = useState(0);

  useEffect(() => {
    setTotalDueCharges(assetData?.total_due_charges || 0);
  }, [assetData]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <p className="section-heading">Return transaction</p>
          <p className="mt-1 text-sm text-muted-foreground">Review queued books before returning.</p>
        </div>
        <div className="table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Access No</TableHead>
                <TableHead>Book Title</TableHead>
                <TableHead>Transaction Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Due Charges</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
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
                  <TableCell>{formatDisplayDate(new Date().toISOString())}</TableCell>
                  <TableCell>{assetData.total_due_charges ?? 0}</TableCell>
                </TableRow>
              ) : (
                <EmptyStateRow message="Scan a barcode above and click Return tab to load transaction." colSpan={7} />
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="flex items-center justify-end gap-4 py-4 md:ml-auto">
        <label className="text-sm font-medium">Total Due Charges</label>
        <Input
          type="number"
          value={totalDueCharges}
          onChange={(e) => setTotalDueCharges(Number(e.target.value))}
          className="w-32"
        />
      </div>
      <SubmitBar
        disabled={submitDisabled}
        loading={returnMutation.isPending}
        label="Submit Return"
        onClick={() => onSubmitReturn(totalDueCharges)}
      />
    </div>
  );
};

export default ReturnTab;
