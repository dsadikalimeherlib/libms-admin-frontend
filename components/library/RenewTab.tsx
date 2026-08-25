import { useEffect, useState } from "react";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatDisplayDate } from "@/lib/mock-library-api";
import { TabAssetData, EmptyStateRow, SubmitBar } from "./TransactionTabs";

export const RenewTab = ({
  assetData,
  setTabAssetData,
  loading,
  renewMutation,
  onSubmitRenew,
  hasDueCharges,
}: {
  assetData?: TabAssetData | null;
  setTabAssetData: (data: TabAssetData | null) => void;
  loading?: boolean;
  renewMutation: any;
  onSubmitRenew: (totalDueCharges: number, createInvoice: number) => void;
  hasDueCharges?: boolean;
}) => {
  const md = assetData?.member_details;
  const submitDisabled = !assetData || !md || renewMutation.isPending || hasDueCharges;
  const [totalDueCharges, setTotalDueCharges] = useState(0);
  const [createInvoice, setCreateInvoice] = useState(1);
  const [returnDate, setReturnDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    setTotalDueCharges(assetData?.total_due_charges || 0);
    if (!assetData) {
      setReturnDate(format(new Date(), "yyyy-MM-dd"));
    }
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
            {assetData ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="renewDateInput"
                    variant={"outline"}
                    className={cn(
                      "mt-1 w-auto justify-start text-left font-normal",
                      !returnDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {returnDate ? (
                      format(new Date(returnDate), "dd/MM/yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={returnDate ? new Date(returnDate) : undefined}
                    onSelect={(date) => {
                      if (!date) return;
                      setReturnDate(format(date, "yyyy-MM-dd"));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <p className="mt-1 text-sm text-foreground">--</p>
            )}
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
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
                  <TableCell>
                    <button
                      type="button"
                      className="text-sm font-medium text-destructive hover:underline"
                      onClick={() => setTabAssetData(null)}
                    >
                      Remove
                    </button>
                  </TableCell>
                </TableRow>
              ) : (
                <EmptyStateRow message="Scan a barcode above and click Renew tab to load transaction." colSpan={9} />
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
