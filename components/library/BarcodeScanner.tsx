import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (barcode: string) => void;
}

export const BarcodeScanner = ({ open, onOpenChange, onScanSuccess }: BarcodeScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const containerId = "barcode-scanner-reader";

  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }

    // Give the DOM a tiny bit of time to render the reader element in the dialog
    const timer = setTimeout(() => {
      try {
        const html5Qrcode = new Html5Qrcode(containerId);
        html5QrcodeRef.current = html5Qrcode;

        const config = {
          fps: 10,
          qrbox: (width: number, height: number) => {
            // Standard barcode size is a horizontal rectangle
            const boxWidth = Math.min(width * 0.9, 450);
            const boxHeight = Math.min(height * 0.6, 250);
            return {
              width: boxWidth,
              height: boxHeight,
            };
          },
        };

        html5Qrcode
          .start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              // Successfully decoded barcode
              onScanSuccess(decodedText);
              onOpenChange(false);
            },
            () => {
              // Ignore failure to decode a frame (keeps scanning)
            }
          )
          .catch((err) => {
            console.error("Error starting camera: ", err);
            setError("Failed to start camera. Please verify camera permissions or select another device.");
          });
      } catch (err) {
        console.error("Failed to initialize scanner: ", err);
        setError("Failed to initialize the barcode scanner.");
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (html5QrcodeRef.current) {
        const currentRef = html5QrcodeRef.current;
        if (currentRef.isScanning) {
          currentRef
            .stop()
            .then(() => {
              currentRef.clear();
            })
            .catch((err) => {
              console.error("Error stopping scanner on cleanup: ", err);
            });
        }
      }
    };
  }, [open, onOpenChange, onScanSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary animate-pulse" />
            Scan Book Barcode
          </DialogTitle>
          <DialogDescription>
            Position the barcode within the highlighted region to scan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-2">
          {error ? (
            <div className="flex flex-col items-center justify-center space-y-3 p-6 text-center text-destructive bg-destructive/10 rounded-md w-full">
              <AlertCircle className="h-10 w-10" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border">
              <div id={containerId} className="w-full h-full" />
              {/* Optional Scanning Overlay effect */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[90%] h-[60%] border-2 border-dashed border-primary/70 rounded flex items-center justify-center bg-transparent">
                  <div className="w-full h-0.5 bg-primary/70 animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
