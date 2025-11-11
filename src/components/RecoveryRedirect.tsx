// src/components/RecoveryRedirect.tsx
import { useEffect } from "react";

/**
 * Component that handles password recovery redirects
 * Checks for type=recovery in URL hash and redirects to /reset-password
 */
export default function RecoveryRedirect() {
  useEffect(() => {
    // Hash params are only available on the client side
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get("type");

      if (type === "recovery") {
        // This is a password recovery link, redirect to reset-password page
        window.location.href = `/reset-password${window.location.hash}`;
      }
    }
  }, []);

  return null;
}
