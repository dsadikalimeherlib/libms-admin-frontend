import { Loader2, ScanLine } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Member, Book } from "@/lib/mock-library-api";
import { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IssueFormValues, AssetDoc, MemberSuggestion, TabAssetData } from "./TransactionTabs";

export const MemberDetails = ({ member }: { member: Member }) => (
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

export const BookDetails = ({ book, asset }: { book: Book; asset?: AssetDoc | null }) => (
  <div className="section-frame grid gap-3 md:grid-cols-2">
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

export interface TransactionFormProps {
  form: UseFormReturn<IssueFormValues>;
  member: Member | null;
  setMember: (m: Member | null) => void;
  setQueuedBooks: (b: any[]) => void;
  setScannedBook: (b: Book | null) => void;
  setAssetDoc: (a: AssetDoc | null) => void;
  memberInputFocused: boolean;
  setMemberInputFocused: (v: boolean) => void;
  dropdownActive: boolean;
  setDropdownActive: (v: boolean) => void;
  memberSuggestions: MemberSuggestion[];
  handleSuggestionClick: (v: string) => void;
  onAddBook: () => void;
  bookMutation: any;
  getAssetDetailFun: (v: string) => void;
  scannedBook: Book | null;
  activeTab: string;
  setActiveTab: (v: any) => void;
  tabs: readonly { value: string; label: string }[];
  setTabAssetData: (v: TabAssetData | null) => void;
}

export const TransactionForm = ({
  form,
  member,
  setMember,
  setQueuedBooks,
  setScannedBook,
  setAssetDoc,
  memberInputFocused,
  setMemberInputFocused,
  dropdownActive,
  setDropdownActive,
  memberSuggestions,
  handleSuggestionClick,
  onAddBook,
  bookMutation,
  getAssetDetailFun,
  scannedBook,
  activeTab,
  setActiveTab,
  tabs,
  setTabAssetData,
}: TransactionFormProps) => {
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            {/* <div>
              <p className="section-heading">Step 1 · Transaction Types</p>
              <p className="mt-1 text-sm text-muted-foreground">Select transaction types: Issue, Return, Renew</p>
            </div> */}
            <FormLabel>Transaction type</FormLabel>
            <Select
              value={activeTab}
              onValueChange={(value) => {
                const tab = value;
                setActiveTab(tab);
                setMember(null);
                setQueuedBooks([]);
                setScannedBook(null);
                setAssetDoc(null);
                setTabAssetData(null);
                form.clearErrors();
                form.setValue("memberQuery", "", { shouldValidate: false });
                form.setValue("barcode", "", { shouldValidate: false });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                {tabs.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <section className="space-y-4 flex-1">
            {/* <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-heading">Step 2 · Member validation</p>
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
            </div> */}
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

          <section className="space-y-4 flex-1">
            {/* <div>
              <p className="section-heading">Step 3 · Barcode input</p>
              <p className="mt-1 text-sm text-muted-foreground">Manual entry or scanner-ready wedge input supported.</p>
            </div> */}
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


      </div>
    </Form>
  );
};
