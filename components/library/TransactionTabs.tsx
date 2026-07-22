import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, addMonths, format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";


import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  cn,
} from "@/lib/utils";
import {
  type Book,
  type IssuePreviewRow,
  type Member,
} from "@/lib/mock-library-api";
import { getMembers, getMemberCustomer, validateMembers, validateMemberTransaction } from "@/services/members";
import { getBookTransactionDetails, submitBookIssue, submitBookReturn, submitBookRenew, getAssetByBarcode, type AssetByBarcodeMessage, validateMemberToIssueBook, countBooksIssued } from "@/services/books";
import { toast } from "react-toastify";

import { IssueTab } from "./IssueTab";
import { ReturnTab } from "./ReturnTab";
import { RenewTab } from "./RenewTab";
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

const buildIssuePreview = (book: Book): IssuePreviewRow => {
  const transactionDate = new Date();
  return {
    ...book,
    transactionDate: format(transactionDate, 'yyyy-MM-dd'),
    dueDate: format(addMonths(transactionDate, 1), 'yyyy-MM-dd'),
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

const RootError = ({ message }: { message?: string }) =>
  message ? <div className="inline-feedback">{message}</div> : null;

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
}: {
  error?: string;
  disabled: boolean;
  loading: boolean;
  label: string;
  onClick?: () => void;
}) => (
  <div className="">
    <RootError message={error} />
    <div className="flex justify-end md:ml-auto">
      <Button
        type={onClick ? "button" : "submit"}
        onClick={onClick}
        disabled={disabled}
        className="min-w-40"
      >
        {loading ? <Loader2 className="animate-spin" /> : null}
        {label}
      </Button>
    </div>
  </div>
);







const tabs = [
  { value: "issue", label: "Issue" },
  { value: "return", label: "Return" },
  { value: "renew", label: "Renew" },
] as const;

