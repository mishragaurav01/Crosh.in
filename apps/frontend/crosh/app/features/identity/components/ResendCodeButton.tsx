"use client";

import { useState, useEffect, useCallback } from "react";

interface ResendCodeButtonProps {
  cooldownSeconds?: number;
  onResend: () => void;
}

export default function ResendCodeButton({
  cooldownSeconds = 60,
  onResend,
}: ResendCodeButtonProps) {
  const [remaining, setRemaining] = useState(cooldownSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const reset = useCallback(() => {
    setRemaining(cooldownSeconds);
    onResend();
  }, [cooldownSeconds, onResend]);

  const isDisabled = remaining > 0;

  return (
    <p className="text-center font-body-md text-body-md text-on-surface-variant">
      {isDisabled ? (
        <span>
          Resend code in{" "}
          <span className="font-label-md text-primary">{remaining}s</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={reset}
          className="font-label-md text-label-md text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all duration-300"
        >
          Resend code
        </button>
      )}
    </p>
  );
}
