import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Settings } from "lucide-react";

export const ReservationTab = () => {
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
            <Input value="30-07-2026" readOnly className="bg-muted/30 border-muted" />
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
                <TableRow>
                  <TableCell><input type="checkbox" className="rounded border-muted-foreground" disabled /></TableCell>
                  <TableCell className="font-medium text-foreground">ACC-ASS-2025-000...</TableCell>
                  <TableCell className="text-foreground">Test Book Title</TableCell>
                  <TableCell className="text-foreground">Issue</TableCell>
                  <TableCell><Pencil className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><input type="checkbox" className="rounded border-muted-foreground" disabled /></TableCell>
                  <TableCell className="font-medium text-foreground">ACC-ASS-2025-000...</TableCell>
                  <TableCell className="text-foreground">Test Book Title</TableCell>
                  <TableCell className="text-foreground">Issue</TableCell>
                  <TableCell><Pencil className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><input type="checkbox" className="rounded border-muted-foreground" disabled /></TableCell>
                  <TableCell className="font-medium text-foreground">ACC-ASS-2025-000...</TableCell>
                  <TableCell className="text-foreground">Test Book Title</TableCell>
                  <TableCell className="text-foreground">Cancelled</TableCell>
                  <TableCell><Pencil className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="border-t border-border my-6"></div>

      {/* Schedule Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Schedule</label>
            <Input value="01-07-2026 11:04:12" readOnly className="bg-muted/30 border-muted" />
            <p className="text-xs text-muted-foreground mt-1">Asia/Kolkata</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Next Schedule</label>
            <Input value="01-08-2026 11:04:12" readOnly className="bg-muted/30 border-muted" />
            <p className="text-xs text-muted-foreground mt-1">Asia/Kolkata</p>
          </div>
          <div className="pt-2 pb-2">
            <Button variant="secondary" className="bg-muted/50 hover:bg-muted text-foreground">Send SMS</Button>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Next Schedule1</label>
            <Input value="01-09-2026 11:04:12" readOnly className="bg-muted/30 border-muted" />
            <p className="text-xs text-muted-foreground mt-1">Asia/Kolkata</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">End Schedule</label>
            <Input value="30-07-2026 11:04:12" readOnly className="bg-muted/30 border-muted" />
            <p className="text-xs text-muted-foreground mt-1">Asia/Kolkata</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">End Schedule1</label>
            <Input value="31-08-2026 11:04:12" readOnly className="bg-muted/30 border-muted" />
            <p className="text-xs text-muted-foreground mt-1">Asia/Kolkata</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationTab;