const TransactionTabs = () => {
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
  const [tabAssetLoading, setTabAssetLoading] = useState(false);
  const [memberSuggestions, setMemberSuggestions] = useState<MemberSuggestion[]>([]);
  const [memberInputFocused, setMemberInputFocused] = useState(false);
  const [dropdownActive, setDropdownActive] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [savedDocName, setSavedDocName] = useState<string>("");
  const [otpVerified, setOtpVerified] = useState<boolean>(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextSearchRef = useRef(false);
  const watchedQuery = form.watch("memberQuery");

  const loadMemberSuggestions = async (query: string) => {
    setMemberLoading(true);
    try {
      const result = (await getMembers({ text: query })) as MemberSuggestion[];
      setMemberSuggestions(result ?? []);
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
  }, [activeTab]);

  useEffect(() => {
    setSavedDocName("");
    setOtpVerified(false);
  }, [member?.name]);



  const bookMutation = useMutation({
    mutationFn: (barcode: string) =>
      getBookTransactionDetails({
        barcode,
        member: member?.name || "",
        transaction_type: activeTab === "issue" ? "Issue" : activeTab === "return" ? "Return" : "Renew",
      }),
    onSuccess: (book) => {
      if (queuedBooks.some((item) => item.barcode === book.barcode)) {
        form.setError("barcode", { message: "This barcode is already queued." });
        return;
      }

      setScannedBook(book);
      setQueuedBooks((current) => [...current, buildIssuePreview(book)]);
      form.setValue("barcode", "", { shouldValidate: false });
      form.clearErrors("barcode");
      form.clearErrors("root");
      toast.success(`${book.title} added to the issue queue.`);
    },
    onError: (error: Error) => {
      form.setError("barcode", { message: error.message });
    },
  });

  const issueMutation = useMutation({
    mutationFn: () => submitBookIssue({ member: member!, queuedBooks, barcode: form.getValues("barcode"), savedDocName }),
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
      toast.success(`${result.rows.length} item(s) issued to ${result.member.name}.`);
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: Error) => {
      form.setError("root", { message: error.message });
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ totalDueCharges, createInvoice }: { totalDueCharges: number, createInvoice: number }) => submitBookReturn({ member: member!, assetData: tabAssetData!, totalDueCharges, createInvoice }),
    onSuccess: () => {
      setTabAssetData(null);
      setScannedBook(null);
      toast.success("Book returned successfully.");
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const renewMutation = useMutation({
    mutationFn: (totalDueCharges: number) => submitBookRenew({ member: member!, assetData: tabAssetData!, totalDueCharges }),
    onSuccess: () => {
      setTabAssetData(null);
      setScannedBook(null);
      toast.success("Book renewed successfully.");
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const submitDisabled = !member || queuedBooks.length === 0 || issueMutation.isPending;

  const onSubmitReturn = (totalDueCharges: number, createInvoice: number) => {
    if (!member) { toast.error("Member is required."); return; }
    if (!tabAssetData?.member_details) { toast.error("Scan a barcode to load transaction details."); return; }
    returnMutation.mutate({ totalDueCharges, createInvoice });
  };

  const onSubmitRenew = (totalDueCharges: number) => {
    if (!member) { toast.error("Member is required."); return; }
    if (!tabAssetData?.member_details) { toast.error("Scan a barcode to load transaction details."); return; }
    renewMutation.mutate(totalDueCharges);
  };

  const onAddBook = async () => {
    form.clearErrors("root");
    if (!member) {
      form.setError("root", { message: "Validate a member before adding books." });
      return;
    }

    const valid = await form.trigger("barcode");
    if (!valid) return;

    bookMutation.mutate(form.getValues("barcode"));
  };

  const onSubmit = () => {
    if (!member) {
      form.setError("root", { message: "Member is required before issuing books." });
      return;
    }

    if (queuedBooks.length === 0) {
      form.setError("root", { message: "Add at least one book before submitting." });
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
    setSavedDocName("");
    setOtpVerified(false);
    setMemberSuggestions([]);
    setDropdownActive(false);
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
      if (activeTab === 'issue') {
        const issuedCountData = await countBooksIssued({ member: selectionValue });
        const limitData = await validateMemberToIssueBook({ member: selectionValue });
        const issuedCount = issuedCountData?.message?.count || 0;
        const limitArray = limitData?.message;
        const limit = limitArray && limitArray.length > 0 ? Number(limitArray[0]) : 0;

        if (limit <= issuedCount) {
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
    } catch (error: any) {
      setMember(null);
      toast.error(error?.message ?? "Member validation failed.");
    } finally {
      setMemberLoading(false);
    }
  };

  const getAssetDetailFun = async (name: string) => {
    try {
      setTabAssetLoading(true);
      const transactionType = activeTab === "issue" ? "Issue" : activeTab === "return" ? "Return" : "Renew";
      const data = await getAssetByBarcode({
        barcode: name,
        member: member?.name || "",
        transactionType,
      });

      if (activeTab === "return" && member?.name && data.member_details?.member && member.name !== data.member_details.member) {
        toast.error("This book does not belong to the same member.");
        form.setValue("barcode", "", { shouldValidate: false });
        form.clearErrors("barcode");
        return;
      }

      const memberQueryValue = form.getValues("memberQuery");
      if (activeTab === "return" && !memberQueryValue && data.member_details?.member) {
        const memberId = data.member_details.member;
        form.setValue("memberQuery", memberId, { shouldValidate: false });
        const validatedMember = await validateMembers({ text: memberId });
        await validateMemberToIssueBook({ member: memberId });
        setMember(validatedMember);
      }

      if (activeTab === "issue" || activeTab === "renew") {
        const allowedData = await validateMemberToIssueBook({
          member: member?.name || "",
        })
        if (allowedData.message.length == 0) {
          toast.error(allowedData.message);
          setMember(null);
          form.setValue("memberQuery", "", { shouldValidate: false });
          form.setValue("barcode", "", { shouldValidate: false });
          form.clearErrors();
          return;
        }
      }
      if (activeTab === "issue") {
        const tDate = new Date();
        data.transactionDate = format(tDate, 'yyyy-MM-dd');

        let finalDueDate = format(addMonths(tDate, 1), 'yyyy-MM-dd');
        if (member?.due_date) {
          const memberDueDate = new Date(member.due_date);
          const oneMonthLater = addMonths(tDate, 1);
          if (memberDueDate < oneMonthLater) {
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
      setQueuedBooks((current) => [...current, buildIssuePreview(mappedBook)]);
    } catch (error: any) {
      toast.error(error.message);
      form.setValue("barcode", "", { shouldValidate: false });
      form.clearErrors();
    } finally {
      setTabAssetLoading(false);
    }
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
        onAddBook={onAddBook}
        bookMutation={bookMutation}
        getAssetDetailFun={getAssetDetailFun}
        scannedBook={scannedBook}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        setTabAssetData={setTabAssetData}
        memberLoading={memberLoading}
      />

      <div className={cn(activeTab !== "issue" || activeTab !== "issue" && "hidden", "mt-1")}>
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
        />
      </div>
      <div className={cn(activeTab !== "return" && "hidden", "mt-1")}>
        <ReturnTab assetData={tabAssetData} loading={tabAssetLoading} returnMutation={returnMutation} onSubmitReturn={onSubmitReturn} />
      </div>
      <div className={cn(activeTab !== "renew" && "hidden", "mt-1")}>
        <RenewTab assetData={tabAssetData} loading={tabAssetLoading} renewMutation={renewMutation} onSubmitRenew={onSubmitRenew} />
      </div>
    </div>
  );
};

export default TransactionTabs;
