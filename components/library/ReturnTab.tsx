import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { formatDisplayDate, Member } from "@/lib/mock-library-api";
import { TabAssetData, EmptyStateRow, SubmitBar, OtpVerificationDialog } from "./TransactionTabs";
import { submitBookReturn, generateOTP, getBookTransaction } from "@/services/books";
import { toast } from "react-toastify";

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
}) => {
  const md = queuedAssets.length > 0 ? queuedAssets[queuedAssets.length - 1]?.member_details : null;
  const submitDisabled = queuedAssets.length === 0 || !md || returnMutation.isPending || hasDueCharges;
  const [totalDueCharges, setTotalDueCharges] = useState(0);
  const [createInvoice, setCreateInvoice] = useState(1);
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const [verifying, setVerifying] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>("");

  useEffect(() => {
    setGeneratedOtp("");
  }, [member?.name]);

  useEffect(() => {
    const total = queuedAssets.reduce((sum, asset) => sum + (asset.total_due_charges || 0), 0);
    setTotalDueCharges(total);
  }, [queuedAssets]);

  const handleMemeberVerification = async () => {
    if (!member) {
      toast.error("Please select a member before verifying.");
      return;
    }
    if (queuedAssets.length === 0) {
      toast.error("Scan a barcode to load transaction details.");
      return;
    }
    setVerifying(true);
    try {
      const saved = await submitBookReturn({
        member,
        queuedAssets: queuedAssets as any,
        totalDueCharges,
        createInvoice,
        action: "Save",
        savedDocName,
      });

      const docname: string =
        saved.name ||
        (saved as any)?.rows?.[0]?.parent ||
        "";

      if (!docname) {
        throw new Error("Could not determine document name from saved transaction.");
      }

      if (setSavedDocName) {
        setSavedDocName(docname);
      }

      await generateOTP({ docname });

      try {
        const docDetails = await getBookTransaction({ docname });
        const otp = docDetails.docs?.[0]?.otp;
        if (otp) {
          setGeneratedOtp(String(otp));
        }
      } catch (fetchErr) {
        console.error("Failed to fetch generated OTP:", fetchErr);
      }

      toast.success("OTP sent successfully for member verification.");
    } catch (err: any) {
      toast.error(err?.message ?? "Member verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otpValue || otpValue.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    if (generatedOtp && otpValue !== generatedOtp) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }
    setOtpVerifying(true);
    try {
      const res = await submitBookReturn({
        member,
        queuedAssets: queuedAssets as any,
        totalDueCharges,
        createInvoice,
        action: "Save",
        savedDocName,
        otp: otpValue,
        otp_verified: 1
      });

      if (res.otp_verified) {
        toast.success("OTP verified successfully.");
        if (setOtpVerified) {
          setOtpVerified(true);
        }
        setOtpDialogOpen(false);
        setOtpValue("");
      } else {
        toast.error("Invalid OTP or verification failed.");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "OTP verification failed.");
    } finally {
      setOtpVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <p className="section-heading">Return transaction</p>
          <p className="mt-1 text-sm text-muted-foreground">Review queued books before returning.</p>
        </div>

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
      <SubmitBar
        disabled={submitDisabled}
        loading={returnMutation.isPending}
        label="Submit Return"
        onClick={() => onSubmitReturn(totalDueCharges, createInvoice)}
        onGenerateOTP={handleMemeberVerification}
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
