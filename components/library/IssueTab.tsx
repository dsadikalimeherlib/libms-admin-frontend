import { Loader2 } from "lucide-react";
import { format, addMonths } from "date-fns";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UseFormReturn } from "react-hook-form";
import type { IssuePreviewRow } from "@/lib/mock-library-api";
import { IssueFormValues, TabAssetData, SubmitBar } from "./TransactionTabs";
import { Button } from "@/components/ui/button";

export interface IssueTabProps {
  form: UseFormReturn<IssueFormValues>;
  queuedBooks: IssuePreviewRow[];
  issueMutation: any;
  submitDisabled: boolean;
  onSubmit: () => void;
  assetData?: TabAssetData | null;
  loading?: boolean;
  setQueuedBooks?: (books: IssuePreviewRow[]) => void;
  setTabAssetData?: (data: TabAssetData | null) => void;
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
  assetData,
  loading,
  setQueuedBooks,
  setTabAssetData,
}: IssueTabProps) => {
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
            {assetData?.dueDate ? <p className="mt-1 text-sm text-foreground">{format(new Date(assetData.dueDate), 'dd-MM-yyyy')}</p> : <p className="mt-1 text-sm text-foreground">--</p>}
          </div>
        </div>
        {/* <div className="table-shell">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
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
                  </TableRow>
                ))
              ) : (
                <EmptyStateRow message="Scan a barcode above and click Issue tab to load book details." colSpan={8} />
              )}
            </TableBody>
          </Table>


          
        </div> */}
      </section>

      <div className="">
        <RootError message={error} />
        <div className="flex justify-end md:ml-auto gap-3">
          <Button>Member Verification</Button>
          <Button
            type="submit"
            disabled={disabled}
          >
            {loading ? <Loader2 className="animate-spin" /> : null}
            Submit Issue
          </Button>
          <Button>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export default IssueTab;
