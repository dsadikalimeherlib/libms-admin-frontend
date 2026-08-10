import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Settings, Loader2 } from "lucide-react";
import type { SelectBookResult } from "@/services/books";

export const ReservationTab = ({
  reservedAssets = [],
  reservationDate,
  setReservationDate,
  onSubmit,
  loading
}: {
  reservedAssets?: SelectBookResult[];
  reservationDate?: string;
  setReservationDate?: (val: string) => void;
  onSubmit?: () => void;
  loading?: boolean;
}) => {
  return (
    <div className="space-y-8 p-1 pt-4">
      {/* Top Section */}


      <div className="border-t border-border my-6"></div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Reservation Information */}
        <div className="space-y-4">
          <h3 className="font-bold text-base">Reservation Information</h3>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Reservation Date</label>
            <Input
              type="date"
              value={reservationDate}
              onChange={(e) => setReservationDate?.(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="bg-muted/30 border-muted"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Reservation Remarks</label>
            <textarea className="flex min-h-[150px] w-full rounded-md border border-muted bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" readOnly />
          </div>
        </div>

        {/* Book Reservation Details */}
        <div className="space-y-4">
          <h3 className="font-bold text-base">Book Reservation Details</h3>

          <div className="border border-muted rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12"><input type="checkbox" className="rounded border-muted-foreground" disabled /></TableHead>
                  <TableHead className="text-muted-foreground font-medium">Access No</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Book Name</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Book Status</TableHead>
                  <TableHead className="w-12"><Settings className="w-4 h-4 text-muted-foreground" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservedAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No books selected
                    </TableCell>
                  </TableRow>
                ) : (
                  reservedAssets.map((asset, idx) => {
                    console.log('asset1111', asset);
                    if (asset.status.toLowerCase() == 'available') {
                      return (
                        <TableRow key={idx}>
                          <TableCell><input type="checkbox" className="rounded border-muted-foreground" disabled /></TableCell>
                          <TableCell className="font-medium text-foreground">{asset.name}</TableCell>
                          <TableCell className="text-foreground">{asset.asset_name}</TableCell>
                          <TableCell className="text-foreground">{asset.status}</TableCell>
                          <TableCell><Pencil className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" /></TableCell>
                        </TableRow>
                      )
                    } else {
                      return (
                        <></>
                      )
                    }
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="border-t border-border my-6"></div>


      <div className="flex justify-end items-center w-full">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md flex items-center justify-center disabled:opacity-50"
        >
          {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          Submit
        </button>
      </div>
    </div>
  );
};

export default ReservationTab;
