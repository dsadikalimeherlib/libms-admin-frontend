import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays } from "date-fns";
import { Loader2, RefreshCw, ScanLine, Search, Undo2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  completeReturn,
  formatDisplayDate,
  issueBooks,
  lookupActiveTransaction,
  lookupBookByBarcode,
  renewBook,
  validateMember,
  type Book,
  type IssuePreviewRow,
  type Member,
  type TransactionLookup,
} from "@/lib/mock-library-api";

const issueFormSchema = z.object({
  memberQuery: z.string().trim().min(3, "Enter member ID, mobile, or card number."),
  barcode: z
    .string()
    .trim()
    .min(4, "Enter a valid barcode.")
    .or(z.literal("")),
});

const barcodeFormSchema = z.object({
  barcode: z.string().trim().min(4, "Enter a valid barcode."),
});

type IssueFormValues = z.infer<typeof issueFormSchema>;
type BarcodeFormValues = z.infer<typeof barcodeFormSchema>;

const buildIssuePreview = (book: Book): IssuePreviewRow => {
  const transactionDate = new Date();
  return {
    ...book,
    transactionDate: transactionDate.toISOString(),
    dueDate: addDays(transactionDate, 14).toISOString(),
  };
};

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
  <div className="section-frame grid gap-3 md:grid-cols-4">
    <div>
      <p className="section-heading">Member</p>
      <p className="mt-1 text-base font-semibold text-foreground">{member.name}</p>
    </div>
    <div>
      <p className="section-heading">Member ID</p>
      <p className="mt-1 text-sm text-foreground">{member.id}</p>
    </div>
    <div>
      <p className="section-heading">Card</p>
      <p className="mt-1 text-sm text-foreground">{member.cardNumber}</p>
    </div>
    <div>
      <p className="section-heading">Plan</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="data-chip">{member.plan}</span>
        <span className="data-chip">{member.status}</span>
      </div>
    </div>
  </div>
);

const SubmitBar = ({
  error,
  disabled,
  loading,
  label,
}: {
  error?: string;
  disabled: boolean;
  loading: boolean;
  label: string;
}) => (
  <div className="sticky-submit-bar">
    <RootError message={error} />
    <div className="flex justify-end md:ml-auto">
      <Button type="submit" variant="panel" size="lg" disabled={disabled} className="min-w-40">
        {loading ? <Loader2 className="animate-spin" /> : null}
        {label}
      </Button>
    </div>
  </div>
);

