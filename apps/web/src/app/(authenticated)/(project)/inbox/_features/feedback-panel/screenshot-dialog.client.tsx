"use client";

/* eslint-disable @next/next/no-img-element -- Screenshots arrive with unknown
   dimensions and are streamed from the app's own asset route; next/image would
   add an optimizer round-trip without any layout benefit. */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";

type ScreenshotDialogProps = {
  src: string;
};

export function ScreenshotDialog({ src }: ScreenshotDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="cursor-zoom-in">
          {}
          <img
            src={src}
            alt="Feedback screenshot"
            className="w-full rounded-md border"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="h-[calc(100vh-2rem)] overflow-auto rounded-none border-none p-0 sm:max-w-[calc(100%-2rem)]">
        <DialogTitle className="sr-only">Screenshot preview</DialogTitle>
        <DialogDescription className="sr-only">
          Full-size feedback screenshot
        </DialogDescription>
        {}
        <img
          src={src}
          alt="Feedback screenshot"
          className="h-full w-full object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
