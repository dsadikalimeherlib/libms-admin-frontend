import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UseFormReturn } from "react-hook-form";
import type { IssuePreviewRow } from "@/lib/mock-library-api";
import { IssueFormValues, TabAssetData, EmptyStateRow, SubmitBar } from "./TransactionTabs";

export interface IssueTabProps {
  form: UseFormReturn<IssueFormValues>;
  queuedBooks: IssuePreviewRow[];
  issueMutation: any;
  submitDisabled: boolean;
  onSubmit: () => void;
  assetData?: TabAssetData | null;
  loading?: boolean;
}

export const IssueTab = ({
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
      <section className="space-y-4">
        <div>
          <p className="section-heading">Issue transaction</p>
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

export default IssueTab;
