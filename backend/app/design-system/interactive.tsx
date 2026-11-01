"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";

export function InteractiveDemo({ theme }: { theme: string }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState("none");
  return (
    <div className="row" style={{ alignItems: "center" }}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dropdown
        label="Actions"
        items={[
          { label: "Duplicate", onSelect: () => setPicked("duplicate") },
          { label: "Archive", onSelect: () => setPicked("archive") },
          { label: "Delete (disabled)", onSelect: () => setPicked("delete"), disabled: true },
        ]}
      />
      <span className="meta" data-testid={`picked-${theme}`}>
        Selected: {picked}
      </span>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm action"
        description="Dialogs render in the top layer and inherit the theme of their scope."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
          </>
        }
      />
    </div>
  );
}