const IssueTab = () => {
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

  const memberMutation = useMutation({
    mutationFn: validateMember,
    onSuccess: (validatedMember) => {
      setMember(validatedMember);
      form.clearErrors("memberQuery");
      form.clearErrors("root");
      toast.success(`Member verified: ${validatedMember.name}`);
    },
    onError: (error: Error) => {
      setMember(null);
      form.setError("memberQuery", { message: error.message });
    },
  });

  const bookMutation = useMutation({
    mutationFn: lookupBookByBarcode,
    onSuccess: (book) => {
      if (queuedBooks.some((item) => item.barcode === book.barcode)) {
        form.setError("barcode", { message: "This barcode is already queued." });
        return;
      }

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
    mutationFn: () => issueBooks({ memberId: member!.id, barcodes: queuedBooks.map((item) => item.barcode) }),
    onSuccess: (result) => {
      setQueuedBooks([]);
      form.setValue("barcode", "", { shouldValidate: false });
      form.clearErrors();
      toast.success(`${result.rows.length} item(s) issued to ${result.member.name}.`);
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: Error) => {
      form.setError("root", { message: error.message });
    },
  });

  const submitDisabled = !member || queuedBooks.length === 0 || issueMutation.isPending;

  const onValidateMember = async () => {
    form.clearErrors("root");
    const valid = await form.trigger("memberQuery");
    if (!valid) return;
    memberMutation.mutate(form.getValues("memberQuery"));
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <section className="section-frame space-y-4">
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
                    <Input {...field} placeholder="MBR-1042 / 9876543210 / CARD-88421" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" onClick={onValidateMember} disabled={memberMutation.isPending} className="md:mt-8">
              {memberMutation.isPending ? <Loader2 className="animate-spin" /> : <Search />}
              Validate member
            </Button>
          </div>
          {member ? <MemberDetails member={member} /> : null}
        </section>

        <section className="section-frame space-y-4">
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
                          void onAddBook();
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="secondary" onClick={onAddBook} disabled={bookMutation.isPending} className="md:mt-8">
              {bookMutation.isPending ? <Loader2 className="animate-spin" /> : <ScanLine />}
              Add book
            </Button>
          </div>
        </section>

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
                  <TableHead>Author</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queuedBooks.length ? (
                  queuedBooks.map((book, index) => (
                    <TableRow key={book.barcode}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{book.accessNo}</TableCell>
                      <TableCell className="font-medium text-foreground">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.language}</TableCell>
                      <TableCell>{book.volume}</TableCell>
                      <TableCell>{formatDisplayDate(book.transactionDate)}</TableCell>
                      <TableCell>{formatDisplayDate(book.dueDate)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyStateRow message="No books added yet." colSpan={8} />
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
        />
      </form>
    </Form>
  );
};

const ReturnTab = () => {
  const queryClient = useQueryClient();
  const form = useForm<BarcodeFormValues>({
    resolver: zodResolver(barcodeFormSchema),
    defaultValues: { barcode: "" },
    mode: "onChange",
  });
  const [transaction, setTransaction] = useState<TransactionLookup | null>(null);

  const lookupMutation = useMutation({
    mutationFn: lookupActiveTransaction,
    onSuccess: (result) => {
      setTransaction(result);
      form.clearErrors();
      toast.success(`Active transaction found for ${result.member.name}.`);
    },
    onError: (error: Error) => {
      setTransaction(null);
      form.setError("barcode", { message: error.message });
    },
  });

  const returnMutation = useMutation({
    mutationFn: () => completeReturn(form.getValues("barcode")),
    onSuccess: (result) => {
      toast.success(
        result.dueCharges > 0
          ? `${result.title} returned. Due charges: ₹${result.dueCharges}.`
          : `${result.title} returned successfully.`,
      );
      setTransaction(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: Error) => {
      form.setError("root", { message: error.message });
    },
  });

  const onFetch = async () => {
    form.clearErrors("root");
    const valid = await form.trigger("barcode");
    if (!valid) return;
    lookupMutation.mutate(form.getValues("barcode"));
  };

  const onSubmit = () => {
    if (!transaction) {
      form.setError("root", { message: "Fetch a valid transaction before returning." });
      return;
    }

    returnMutation.mutate();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <section className="section-frame space-y-4">
          <div>
            <p className="section-heading">Return flow</p>
            <p className="mt-1 text-sm text-muted-foreground">Enter the barcode to load the borrower and charge summary.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Scan barcode"
                      autoComplete="off"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void onFetch();
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" onClick={onFetch} disabled={lookupMutation.isPending} className="md:mt-8">
              {lookupMutation.isPending ? <Loader2 className="animate-spin" /> : <Undo2 />}
              Fetch transaction
            </Button>
          </div>
          {transaction ? <MemberDetails member={transaction.member} /> : null}
        </section>

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
                {transaction ? (
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>{transaction.row.accessNo}</TableCell>
                    <TableCell className="font-medium text-foreground">{transaction.row.title}</TableCell>
                    <TableCell>{formatDisplayDate(transaction.row.transactionDate)}</TableCell>
                    <TableCell>{formatDisplayDate(transaction.row.dueDate)}</TableCell>
                    <TableCell>{formatDisplayDate(transaction.row.returnDate)}</TableCell>
                    <TableCell>{transaction.row.dueCharges ? `₹${transaction.row.dueCharges}` : "—"}</TableCell>
                  </TableRow>
                ) : (
                  <EmptyStateRow message="No return transaction loaded." colSpan={7} />
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <SubmitBar
          error={form.formState.errors.root?.message}
          disabled={!transaction || returnMutation.isPending}
          loading={returnMutation.isPending}
          label="Submit Return"
        />
      </form>
    </Form>
  );
};

const RenewTab = () => {
  const queryClient = useQueryClient();
  const form = useForm<BarcodeFormValues>({
    resolver: zodResolver(barcodeFormSchema),
    defaultValues: { barcode: "" },
    mode: "onChange",
  });
  const [transaction, setTransaction] = useState<TransactionLookup | null>(null);

  const lookupMutation = useMutation({
    mutationFn: lookupActiveTransaction,
    onSuccess: (result) => {
      setTransaction(result);
      form.clearErrors();
      toast.success(`Transaction ready for renewal: ${result.row.title}.`);
    },
    onError: (error: Error) => {
      setTransaction(null);
      form.setError("barcode", { message: error.message });
    },
  });

  const renewMutation = useMutation({
    mutationFn: () => renewBook(form.getValues("barcode")),
    onSuccess: (result) => {
      setTransaction((current) =>
        current
          ? {
              ...current,
              row: {
                ...current.row,
                dueDate: result.dueDate,
                returnDate: result.returnDate,
                dueCharges: result.dueCharges,
              },
            }
          : current,
      );
      toast.success(`Book renewed. New due date: ${formatDisplayDate(result.dueDate)}.`);
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: Error) => {
      form.setError("root", { message: error.message });
    },
  });

  const projectedReturnDate = useMemo(
    () => (transaction ? formatDisplayDate(transaction.row.returnDate) : "—"),
    [transaction],
  );

  const onFetch = async () => {
    form.clearErrors("root");
    const valid = await form.trigger("barcode");
    if (!valid) return;
    lookupMutation.mutate(form.getValues("barcode"));
  };

  const onSubmit = () => {
    if (!transaction) {
      form.setError("root", { message: "Load a valid transaction before renewing." });
      return;
    }

    renewMutation.mutate();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <section className="section-frame space-y-4">
          <div>
            <p className="section-heading">Renew flow</p>
            <p className="mt-1 text-sm text-muted-foreground">Scan the active loan, review charges, then extend the due date.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Scan barcode"
                      autoComplete="off"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void onFetch();
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="secondary" onClick={onFetch} disabled={lookupMutation.isPending} className="md:mt-8">
              {lookupMutation.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Fetch transaction
            </Button>
          </div>
          {transaction ? <MemberDetails member={transaction.member} /> : null}
        </section>

        <section className="section-frame space-y-4">
          <p className="section-heading">Renew transaction</p>
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
                {transaction ? (
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>{transaction.row.accessNo}</TableCell>
                    <TableCell className="font-medium text-foreground">{transaction.row.title}</TableCell>
                    <TableCell>{formatDisplayDate(transaction.row.transactionDate)}</TableCell>
                    <TableCell>{formatDisplayDate(transaction.row.dueDate)}</TableCell>
                    <TableCell>{projectedReturnDate}</TableCell>
                    <TableCell>{transaction.row.dueCharges ? `₹${transaction.row.dueCharges}` : "—"}</TableCell>
                  </TableRow>
                ) : (
                  <EmptyStateRow message="No renewal transaction loaded." colSpan={7} />
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <SubmitBar
          error={form.formState.errors.root?.message}
          disabled={!transaction || renewMutation.isPending}
          loading={renewMutation.isPending}
          label="Submit Renew"
        />
      </form>
    </Form>
  );
};

const tabs = [
  { value: "issue", label: "Issue" },
  { value: "return", label: "Return" },
  { value: "renew", label: "Renew" },
] as const;

const TransactionTabs = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["value"]>("issue");

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (typeof tabs)[number]["value"])}>
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
        <IssueTab />
      </TabsContent>
      <TabsContent value="return" forceMount className={cn(activeTab !== "return" && "hidden", "mt-5")}>
        <ReturnTab />
      </TabsContent>
      <TabsContent value="renew" forceMount className={cn(activeTab !== "renew" && "hidden", "mt-5")}> 
        <RenewTab />
      </TabsContent>
    </Tabs>
  );
};

export default TransactionTabs;
