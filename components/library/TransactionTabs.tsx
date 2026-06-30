import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays } from "date-fns";
import { Loader2, ScanLine } from "lucide-react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";


import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cn,
} from "@/lib/utils";
import {
  formatDisplayDate,
  validateMember,
  type Book,
  type IssuePreviewRow,
  type Member,
} from "@/lib/mock-library-api";
import { getMembers, validateMembers, validateMemberTransaction } from "@/services/members";
import { getAssetByBarcode, getAssetDetailFrappe, getBookTransactionDetails, submitBookIssue, submitBookReturn, submitBookRenew, type AssetByBarcodeMessage } from "@/services/books";
import { toast } from "react-toastify";

const issueFormSchema = z.object({
  memberQuery: z.string().trim(),
  barcode: z
    .string()
    .trim()
    .min(4, "Enter a valid barcode.")
    .or(z.literal("")),
});

type IssueFormValues = z.infer<typeof issueFormSchema>;

const buildIssuePreview = (book: Book): IssuePreviewRow => {
  const transactionDate = new Date();
  return {
    ...book,
    transactionDate: transactionDate.toISOString(),
    dueDate: addDays(transactionDate, 30).toISOString(),
  };
};

type MemberSuggestion = {
  id: string;
  value: string;
  description: string;
};

