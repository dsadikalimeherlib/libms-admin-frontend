import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { generateOTP, getBookTransaction, submitBookTransaction, submitBookRenew } from "@/services/books";
import { Member } from "@/lib/mock-library-api";

export interface UseTransactionOtpProps {
  transactionType: "Issue" | "Return" | "Renew";
  member?: Member | null;
  queuedBooks?: any[];
  queuedAssets?: any[];
  queuedRenewAssets?: any[];
  barcode?: string;
  totalDueCharges?: number;
  createInvoice?: number;
  savedDocName?: string;
  setSavedDocName?: (name: string) => void;
  setOtpVerified?: (verified: boolean) => void;
}

export const useTransactionOtp = ({
  transactionType,
  member,
  queuedBooks,
  queuedAssets,
  queuedRenewAssets,
  barcode,
  totalDueCharges,
  createInvoice,
  savedDocName,
  setSavedDocName,
  setOtpVerified,
}: UseTransactionOtpProps) => {
  const [verifying, setVerifying] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>("");

  useEffect(() => {
    setGeneratedOtp("");
  }, [member?.name]);

  const handleMemberVerification = async () => {
    if (!member) {
      toast.error("Please select a member before verifying.");
      return;
    }

    if (transactionType === "Issue" && (!queuedBooks || queuedBooks.length === 0)) {
      toast.error("Add at least one book before verifying.");
      return;
    }
    if (transactionType === "Return" && (!queuedAssets || queuedAssets.length === 0)) {
      toast.error("Scan a barcode to load transaction details.");
      return;
    }
    if (transactionType === "Renew" && (!queuedRenewAssets || queuedRenewAssets.length === 0)) {
      toast.error("Scan a barcode to load transaction details.");
      return;
    }

    setVerifying(true);
    try {
      let saved: any;

      if (transactionType === "Renew") {
        saved = await submitBookRenew({
          member,
          queuedRenewAssets: queuedRenewAssets!,
          totalDueCharges,
          createInvoice,
          action: "Save",
          savedDocName,
        });
      } else {
        saved = await submitBookTransaction({
          transaction_type: transactionType,
          member,
          queuedBooks,
          queuedAssets,
          barcode,
          totalDueCharges,
          createInvoice,
          action: "Save",
          savedDocName,
        });
      }

      const docname: string =
        saved?.name ||
        saved?.rows?.[0]?.parent ||
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
      let res: any;

      if (transactionType === "Renew") {
        res = await submitBookRenew({
          member,
          queuedRenewAssets: queuedRenewAssets!,
          totalDueCharges,
          createInvoice,
          action: "Save",
          savedDocName,
          otp: otpValue,
          otp_verified: 1
        });
      } else {
        res = await submitBookTransaction({
          transaction_type: transactionType,
          member,
          queuedBooks,
          queuedAssets,
          barcode,
          totalDueCharges,
          createInvoice,
          action: "Save",
          savedDocName,
          otp: otpValue,
          otp_verified: 1
        });
      }

      if (res?.otp_verified) {
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

  return {
    verifying,
    otpDialogOpen,
    setOtpDialogOpen,
    otpValue,
    setOtpValue,
    otpVerifying,
    handleMemberVerification,
    handleOtpVerify,
  };
};

