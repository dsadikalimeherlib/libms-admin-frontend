import { useEffect, useState } from "react";
import { Loader2, CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatDisplayDate, type Member } from "@/lib/mock-library-api";
import { useTransactionOtp } from "@/hooks/useTransactionOtp";
import { TabAssetData, EmptyStateRow, SubmitBar, OtpVerificationDialog } from "./TransactionTabs";

export const RenewTab = ({
  queuedRenewAssets,
  setQueuedRenewAssets,
  loading,
  renewMutation,
  onSubmitRenew,
  hasDueCharges,
  maxIssueDays,
  member,
  savedDocName,
  setSavedDocName,
  otpVerified,
  setOtpVerified,
}: {
  queuedRenewAssets: TabAssetData[];
  setQueuedRenewAssets: React.Dispatch<React.SetStateAction<TabAssetData[]>>;
  loading?: boolean;
  renewMutation: any;
  onSubmitRenew: (totalDueCharges: number, createInvoice: number) => void;
  hasDueCharges?: boolean;
  maxIssueDays?: number;
  member?: Member | null;
  savedDocName?: string;
  setSavedDocName?: (name: string) => void;
  otpVerified?: boolean;
  setOtpVerified?: (verified: boolean) => void;
}) => {
  const submitDisabled = queuedRenewAssets.length === 0 || !member || renewMutation.isPending || hasDueCharges;
  const [totalDueCharges, setTotalDueCharges] = useState(0);
  const [createInvoice, setCreateInvoice] = useState(1);
  const [returnDate, setReturnDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

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
    transactionType: "Renew",
    member,
    queuedRenewAssets,
    totalDueCharges,
    createInvoice,
    savedDocName,
    setSavedDocName,
    setOtpVerified,
  });

  useEffect(() => {
    const total = queuedRenewAssets.reduce((sum, asset) => sum + (asset.total_due_charges || 0), 0);
    setTotalDueCharges(total);
    if (queuedRenewAssets.length === 0) {
      setReturnDate(format(new Date(), "yyyy-MM-dd"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedRenewAssets]);

  useEffect(() => {
    if (queuedRenewAssets.length > 0 && setQueuedRenewAssets && returnDate) {
      setQueuedRenewAssets((prev) => prev.map((asset) => {
        let newDueDateStr = format(addDays(new Date(returnDate), maxIssueDays || 30), 'yyyy-MM-dd');
        if (member?.due_date) {
          const memberDueDate = new Date(member.due_date);
          if (new Date(newDueDateStr) > memberDueDate) {
            newDueDateStr = format(memberDueDate, 'yyyy-MM-dd');
          }
        }
        if (asset.dueDate !== newDueDateStr) {
          return { ...asset, dueDate: newDueDateStr };
        }
        return asset;
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.name, maxIssueDays, returnDate]); // removed asset dependency because it updates all

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="section-frame flex gap-3 ">
          <div>
            <p className="section-heading">Issue Date</p>
            {queuedRenewAssets.length > 0 && queuedRenewAssets[0].member_details?.transaction_date ? <p className="mt-1 text-sm text-foreground">{formatDisplayDate(queuedRenewAssets[0].member_details.transaction_date)}</p> : <p className="mt-1 text-sm text-foreground">--</p>}
          </div>
          <div>
            <p className="section-heading">Return Date</p>
            {queuedRenewAssets.length > 0 ? (
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
            {queuedRenewAssets.length > 0 && queuedRenewAssets[0].member_details?.due_date ? <p className="mt-1 text-sm text-foreground">{formatDisplayDate(queuedRenewAssets[0].member_details.due_date)}</p> : <p className="mt-1 text-sm text-foreground">--</p>}
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
                <TableHead>Renew Due Date</TableHead>
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
              ) : queuedRenewAssets.length > 0 ? (
                queuedRenewAssets.map((asset, index) => {
                  const md = asset.member_details;
                  return (
                    <TableRow key={asset.asset_id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{asset.asset_id}</TableCell>
                      <TableCell className="font-medium text-foreground">{asset.asset_name}</TableCell>
                      <TableCell>{md?.transaction_date ? formatDisplayDate(md.transaction_date) : "--"}</TableCell>
                      <TableCell>{md?.due_date ? formatDisplayDate(md.due_date) : "--"}</TableCell>
                      <TableCell>{formatDisplayDate(returnDate)}</TableCell>
                      <TableCell>{asset.dueDate ? format(new Date(asset.dueDate), 'dd/MM/yyyy') : "—"}</TableCell>
                      <TableCell>{asset.total_due_charges ?? 0}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="text-sm font-medium text-destructive hover:underline"
                          onClick={() => setQueuedRenewAssets(current => current.filter(a => a.asset_id !== asset.asset_id))}
                        >
                          Remove
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
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
        onGenerateOTP={handleMemberVerification}
        onVerifyOTP={() => setOtpDialogOpen(true)}
        verifying={verifying}
        otpVerified={otpVerified}
        disableGenerateOTP={!member || queuedRenewAssets.length === 0 || hasDueCharges}
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

export default RenewTab;
