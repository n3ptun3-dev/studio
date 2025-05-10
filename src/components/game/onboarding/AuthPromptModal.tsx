
"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HolographicButton } from "@/components/game/shared/HolographicPanel";

interface AuthPromptModalProps {
  onClose: () => void;
}

export function AuthPromptModal({ onClose }: AuthPromptModalProps) {
  const handleOpenPiBrowser = () => {
    // Attempt to open Pi Browser or redirect to app store
    // This is a simplified example. Real implementation needs platform detection.
    const gameUrl = window.location.href;
    const piBrowserUrl = `pi://browser?url=${encodeURIComponent(gameUrl)}`;
    
    // Try to open in Pi Browser app
    window.location.href = piBrowserUrl;

    // Fallback or if Pi Browser not installed (this part is tricky without native capabilities)
    // For a web app, redirecting to a page with instructions might be best.
    // Or try to open app store link.
    console.log("Attempting to open Pi Browser or redirect to store...");

    // Example: If Pi Browser doesn't open after a short delay, redirect to an info page or app store.
    // This is a common pattern but not perfectly reliable.
    setTimeout(() => {
        // Check if page is still visible, if so, Pi Browser likely didn't open.
        if (!document.hidden) {
            const isAndroid = /android/i.test(navigator.userAgent);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            if (isAndroid) {
                window.location.href = "https://play.google.com/store/apps/details?id=com.pi.browser";
            } else if (isIOS) {
                window.location.href = "https://apps.apple.com/us/app/pi-browser/id1503141414"; // Example, check actual ID
            } else {
                // Fallback for desktop or other OS
                alert("Please install Pi Browser to continue. Search for 'Pi Browser' in your app store.");
            }
        }
    }, 2000);


    onClose();
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent className="holographic-panel border-destructive shadow-destructive/40">
        <AlertDialogHeader>
          <AlertDialogTitle className="holographic-text text-destructive">Access Denied - Authentication Required</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            To participate in active operations, you must authenticate with your Pi Network identity.
            Please open this application within the Pi Browser to proceed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <HolographicButton onClick={onClose} className="border-muted text-muted-foreground hover:bg-muted hover:text-background">
            Cancel
          </HolographicButton>
          <HolographicButton onClick={handleOpenPiBrowser} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Open Pi Browser
          </HolographicButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    