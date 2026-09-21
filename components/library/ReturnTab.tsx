import { useEffect, useState } from "react";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { formatDisplayDate, Member } from "@/lib/mock-library-api";
import { TabAssetData, EmptyStateRow, SubmitBar, OtpVerificationDialog, TransactionRemarkInput } from "./TransactionTabs";
import { submitBookTransaction, generateOTP, getBookTransaction } from "@/services/books";
import { toast } from "react-toastify";
import { useTransactionOtp } from "@/hooks/useTransactionOtp";

export const ReturnTab = ({
  queuedAssets,
  loading,
  returnMutation,
  onSubmitReturn,
  member,
  savedDocName,
  setSavedDocName,
  otpVerified,
  setOtpVerified,
  setQueuedAssets,
  hasDueCharges,
  returnDate,
  setReturnDate,
  remark,
  setRemark,
}: {
  queuedAssets: any[]; // AssetByBarcodeMessage[]
  loading?: boolean;
  returnMutation: any;
  onSubmitReturn: (totalDueCharges: number, createInvoice: number) => void;
  member?: Member | null;
  savedDocName?: string;
  setSavedDocName?: (name: string) => void;
  otpVerified?: boolean;
  setOtpVerified?: (verified: boolean) => void;
  setQueuedAssets: (assets: any[]) => void;
  hasDueCharges?: boolean;
  returnDate: string;
  setReturnDate: (date: string) => void;
  remark?: string;
  setRemark?: (remark: string) => void;
}) => {
  const md = queuedAssets.length > 0 ? queuedAssets[queuedAssets.length - 1]?.member_details : null;
  const submitDisabled = queuedAssets.length === 0 || !md || !member || returnMutation.isPending || hasDueCharges;
  const [totalDueCharges, setTotalDueCharges] = useState(0);
  const [createInvoice, setCreateInvoice] = useState(1);

  const {
    verifying,
    otpDialogOpen,
    setOtpDialogOpen,
    otpValue,
    setOtpValue,
    otpVerifying,
    handleMemberVerification,
    handleOtpVerify,
  } = useTransactionOtp({
    transactionType: "Return",
    member,
    queuedAssets,
    totalDueCharges,
    createInvoice,
    savedDocName,
    setSavedDocName,
    setOtpVerified,
  });

  useEffect(() => {
    const total = queuedAssets.reduce((sum, asset) => sum + (asset.total_due_charges || 0), 0);
    setTotalDueCharges(total);
  }, [queuedAssets]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <p className="section-heading">Return transaction</p>
          <p className="mt-1 text-sm text-muted-foreground">Review queued books before returning.</p>
        </div>

        {queuedAssets.length > 0 && (
          <div className="section-frame flex gap-3 ">
            <div>
              <p className="section-heading">Issue Date</p>
              {md?.transaction_date ? <p className="mt-1 text-sm text-foreground">{formatDisplayDate(md.transaction_date)}</p> : <p className="mt-1 text-sm text-foreground">--</p>}
            </div>
            <div>
              <p className="section-heading">Return Date</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="returnDateInput"
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
            </div>
            <div>
              <p className="section-heading">Due Date</p>
              {md?.due_date ? <p className="mt-1 text-sm text-foreground">{formatDisplayDate(md.due_date)}</p> : <p className="mt-1 text-sm text-foreground">--</p>}
            </div>
          </div>
        )}

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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto animate-spin" />
                  </TableCell>
                </TableRow>
              ) : queuedAssets.length > 0 ? (
                queuedAssets.map((asset, idx) => (
                  <TableRow key={asset.asset_id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{asset.asset_id}</TableCell>
                    <TableCell className="font-medium text-foreground">{asset.asset_name}</TableCell>
                    <TableCell>{asset.member_details?.transaction_date ? formatDisplayDate(asset.member_details.transaction_date) : "—"}</TableCell>
                    <TableCell>{asset.member_details?.due_date ? formatDisplayDate(asset.member_details.due_date) : "—"}</TableCell>
                    <TableCell>{formatDisplayDate(returnDate)}</TableCell>
                    <TableCell>{asset.total_due_charges ?? 0}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-sm font-medium text-destructive hover:underline"
                        onClick={() => setQueuedAssets(queuedAssets.filter(a => a.asset_id !== asset.asset_id))}
                      >
                        Remove
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <EmptyStateRow message="Scan a barcode above and click Return tab to load transaction." colSpan={8} />
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
      <TransactionRemarkInput remark={remark} setRemark={setRemark} id="return-remark" />
      <SubmitBar
        disabled={submitDisabled}
        loading={returnMutation.isPending}
        label="Submit Return"
        onClick={() => onSubmitReturn(totalDueCharges, createInvoice)}
        onGenerateOTP={handleMemberVerification}
        onVerifyOTP={() => setOtpDialogOpen(true)}
        verifying={verifying}
        otpVerified={otpVerified}
        disableGenerateOTP={!member || queuedAssets.length === 0 || hasDueCharges}
        disableVerifyOTP={!savedDocName || hasDueCharges}
      />
      <OtpVerificationDialog
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        memberMobile={member?.mobile}
        otpValue={otpValue}
        setOtpValue={setOtpValue}
        otpVerifying={otpVerifying}
        onVerify={handleOtpVerify}
        onCancel={() => setOtpDialogOpen(false)}
      />
    </div>
  );
};

export default ReturnTab;
