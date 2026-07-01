import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays } from "date-fns";
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
import { getMembers, validateMembers, validateMemberTransaction } from "@/services/members";
import { getAssetDetailFrappe, getBookTransactionDetails, submitBookIssue, submitBookReturn, submitBookRenew, type AssetByBarcodeMessage } from "@/services/books";
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
    transactionDate: transactionDate.toISOString(),
    dueDate: addDays(transactionDate, 30).toISOString(),
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
        variant="panel"
        size="lg"
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

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextSearchRef = useRef(false);
  const watchedQuery = form.watch("memberQuery");

  const loadMemberSuggestions = async (query: string) => {
    try {
      const result = (await getMembers({ text: query })) as MemberSuggestion[];
      setMemberSuggestions(result ?? []);
    } catch (error) {
      setMemberSuggestions([]);
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
    mutationFn: () => submitBookIssue({ member: member!, queuedBooks }),
    onSuccess: (result) => {
      setQueuedBooks([]);
      setMember(null);
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
    mutationFn: (totalDueCharges: number) => submitBookReturn({ member: member!, assetData: tabAssetData!, totalDueCharges }),
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

  const onSubmitReturn = (totalDueCharges: number) => {
    if (!member) { toast.error("Member is required."); return; }
    if (!tabAssetData?.member_details) { toast.error("Scan a barcode to load transaction details."); return; }
    returnMutation.mutate(totalDueCharges);
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

  const handleSuggestionClick = (selectionValue: string) => {
    skipNextSearchRef.current = true;
    form.setValue("memberQuery", selectionValue, { shouldValidate: false });
    setMemberSuggestions([]);
    setDropdownActive(false);
    validateMembers({ text: selectionValue }).then((validatedMember) => {
      setMember(validatedMember);
    }).catch((error: Error) => {
      setMember(null);
    });

    validateMemberTransaction({ text: selectionValue }).then((validatedMember) => {
      if (validatedMember.valid) {
        toast.success(`${validatedMember.message}`);
      } else {
        toast.error(`${validatedMember.message}`);
      }
    }).catch((error: Error) => {
      toast.error(`${error.message}`);
    });
  };

  const getAssetDetailFun = async (name: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("No token found");
    const { access_token } = JSON.parse(token);

    const data = await getAssetDetailFrappe(encodeURIComponent(name));


    const asset: AssetDoc = data.docs[0];


    const mappedBook: Book = {
      barcode: asset.name,
      accessNo: asset.name,
      title: asset.asset_name || asset.item_name || asset.name,
      author: "",
      language: "",
      volume: "",
      location: asset.location || "",
      status: asset.status || "",
    };

    setAssetDoc(asset);
    setScannedBook(mappedBook);
    form.setValue("barcode", "", { shouldValidate: false });
    form.clearErrors("barcode");
    setQueuedBooks((current) => [...current, buildIssuePreview(mappedBook)]);
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
      />

      <div className={cn(activeTab !== "issue" && "hidden", "mt-1")}>
        <IssueTab
          form={form}
          queuedBooks={queuedBooks}
          issueMutation={issueMutation}
          submitDisabled={submitDisabled}
          onSubmit={onSubmit}
          assetData={tabAssetData}
          loading={tabAssetLoading}
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
