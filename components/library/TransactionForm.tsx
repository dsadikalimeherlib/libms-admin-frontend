import { useEffect, useState, useRef } from "react";
import { Loader2, ScanLine, Camera } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Member, Book } from "@/lib/mock-library-api";
import { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IssueFormValues, AssetDoc, MemberSuggestion, TabAssetData } from "./TransactionTabs";
import { getMemberImage } from "@/services/members";
import { BarcodeScanner } from "./BarcodeScanner";
import { toast } from "react-toastify";
import { searchFrappeLink, selectBook, type SearchLinkResult, type SelectBookResult } from "@/services/books";
export const MemberDetails = ({ member }: { member: Member }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    setPhotoUrl(null);
    getMemberImage({ docname: member.name })
      .then((msg) => {
        if (msg?.photo) {
          setPhotoUrl(msg.photo);
        }
      })
      .catch(() => { });
  }, [member.name]);

  return (
    <div className="section-frame grid gap-3 md:grid-cols-3">
      {/* Avatar + name block spanning all columns */}
      <div className="md:col-span-3 flex items-center gap-4">

        {photoUrl && (
          <div className="h-60 w-60 shrink-0 overflow-hidden bg-muted flex items-center justify-center border rounded-md">
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}${photoUrl}`}
              alt={member.member_name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className=" grid gap-3 md:grid-cols-2">
          <div>
            <p className="section-heading">Member ID</p>
            <p className="text-sm text-foreground">{member.name}</p>
          </div>
          <div>
            <p className="section-heading">Name</p>
            <p className="text-sm text-foreground">{member.member_name}</p>
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
      </div>

    </div>
  );
};

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

  getAssetDetailFun: (v: string) => void;
  scannedBook: Book | null;
  activeTab: string;
  setActiveTab: (v: any) => void;
  tabs: readonly { value: string; label: string }[];
  setTabAssetData: (v: TabAssetData | null) => void;
  memberLoading?: boolean;
  hasDueCharges?: boolean;
  setReservedAssets?: (assets: SelectBookResult[]) => void;
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

  getAssetDetailFun,
  scannedBook,
  activeTab,
  setActiveTab,
  tabs,
  setTabAssetData,
  memberLoading = false,
  hasDueCharges = false,
  setReservedAssets,
}: TransactionFormProps) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [bookSuggestions, setBookSuggestions] = useState<SearchLinkResult[]>([]);
  const [bookInputFocused, setBookInputFocused] = useState(false);
  const [bookDropdownActive, setBookDropdownActive] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);

  const watchedBarcode = form.watch("barcode");
  const barcodeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextBarcodeSearchRef = useRef(false);

  const loadBookSuggestions = async (query: string) => {
    if (activeTab !== "reservation" || !query || query.length < 3) {
      setBookSuggestions([]);
      return;
    }
    setBookLoading(true);
    try {
      const result = await searchFrappeLink({ txt: query, doctype: "Book", reference_doctype: "Book Reservation" });
      setBookSuggestions(result.message ?? []);
    } catch (error) {
      setBookSuggestions([]);
    } finally {
      setBookLoading(false);
    }
  };

  useEffect(() => {
    if (skipNextBarcodeSearchRef.current) {
      skipNextBarcodeSearchRef.current = false;
      return;
    }
    if (barcodeDebounceRef.current) clearTimeout(barcodeDebounceRef.current);
    barcodeDebounceRef.current = setTimeout(() => {
      void loadBookSuggestions(watchedBarcode);
    }, 500);

    return () => {
      if (barcodeDebounceRef.current) clearTimeout(barcodeDebounceRef.current);
    };
  }, [watchedBarcode, activeTab]);

  const handleBookSuggestionClick = async (selectionValue: string) => {
    skipNextBarcodeSearchRef.current = true;
    form.setValue("barcode", selectionValue, { shouldValidate: true });
    setBookSuggestions([]);
    setBookDropdownActive(false);

    if (activeTab === "reservation") {
      try {
        const result = await selectBook({ item_code: selectionValue });
        if (setReservedAssets) {
          setReservedAssets(result.message || []);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch reservation books");
      }
    } else {
      getAssetDetailFun(selectionValue);
    }
  };

  const handleScanSuccess = (barcode: string) => {
    form.setValue("barcode", barcode, { shouldValidate: true });
    getAssetDetailFun(barcode);
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="flex-1 space-y-4 max-w-[200px]">
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
        <div className="flex gap-6">


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
                    <FormLabel>Member information</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          autoComplete="off"
                          onFocus={() => setMemberInputFocused(true)}
                          onBlur={() => setMemberInputFocused(false)}
                        />
                        {memberLoading && (
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
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
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-start">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Book information</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          disabled={hasDueCharges}
                          onFocus={() => setBookInputFocused(true)}
                          onBlur={() => setBookInputFocused(false)}
                          onChange={(e) => {
                            if (activeTab === "issue") {
                              if (!member || member.is_valid_membership === false) {
                                const msg = !member ? "Please enter Member ID before barcode scan " : "Membership is not valid";
                                toast.error(msg, { toastId: "barcode-err" });
                                return;
                              }
                            }
                            form.clearErrors("barcode");
                            field.onChange(e);
                          }}
                          placeholder={activeTab === "reservation" ? "Search Book" : "Scan or type barcode"}
                          autoComplete="off"
                          onKeyDown={(event) => {
                            if (activeTab === "issue") {
                              if (!member || member.is_valid_membership === false) {
                                event.preventDefault();
                                const msg = !member ? "Please enter Member ID before barcode scan " : "Membership is not valid";
                                toast.error(msg, { toastId: "barcode-err" });
                                return;
                              }
                            }
                            if (event.key === "Enter") {
                              event.preventDefault();
                              getAssetDetailFun(field.value);
                            }
                          }}
                        />
                        {bookLoading && (
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    {bookSuggestions?.length > 0 && (bookInputFocused || bookDropdownActive) && (
                      <div
                        className="mt-2 max-h-40 overflow-y-auto border rounded-md bg-background absolute z-10 w-full"
                        onMouseEnter={() => setBookDropdownActive(true)}
                        onMouseLeave={() => setBookDropdownActive(false)}
                      >
                        {bookSuggestions.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => handleBookSuggestionClick(m.value)}
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
              {
                activeTab !== "reservation" &&
                <Button type="button" variant="secondary" onClick={() => setIsScannerOpen(true)} className="md:mt-6">
                  <ScanLine />
                  Add book
                </Button>
              }
            </div>

            {scannedBook ? <BookDetails book={scannedBook} /> : null}
          </section>
        </div>


      </div>
      <BarcodeScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScanSuccess={handleScanSuccess}
      />
    </Form>
  );
};
