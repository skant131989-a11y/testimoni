"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export function PrintButton() {
  return (
    <Button
      onClick={() => {
        track("poster_printed");
        window.print();
      }}
    >
      <Printer className="mr-2 h-4 w-4" /> Print poster
    </Button>
  );
}
