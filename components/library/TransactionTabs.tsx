import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, addMonths, format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";


import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  cn,
} from "@/lib/utils";
import {
  type Book,
  type IssuePreviewRow,
  type Member,
} from "@/lib/mock-library-api";
import { getMemberCustomer, validateMembers, validateMemberTransaction, getMemberList } from "@/services/members";
import { searchFrappeLink, submitBookTransaction, submitBookRenew, submitBookReservation, getAssetByBarcode, type AssetByBarcodeMessage, validateMemberToIssueBook, countBooksIssued, type SelectBookResult, get_requested_book_reservations } from "@/services/books";
import { toast } from "react-toastify";

import { IssueTab } from "./IssueTab";
import { ReturnTab } from "./ReturnTab";
import { RenewTab } from "./RenewTab";
import { ReservationTab } from "./ReservationTab";
import { TransactionForm } from "./TransactionForm";

const issueFormSchema = z.object({
  memberQuery: z.string().trim(),
  barcode: z
    .string()
    .trim()
    .min(4, "Enter a valid barcode.")
    .or(z.literal("")),
});

export type IssueFormValues = z.infer<typeof issueFormSchema>;

const buildIssuePreview = (book: Book, member?: Member | null, maxIssueDays: number = 30): IssuePreviewRow => {
  const transactionDate = new Date();
  let dueDate = addDays(transactionDate, maxIssueDays);
  if (member?.due_date) {
    const memberDueDate = new Date(member.due_date);
    if (dueDate > memberDueDate) {
      dueDate = memberDueDate;
    }
  }
  return {
    ...book,
    transactionDate: format(transactionDate, 'yyyy-MM-dd'),
    dueDate: format(dueDate, 'yyyy-MM-dd'),
  };
};

export type MemberSuggestion = {
  id: string;
  value: string;
  description: string;
};

export type AssetDoc = {
  name: string;
  asset_name: string;
  item_name: string;
  item_code: string;
  asset_category: string;
  location: string;
  status: string;
  donated_book: string;
  purchase_date: string;
};

export type TabAssetData = AssetByBarcodeMessage;

// Removed RootError component

export const EmptyStateRow = ({ message, colSpan }: { message: string; colSpan: number }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
      {message}
    </TableCell>
  </TableRow>
);



export const SubmitBar = ({
  error,
  disabled,
  loading,
  label,
  onClick,
  onCancel,
  onGenerateOTP,
  onVerifyOTP,
  verifying,
  otpVerified,
  disableGenerateOTP,
  disableVerifyOTP,
}: {
  error?: string;
  disabled: boolean;
  loading: boolean;
  label: string;
  onClick?: () => void;
  onCancel?: () => void;
  onGenerateOTP?: () => void;
  onVerifyOTP?: () => void;
  verifying?: boolean;
  otpVerified?: boolean;
  disableGenerateOTP?: boolean;
  disableVerifyOTP?: boolean;
}) => (
  <div className="">
    <div className="flex justify-end gap-3 md:ml-auto">
      {onGenerateOTP && (
        <Button onClick={onGenerateOTP} disabled={disableGenerateOTP || verifying}>
          {verifying ? <Loader2 className="mr-2 animate-spin" /> : null}
          Generate OTP
        </Button>
      )}
      {onVerifyOTP && (
        <Button
          type="button"
          onClick={onVerifyOTP}
          disabled={disableVerifyOTP || verifying || loading || otpVerified}
        >
          {otpVerified ? "OTP Verified" : "Verify OTP"}
        </Button>
      )}
      <Button
        type={onClick ? "button" : "submit"}
        onClick={onClick}
        disabled={disabled}
        className="min-w-40"
      >
        {loading ? <Loader2 className="animate-spin" /> : null}
        {label}
      </Button>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  </div>
);

