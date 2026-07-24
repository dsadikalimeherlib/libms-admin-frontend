import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { format, addMonths } from "date-fns";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UseFormReturn } from "react-hook-form";
import type { IssuePreviewRow, Member } from "@/lib/mock-library-api";
import { IssueFormValues, TabAssetData, SubmitBar, OtpVerificationDialog } from "./TransactionTabs";
import { Button } from "@/components/ui/button";
import { submitBookIssue, generateOTP, getBookTransaction } from "@/services/books";
import { toast } from "react-toastify";

export interface IssueTabProps {
  form: UseFormReturn<IssueFormValues>;
  queuedBooks: IssuePreviewRow[];
  issueMutation: any;
  submitDisabled: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  assetData?: TabAssetData | null;
  loading?: boolean;
  setQueuedBooks?: (books: IssuePreviewRow[]) => void;
  setTabAssetData?: (data: TabAssetData | null) => void;
  member?: Member | null;
  setSavedDocName?: (name: string) => void;
  savedDocName?: string;
  otpVerified?: boolean;
  setOtpVerified?: (verified: boolean) => void;
  hasDueCharges?: boolean;
}

const RootError = ({ message }: { message?: string }) =>
  message ? <div className="inline-feedback">{message}</div> : null;

export const EmptyStateRow = ({ message, colSpan }: { message: string; colSpan: number }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
      {message}
    </TableCell>
  </TableRow>
);

export const IssueTab = ({
  form,
  queuedBooks,
  issueMutation,
  submitDisabled,
  onSubmit,
  onCancel,
  assetData,
  loading,
  setQueuedBooks,
  setTabAssetData,
  member,
  setSavedDocName,
  savedDocName,
  otpVerified,
  setOtpVerified,
  hasDueCharges,
}: IssueTabProps) => {
  const [verifying, setVerifying] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>("");

  useEffect(() => {
    setGeneratedOtp("");
  }, [member?.name]);
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateStr = e.target.value;
    if (!newDateStr) return;

    const newDate = new Date(newDateStr);
    if (isNaN(newDate.getTime())) return;

    const newDueDateStr = format(addMonths(newDate, 1), 'yyyy-MM-dd');

    if (assetData && setTabAssetData) {
      setTabAssetData({ ...assetData, transactionDate: newDateStr, dueDate: newDueDateStr });
    }

    if (queuedBooks.length > 0 && setQueuedBooks) {
      setQueuedBooks(queuedBooks.map(b => ({ ...b, transactionDate: newDateStr, dueDate: newDueDateStr })));
    }
  };

  const error = form.formState.errors.root?.message
  const disabled = submitDisabled

  const handleMemeberVerification = async () => {
    if (!member) {
      toast.error("Please select a member before verifying.");
      return;
    }
    if (queuedBooks.length === 0) {
      toast.error("Add at least one book before verifying.");
      return;
    }
    setVerifying(true);
    try {
      // Step 1: Save the transaction (action="Save") to obtain a docname
      const saved = await submitBookIssue({
        member,
        queuedBooks,
        barcode: form.getValues("barcode"),
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

      // Step 2: Generate OTP for the saved document
      await generateOTP({ docname });

      // Step 3: Fetch transaction document details to get the generated OTP
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
      const res = await submitBookIssue({
        member,
        queuedBooks,
        barcode: form.getValues("barcode"),
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

        <div className="section-frame flex gap-3 ">
          <div>
            <p className="section-heading">Issue Date</p>
            <Input
              type="date"
              className="mt-1 w-auto"
              value={assetData?.transactionDate || (queuedBooks[0]?.transactionDate) || ""}
              onChange={handleDateChange}
            />
          </div>
          <div>
            <p className="section-heading">Due Date</p>
            {assetData?.dueDate ? <p className="mt-1 text-sm text-foreground">{format(new Date(assetData.dueDate), 'dd/MM/yyyy')}</p> : <p className="mt-1 text-sm text-foreground">--</p>}
          </div>
        </div>
        <div className="table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Access No</TableHead>
                <TableHead>Book Title</TableHead>
                <TableHead>Authors</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
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
              ) : queuedBooks.length > 0 ? (
                queuedBooks.map((book, idx) => (
                  <TableRow key={book.barcode}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{book.accessNo || book.barcode}</TableCell>
                    <TableCell className="font-medium text-foreground">{book.title}</TableCell>
                    <TableCell>{book.author || "—"}</TableCell>
                    <TableCell>{book.language || "—"}</TableCell>
                    <TableCell>{book.volume || "—"}</TableCell>
                    <TableCell>{book.transactionDate ? format(new Date(book.transactionDate), 'dd-MM-yyyy') : "—"}</TableCell>
                    <TableCell>{book.dueDate ? format(new Date(book.dueDate), 'dd-MM-yyyy') : "—"}</TableCell>
                    <TableCell>
                      <button 
                        type="button" 
                        className="text-sm font-medium text-destructive hover:underline"
                        onClick={() => setQueuedBooks && setQueuedBooks(queuedBooks.filter(b => b.barcode !== book.barcode))}
                      >
                        Remove
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <EmptyStateRow message="Scan a barcode above and click Issue tab to load book details." colSpan={9} />
              )}
            </TableBody>
          </Table>



        </div>
      </section>

      <SubmitBar
        error={error}
        disabled={disabled}
        loading={!!loading}
        label="Submit Issue"
        onClick={onSubmit}
        onCancel={onCancel}
        onGenerateOTP={handleMemeberVerification}
        onVerifyOTP={() => setOtpDialogOpen(true)}
        verifying={verifying}
        otpVerified={otpVerified}
        disableGenerateOTP={!member || queuedBooks.length === 0 || hasDueCharges}
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

export default IssueTab;