type AssetDoc = {
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

type TabAssetData = AssetByBarcodeMessage;

const RootError = ({ message }: { message?: string }) =>
  message ? <div className="inline-feedback">{message}</div> : null;

const EmptyStateRow = ({ message, colSpan }: { message: string; colSpan: number }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
      {message}
    </TableCell>
  </TableRow>
);

const MemberDetails = ({ member }: { member: Member }) => (
  <div className="section-frame grid gap-3 md:grid-cols-2">
    <div>

      <p className="section-heading">Member</p>
      <p className="mt-1 text-base font-semibold text-foreground">{member.member_name}</p>
    </div>
    <div>
      <p className="section-heading">Member ID</p>
      <p className="mt-1 text-sm text-foreground">{member.name}</p>
    </div>
    <div>
      <p className="section-heading">Mobile</p>
      <p className="mt-1 text-sm text-foreground">{member.mobile}</p>
    </div>
    <div>
      <p className="section-heading">Plan</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="data-chip">{member.membership_status}</span>
      </div>
    </div>
  </div>
);

const BookDetails = ({ book, asset }: { book: Book; asset?: AssetDoc | null }) => (
  <div className="section-frame grid gap-3 md:grid-cols-2">
    {
      console.log('book111', book, asset)

    }
    <div className="md:col-span-2">
      <p className="section-heading">Book Title</p>
      <p className="mt-1 text-base font-semibold text-foreground">{book.title}</p>
    </div>
    <div>
      <p className="section-heading">Asset ID</p>
      <p className="mt-1 text-sm text-foreground">{book.barcode}</p>
    </div>
    {asset?.item_code ? (
      <div>
        <p className="section-heading">Item Code</p>
        <p className="mt-1 text-sm text-foreground">{asset.item_code}</p>
      </div>
    ) : null}
    {asset?.asset_category ? (
      <div>
        <p className="section-heading">Category</p>
        <p className="mt-1 text-sm text-foreground">{asset.asset_category}</p>
      </div>
    ) : null}
    <div>
      <p className="section-heading">Location</p>
      <p className="mt-1 text-sm text-foreground">{book.location}</p>
    </div>
    <div>
      <p className="section-heading">Status</p>
      <div className="mt-1">
        <span className="data-chip">{book.status}</span>
      </div>
    </div>
    {asset?.donated_book ? (
      <div>
        <p className="section-heading">Donated</p>
        <p className="mt-1 text-sm text-foreground">{asset.donated_book}</p>
      </div>
    ) : null}
    {book.author ? (
      <div>
        <p className="section-heading">Author</p>
        <p className="mt-1 text-sm text-foreground">{book.author}</p>
      </div>
    ) : null}
    {book.language ? (
      <div>
        <p className="section-heading">Language</p>
        <p className="mt-1 text-sm text-foreground">{book.language}</p>
      </div>
    ) : null}
    {book.volume ? (
      <div>
        <p className="section-heading">Volume</p>
        <p className="mt-1 text-sm text-foreground">{book.volume}</p>
      </div>
    ) : null}
  </div>
);

const SubmitBar = ({
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
  <div className="sticky-submit-bar">
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

interface IssueTabProps {
  form: UseFormReturn<IssueFormValues>;
  queuedBooks: IssuePreviewRow[];
  issueMutation: any;
  submitDisabled: boolean;
  onSubmit: () => void;
  assetData?: TabAssetData | null;
  loading?: boolean;
}

const IssueTab = ({
  form,
  queuedBooks,
  issueMutation,
  submitDisabled,
  onSubmit,
  assetData,
  loading,
}: IssueTabProps) => {
  return (
    <div className="space-y-6">
      <section className="section-frame space-y-4">
        <div>
          <p className="section-heading">Step 3 · Transaction data</p>
          <p className="mt-1 text-sm text-muted-foreground">Review queued books before issuing.</p>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto animate-spin" />
                  </TableCell>
                </TableRow>
              ) : assetData ? (
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>{assetData.asset_id}</TableCell>
                  <TableCell className="font-medium text-foreground">{assetData.asset_name}</TableCell>
                  <TableCell>{assetData.authors?.join(", ") || "—"}</TableCell>
                  <TableCell>{assetData.languages?.join(", ") || "—"}</TableCell>
                  <TableCell>{assetData.volume || "—"}</TableCell>
                </TableRow>
              ) : (
                <EmptyStateRow message="Scan a barcode above and click Issue tab to load book details." colSpan={6} />
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <SubmitBar
        error={form.formState.errors.root?.message}
        disabled={submitDisabled}
        loading={issueMutation.isPending}
        label="Submit Issue"
        onClick={onSubmit}
      />
    </div>
  );
};

const ReturnTab = ({
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
      <section className="section-frame space-y-4">
        <p className="section-heading">Return transaction</p>
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

const RenewTab = ({
  assetData,
  loading,
  renewMutation,
  onSubmitRenew,
}: {
  assetData?: TabAssetData | null;
  loading?: boolean;
  renewMutation: any;
  onSubmitRenew: (totalDueCharges: number) => void;
}) => {
  const md = assetData?.member_details;
  const submitDisabled = !assetData || !md || renewMutation.isPending;
  const [totalDueCharges, setTotalDueCharges] = useState(0);

  useEffect(() => {
    setTotalDueCharges(assetData?.total_due_charges || 0);
  }, [assetData]);

  return (
    <div className="space-y-6">
      <section className="section-frame space-y-4">
        <p className="section-heading">Renew transaction</p>
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
                <TableHead>Renew Date</TableHead>
                <TableHead>Due Charges</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
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
                  <TableCell>{formatDisplayDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}</TableCell>
                  <TableCell>{assetData.total_due_charges ?? 0}</TableCell>
                </TableRow>
              ) : (
                <EmptyStateRow message="Scan a barcode above and click Renew tab to load transaction." colSpan={8} />
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
        loading={renewMutation.isPending}
        label="Submit Renew"
        onClick={() => onSubmitRenew(totalDueCharges)}
      />
    </div>
  );
};

const tabs = [
  { value: "issue", label: "Issue" },
  { value: "return", label: "Return" },
  { value: "renew", label: "Renew" },
] as const;

const TransactionTabs = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["value"]>("");

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
    <Form {...form}>
      <div className="space-y-6">
        <div className="flex gap-6">
          <section className="space-y-4 w-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-heading">Step 1 · Member validation</p>
                <p className="mt-1 text-sm text-muted-foreground">Validate by member ID, mobile, or card number.</p>
              </div>
              {member ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMember(null);
                    setQueuedBooks([]);
                    setScannedBook(null);
                    setAssetDoc(null);
                    form.clearErrors();
                  }}
                >
                  Reset member
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <FormField
                control={form.control}
                name="memberQuery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member search</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="MBR-1042 / 9876543210 / CARD-88421"
                        autoComplete="off"
                        onFocus={() => setMemberInputFocused(true)}
                        onBlur={() => setMemberInputFocused(false)}
                      />
                    </FormControl>
                    <FormMessage />
                    {memberSuggestions?.length > 0 && (memberInputFocused || dropdownActive) && (
                      <div
                        className="mt-2 max-h-40 overflow-y-auto border rounded-md bg-background"
                        onMouseEnter={() => setDropdownActive(true)}
                        onMouseLeave={() => setDropdownActive(false)}
                      >
                        {memberSuggestions.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => handleSuggestionClick(m.value || m.id)}
                          >
                            <div className="font-medium">{m.value}</div>
                            <div className="text-sm text-muted-foreground">{m.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </div>
            {member ? <MemberDetails member={member} /> : null}
          </section>

          <section className="space-y-4 w-full">
            <div>
              <p className="section-heading">Step 2 · Barcode input</p>
              <p className="mt-1 text-sm text-muted-foreground">Manual entry or scanner-ready wedge input supported.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Book barcode</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Scan or type barcode"
                        autoComplete="off"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            // void onAddBook();
                            getAssetDetailFun(field.value);

                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="secondary" onClick={onAddBook} disabled={bookMutation.isPending} className="md:mt-6">
                {bookMutation.isPending ? <Loader2 className="animate-spin" /> : <ScanLine />}
                Add book
              </Button>
            </div>

            {scannedBook ? <BookDetails book={scannedBook} /> : null}
          </section>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={async (value) => {
            const tab = value as (typeof tabs)[number]["value"];
            setActiveTab(tab);
            if (scannedBook?.barcode && member?.name) {
              setTabAssetLoading(true);
              setTabAssetData(null);
              try {
                const result = await getAssetByBarcode({
                  barcode: scannedBook.barcode,
                  member: member.name,
                  transactionType: tab === "return" ? "Return" : tab === "renew" ? "Renew" : "Issue",
                });
                setTabAssetData(result);
              } catch (err) {
                // toast.error(err instanceof Error ? err.message : "Failed to fetch transaction details.");
              } finally {
                setTabAssetLoading(false);
              }
            }
          }}
        >
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-lg border border-border/70 bg-muted/70 p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-md px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-panel"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="issue" forceMount className={cn(activeTab !== "issue" && "hidden", "mt-5")}>
            <IssueTab
              form={form}
              queuedBooks={queuedBooks}
              issueMutation={issueMutation}
              submitDisabled={submitDisabled}
              onSubmit={onSubmit}
              assetData={tabAssetData}
              loading={tabAssetLoading}
            />
          </TabsContent>
          <TabsContent value="return" forceMount className={cn(activeTab !== "return" && "hidden", "mt-5")}>
            <ReturnTab assetData={tabAssetData} loading={tabAssetLoading} returnMutation={returnMutation} onSubmitReturn={onSubmitReturn} />
          </TabsContent>
          <TabsContent value="renew" forceMount className={cn(activeTab !== "renew" && "hidden", "mt-5")}>
            <RenewTab assetData={tabAssetData} loading={tabAssetLoading} renewMutation={renewMutation} onSubmitRenew={onSubmitRenew} />
          </TabsContent>
        </Tabs>
      </div>
    </Form>
  );
};

export default TransactionTabs;