export const OtpVerificationDialog = ({
  open,
  onOpenChange,
  memberMobile,
  otpValue,
  setOtpValue,
  otpVerifying,
  onVerify,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberMobile?: string;
  otpValue: string;
  setOtpValue: (val: string) => void;
  otpVerifying: boolean;
  onVerify: () => void;
  onCancel: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Verify OTP</DialogTitle>
        <DialogDescription>
          Enter the 6-digit OTP sent to the member's mobile number ({memberMobile || "N/A"}) to verify the transaction.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col items-center justify-center py-4 space-y-4">
        <InputOTP
          maxLength={6}
          value={otpValue}
          onChange={setOtpValue}
          disabled={otpVerifying}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={otpVerifying}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onVerify}
          disabled={otpValue.length !== 6 || otpVerifying}
        >
          {otpVerifying ? <Loader2 className="mr-2 animate-spin" /> : null}
          Verify
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);







const tabs = [
  { value: "issue", label: "Issue" },
  { value: "return", label: "Return" },
  { value: "renew", label: "Renew" },
  { value: "reservation", label: "Reservation" },
] as const;

const TransactionTabs = ({ setDueMessage, setDuePaymentId }: { setDueMessage?: (msg: string | null) => void, setDuePaymentId?: (id: string | null) => void } = {}) => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["value"]>("issue");

  const queryClient = useQueryClient();
  const form = useForm<IssueFormValues>({
    resolver: zodResolver(issueFormSchema),
    defaultValues: {
      memberQuery: "",
      barcode: "",
    },
    mode: "onChange",
  });
  const [member, setMember] = useState<Member | null>(null);
  const [queuedBooks, setQueuedBooks] = useState<IssuePreviewRow[]>([]);
  const [scannedBook, setScannedBook] = useState<Book | null>(null);
  const [assetDoc, setAssetDoc] = useState<AssetDoc | null>(null);
  const [tabAssetData, setTabAssetData] = useState<TabAssetData | null>(null);
  const [queuedAssets, setQueuedAssets] = useState<AssetByBarcodeMessage[]>([]);
  const [tabAssetLoading, setTabAssetLoading] = useState(false);
  const [memberSuggestions, setMemberSuggestions] = useState<MemberSuggestion[]>([]);
  const [memberInputFocused, setMemberInputFocused] = useState(false);
  const [dropdownActive, setDropdownActive] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [savedDocName, setSavedDocName] = useState<string>("");
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const [hasDueCharges, setHasDueCharges] = useState(false);
  const [reservedAssets, setReservedAssets] = useState<SelectBookResult[]>([]);
  const [reservationDate, setReservationDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [returnDate, setReturnDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [reservationRemarks, setReservationRemarks] = useState<string>("");
  const [maxIssueDays, setMaxIssueDays] = useState<number>(30);
  const [issuedCount, setIssuedCount] = useState<number>(0);
  const [maxIssueLimit, setMaxIssueLimit] = useState<number>(0);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextSearchRef = useRef(false);
  const watchedQuery = form.watch("memberQuery");

  const loadMemberSuggestions = async (query: string) => {
    setMemberLoading(true);
    try {
      const result = await searchFrappeLink({
        txt: query,
        doctype: "Member",
        reference_doctype: "Book Transaction",
        filters: { membership_status: "Active" }
      });
      setMemberSuggestions((result.message as MemberSuggestion[]) || []);
    } catch (error) {
      setMemberSuggestions([]);
    } finally {
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void loadMemberSuggestions(watchedQuery);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watchedQuery]);

  useEffect(() => {
    setSavedDocName("");
    setOtpVerified(false);
    setQueuedAssets([]);
    setReturnDate(format(new Date(), 'yyyy-MM-dd'));
  }, [activeTab]);

  useEffect(() => {
    setSavedDocName("");
    setOtpVerified(false);
  }, [member?.name]);





  const issueMutation = useMutation({
    mutationFn: () => submitBookTransaction({ transaction_type: "Issue", member: member!, queuedBooks, barcode: form.getValues("barcode"), savedDocName }),
    onSuccess: (result) => {
      setQueuedBooks([]);
      setMember(null);
      setSavedDocName("");
      setOtpVerified(false);
      setScannedBook(null);
      setTabAssetData(null);
      form.setValue("memberQuery", "", { shouldValidate: false });
      form.setValue("barcode", "", { shouldValidate: false });
      form.clearErrors();
      toast.success(`${result.rows.length} item(s) issued to ${result.member?.name}.`);
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: Error) => {
      toast.error(error.message?.includes("Failed to submit issue transaction") ? "Please contact Library Admin." : error.message);
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ totalDueCharges, createInvoice }: { totalDueCharges: number, createInvoice: number }) => submitBookTransaction({ transaction_type: "Return", member: member!, queuedAssets, totalDueCharges, createInvoice }),
    onSuccess: (data) => {
      setTabAssetData(null);
      setQueuedAssets([]);
      setScannedBook(null);
      setReturnDate(format(new Date(), 'yyyy-MM-dd'));
      setMember(null);
      setSavedDocName("");
      setOtpVerified(false);
      form.setValue("memberQuery", "", { shouldValidate: false });
      form.setValue("barcode", "", { shouldValidate: false });
      form.clearErrors();
      toast.success("Book(s) returned successfully.");
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });

      if (data && data.name) {
        get_requested_book_reservations({ self_name: data.name })
          .then((res) => {
            if (res && res.message) {
              // The API might return a message about reservation status
              if (typeof res.message === 'string') {
                toast.info(res.message);
              }
            }
          })
          .catch((err) => console.error("Error checking reservations:", err));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const renewMutation = useMutation({
    mutationFn: ({ totalDueCharges, createInvoice }: { totalDueCharges: number, createInvoice: number }) => submitBookRenew({ member: member!, assetData: tabAssetData!, totalDueCharges, createInvoice }),
    onSuccess: () => {
      setTabAssetData(null);
      setScannedBook(null);
      setMember(null);
      setSavedDocName("");
      setOtpVerified(false);
      form.setValue("memberQuery", "", { shouldValidate: false });
      form.setValue("barcode", "", { shouldValidate: false });
      form.clearErrors();
      toast.success("Book renewed successfully.");
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const reservationMutation = useMutation({
    mutationFn: () => {
      if (!member) throw new Error("Member is required for reservation.");
      if (reservedAssets.length === 0) throw new Error("At least one book must be reserved.");

      const itemCode = form.getValues("barcode");
      const bookTitle = reservedAssets[0]?.asset_name || "";

      return submitBookReservation({
        member,
        book: itemCode,
        bookTitle,
        reservationDate,
        reservedAssets,
        reservation_remarks: reservationRemarks,
        issuedCount
      });
    },
    onSuccess: () => {
      setReservedAssets([]);
      setMember(null);
      form.setValue("memberQuery", "", { shouldValidate: false });
      form.setValue("barcode", "", { shouldValidate: false });
      setScannedBook(null);
      setReservationDate(format(new Date(), 'yyyy-MM-dd'));
      setReservationRemarks("");
      toast.success("Book reservation created successfully.");
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const submitDisabled = !member || queuedBooks.length === 0 || issueMutation.isPending || hasDueCharges;

  const onSubmitReturn = (totalDueCharges: number, createInvoice: number) => {
    if (!member) { toast.error("Member is required."); return; }
    if (queuedAssets.length === 0) { toast.error("Scan a barcode to load transaction details."); return; }
    returnMutation.mutate({ totalDueCharges, createInvoice });
  };

  const onSubmitRenew = (totalDueCharges: number, createInvoice: number) => {
    if (!member) { toast.error("Member is required."); return; }
    if (!tabAssetData?.member_details) { toast.error("Scan a barcode to load transaction details."); return; }
    renewMutation.mutate({ totalDueCharges, createInvoice });
  };

  const onSubmitReservation = () => {
    reservationMutation.mutate();
  };

  const onSubmit = () => {
    if (!member) {
      toast.error("Member is required before issuing books.");
      return;
    }

    if (queuedBooks.length === 0) {
      toast.error("Add at least one book before submitting.");
      return;
    }

    issueMutation.mutate();
  };

  const handleCancel = () => {
    setMember(null);
    setQueuedBooks([]);
    setScannedBook(null);
    setAssetDoc(null);
    setTabAssetData(null);
    setQueuedAssets([]);
    setSavedDocName("");
    setOtpVerified(false);
    setMemberSuggestions([]);
    setDropdownActive(false);
    setHasDueCharges(false);
    setReservedAssets([]);
    setIssuedCount(0);
    setMaxIssueLimit(0);
    setReservationDate(format(new Date(), 'yyyy-MM-dd'));
    setReservationRemarks("");
    setReturnDate(format(new Date(), 'yyyy-MM-dd'));
    if (setDueMessage) setDueMessage(null);
    form.reset();
  };

  const handleSuggestionClick = async (selectionValue: string) => {
    skipNextSearchRef.current = true;
    form.setValue("memberQuery", selectionValue, { shouldValidate: false });
    setMemberSuggestions([]);
    setDropdownActive(false);
    setMemberLoading(true);
    try {
      const [validatedMember, customerData] = await Promise.all([
        validateMembers({ text: selectionValue }),
        getMemberCustomer({ docname: selectionValue }),
      ]);
      setMember(validatedMember);
      if (!customerData?.customer) {
        toast.warn("This member has no customer assigned.");
      }
      if (activeTab === 'issue' || activeTab === 'reservation') {
        const issuedCountData = await countBooksIssued({ member: selectionValue });
        const limitData = await validateMemberToIssueBook({ member: selectionValue });
        const currentIssuedCount = issuedCountData?.message?.count || 0;
        setIssuedCount(currentIssuedCount);
        const limitArray = limitData?.message;
        const limit = limitArray && limitArray.length > 0 ? Number(limitArray[0]) : 0;
        const daysLimit = limitArray && limitArray.length > 1 ? Number(limitArray[1]) : 30;
        setMaxIssueDays(daysLimit);
        setMaxIssueLimit(limit);

        if (limit <= currentIssuedCount) {
          toast.error(`Not allowed more than given limit ${limit} books`);
          setMember(null);
          form.setValue("memberQuery", "", { shouldValidate: false });
          setMemberLoading(false);
          return;
        }
      }
      if (activeTab !== 'return') {
        const validatedTransaction = await validateMemberTransaction({ text: selectionValue });
        if (validatedTransaction.valid) {
          toast.success(`${validatedTransaction.message}`);
          setMember((prev) => prev ? { ...prev, due_date: validatedTransaction.due_date, is_valid_membership: true } : null);
        } else {
          toast.error(`${validatedTransaction.message}`);
          setMember((prev) => prev ? { ...prev, is_valid_membership: false } : null);
        }
      }

      let hasDue = false;
      if (customerData?.customer) {
        try {
          const invoices = await getMemberList({ docname: customerData.customer, generateBill: false });
          if (invoices && invoices.length > 0) {
            const totalDue = invoices.reduce((sum: number, inv: any) => sum + (inv.outstanding_amount || 0), 0);
            if (totalDue > 0) {
              hasDue = true;
              if (setDueMessage) setDueMessage(`This member has an outstanding amount of ₹${totalDue}. Please clear dues to proceed.`);
              if (setDuePaymentId) {
                const firstDueInvoice = invoices.find((inv: any) => (inv.outstanding_amount || 0) > 0);
                if (firstDueInvoice) {
                  setDuePaymentId(customerData.customer);
                }
              }
            } else {
              if (setDueMessage) setDueMessage(null);
              if (setDuePaymentId) setDuePaymentId(null);
            }
          } else {
            if (setDueMessage) setDueMessage(null);
            if (setDuePaymentId) setDuePaymentId(null);
          }
        } catch (err) {
          console.error("Failed to fetch due charges", err);
        }
      }
      setHasDueCharges(hasDue);
    } catch (error: any) {
      setMember(null);
      toast.error(error?.message ?? "Member validation failed.");
      setHasDueCharges(false);
      if (setDueMessage) setDueMessage(null);
      if (setDuePaymentId) setDuePaymentId(null);
    } finally {
      setMemberLoading(false);
    }
  };

  const getAssetDetailFun = async (name: string, targetTab?: "issue" | "return" | "renew" | "reservation") => {
    const currentTab = targetTab || activeTab;
    try {
      const isAlreadyQueued = currentTab === "issue"
        ? queuedBooks.some(book => book.barcode === name)
        : currentTab === "return"
          ? queuedAssets.some(asset => asset.asset_id === name)
          : currentTab === "renew"
            ? tabAssetData?.asset_id === name
            : false;

      if (isAlreadyQueued) {
        toast.error("This book is already queued.");
        form.setValue("barcode", "", { shouldValidate: false });
        form.clearErrors("barcode");
        return false;
      }
      setTabAssetLoading(true);
      const transactionType = currentTab === "issue" ? "Issue" : currentTab === "return" ? "Return" : "Renew";
      let data = await getAssetByBarcode({
        barcode: name,
        member: member?.name || "",
        transactionType,
      });

      if (currentTab === "return" && member?.name && data.member_details?.member && member.name !== data.member_details.member) {
        toast.error("This book does not belong to the same member.");
        form.setValue("barcode", "", { shouldValidate: false });
        form.clearErrors("barcode");
        return false;
      }

      const memberQueryValue = form.getValues("memberQuery");
      let currentMemberName = member?.name;

      if ((currentTab === "return" || currentTab === "renew") && !memberQueryValue && data.member_details?.member) {
        const memberId = data.member_details.member;
        form.setValue("memberQuery", memberId, { shouldValidate: false });
        const validatedMember = await validateMembers({ text: memberId });
        // await validateMemberToIssueBook({ member: memberId });
        setMember(validatedMember);
        currentMemberName = validatedMember?.name;
      }

      let localDaysLimit = maxIssueDays;
      let calculatedDueCharges = 0;
      if (currentTab === "issue" || currentTab === "renew" || currentTab === "return") {
        const allowedData = await validateMemberToIssueBook({
          member: currentMemberName || "",
        })
        const daysLimit = allowedData.message && allowedData.message.length > 1 ? Number(allowedData.message[1]) : 30;
        setMaxIssueDays(daysLimit);
        localDaysLimit = daysLimit;

        if (allowedData.message.length == 0) {
          toast.error(allowedData.message);
          setMember(null);
          form.setValue("memberQuery", "", { shouldValidate: false });
          form.setValue("barcode", "", { shouldValidate: false });
          form.clearErrors();
          return false;
        }

        if (currentTab === "return" || currentTab === "renew") {
          const perDayCharge = allowedData.message && allowedData.message.length > 2 ? Number(allowedData.message[2]) : 0;
          if (data.member_details?.due_date) {
            const dueDate = new Date(data.member_details.due_date);
            const retDate = new Date(returnDate);
            dueDate.setHours(0, 0, 0, 0);
            retDate.setHours(0, 0, 0, 0);
            if (retDate > dueDate) {
              const diffTime = retDate.getTime() - dueDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              calculatedDueCharges = diffDays * perDayCharge;
            }
          }
        }
      }

      if (calculatedDueCharges > 0) {
        data = await getAssetByBarcode({
          barcode: name,
          member: currentMemberName || "",
          transactionType,
          total_due_charges: calculatedDueCharges,
        });
      }
      data.total_due_charges = calculatedDueCharges;

      if (currentTab === "issue") {
        const tDate = new Date();
        data.transactionDate = format(tDate, 'yyyy-MM-dd');

        let finalDueDate = format(addDays(tDate, localDaysLimit), 'yyyy-MM-dd');
        if (member?.due_date) {
          const memberDueDate = new Date(member.due_date);
          const maxDateAllowed = addDays(tDate, localDaysLimit);
          if (memberDueDate < maxDateAllowed) {
            finalDueDate = format(memberDueDate, 'yyyy-MM-dd');
          }
        }
        data.dueDate = finalDueDate;
      }
      setTabAssetData(data);
      setAssetDoc(null);

      const mappedBook: Book = {
        barcode: data.asset_id,
        accessNo: data.asset_id,
        title: data.asset_name || data.asset_id,
        author: data.authors?.join(", ") || "",
        language: data.languages?.join(", ") || "",
        volume: data.volume || "",
        location: "",
        status: data.status || "",
      };

      setScannedBook(mappedBook);
      form.setValue("barcode", "", { shouldValidate: false });
      form.clearErrors("barcode");

      if (currentTab === "issue") {
        setQueuedBooks((current) => [...current, buildIssuePreview(mappedBook, member, maxIssueDays)]);
      } else if (currentTab === "return") {
        setQueuedAssets((current) => [...current, data]);
      }
      return true;
    } catch (error: any) {
      toast.error(error.message);
      form.setValue("barcode", "", { shouldValidate: false });
      form.clearErrors();
      return false;
    } finally {
      setTabAssetLoading(false);
    }
  };

  const handleIssueAvailableBook = async (barcode: string) => {
    setActiveTab("issue");
    await getAssetDetailFun(barcode, "issue");
  };

  return (
    <div className="flex flex-col gap-4">
      <TransactionForm
        form={form}
        member={member}
        setMember={setMember}
        setQueuedBooks={setQueuedBooks}
        setScannedBook={setScannedBook}
        setAssetDoc={setAssetDoc}
        memberInputFocused={memberInputFocused}
        setMemberInputFocused={setMemberInputFocused}
        dropdownActive={dropdownActive}
        setDropdownActive={setDropdownActive}
        memberSuggestions={memberSuggestions}
        handleSuggestionClick={handleSuggestionClick}
        getAssetDetailFun={getAssetDetailFun}
        scannedBook={scannedBook}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        setTabAssetData={setTabAssetData}
        memberLoading={memberLoading}
        hasDueCharges={hasDueCharges}
        setReservedAssets={setReservedAssets}
        issuedCount={issuedCount}
        maxIssueLimit={maxIssueLimit}
      />

      <div className={cn(activeTab !== "issue" && "hidden", "mt-1")}>
        <IssueTab
          form={form}
          queuedBooks={queuedBooks}
          issueMutation={issueMutation}
          submitDisabled={submitDisabled}
          onSubmit={onSubmit}
          onCancel={handleCancel}
          assetData={tabAssetData}
          loading={tabAssetLoading}
          setQueuedBooks={setQueuedBooks}
          setTabAssetData={setTabAssetData}
          member={member}
          setSavedDocName={setSavedDocName}
          savedDocName={savedDocName}
          otpVerified={otpVerified}
          setOtpVerified={setOtpVerified}
          hasDueCharges={hasDueCharges}
          maxIssueDays={maxIssueDays}
        />
      </div>
      <div className={cn(activeTab !== "return" && "hidden", "mt-1")}>
        <ReturnTab
          queuedAssets={queuedAssets}
          loading={tabAssetLoading}
          returnMutation={returnMutation}
          onSubmitReturn={onSubmitReturn}
          member={member}
          savedDocName={savedDocName}
          setSavedDocName={setSavedDocName}
          otpVerified={otpVerified}
          setOtpVerified={setOtpVerified}
          setQueuedAssets={setQueuedAssets}
          hasDueCharges={hasDueCharges}
          returnDate={returnDate}
          setReturnDate={setReturnDate}
        />
      </div>
      <div className={cn(activeTab !== "renew" && "hidden", "mt-1")}>
        <RenewTab assetData={tabAssetData} setTabAssetData={setTabAssetData} loading={tabAssetLoading} renewMutation={renewMutation} onSubmitRenew={onSubmitRenew} hasDueCharges={hasDueCharges} maxIssueDays={maxIssueDays} member={member} />
      </div>
      <div className={cn(activeTab !== "reservation" && "hidden", "mt-1")}>
        <ReservationTab
          reservedAssets={reservedAssets}
          reservationDate={reservationDate}
          setReservationDate={setReservationDate}
          reservationRemarks={reservationRemarks}
          setReservationRemarks={setReservationRemarks}
          onSubmit={onSubmitReservation}
          loading={reservationMutation.isPending}
          submitDisabled={!member || reservedAssets.length === 0}
          onIssueAvailableBook={handleIssueAvailableBook}
        />
      </div>
    </div>
  );
};

export default TransactionTabs;
