"use client";

import { Button } from "@workspace/ui/components/button";
import { Download } from "lucide-react";
import * as React from "react";
import { toCsv } from "@/utils/csv/to-csv";

type DataTableExportButtonProps = {
  filename?: string;
  data: Array<Record<string, unknown>>;
  disabled?: boolean;
};

export function DataTableExportButton({
  filename,
  data,
  disabled = false,
}: DataTableExportButtonProps) {
  const handleExport = React.useCallback(() => {
    try {
      if (data.length === 0) {
        console.warn("No data to export");
        return;
      }

      const timestamp = new Date().toISOString().split("T")[0];
      const finalFilename =
        filename === undefined || filename === ""
          ? `export-${timestamp}.csv`
          : filename;

      const url = URL.createObjectURL(
        new Blob([toCsv(data)], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = finalFilename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  }, [data, filename]);

  return (
    <Button
      onClick={handleExport}
      disabled={disabled}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="size-4" />
      Export
    </Button>
  );
}
