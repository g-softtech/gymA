"use client";

import { useState } from "react";
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function MemberCsvImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSummary(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setSummary(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/members/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to upload CSV");
        if (data.details) {
          console.error("CSV Parse Errors:", data.details);
        }
      } else {
        toast.success("Import completed!");
        setSummary(data);
        router.refresh();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,email\nJohn Doe,john@example.com\nJane Smith,jane@example.com";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "member_import_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2"
      >
        <UploadCloud className="h-4 w-4" />
        Import Members
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-border">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Bulk Import Members</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!summary ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    Upload a CSV file containing your members. We will only create their accounts. They will receive no emails until you invite them.
                  </div>

                  <div className="flex justify-end">
                    <button onClick={downloadTemplate} className="text-primary text-sm hover:underline flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Download Template
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center bg-muted/30">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!file || isUploading}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Start Import"
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center text-center p-4 bg-green-500/10 text-green-600 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="h-6 w-6 mr-2" />
                    <span className="font-medium">Import Processed</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-muted rounded-md border border-border text-center">
                      <div className="text-2xl font-bold text-foreground">{summary.imported}</div>
                      <div className="text-muted-foreground">Successfully Added</div>
                    </div>
                    <div className="p-3 bg-muted rounded-md border border-border text-center">
                      <div className="text-2xl font-bold text-foreground">{summary.alreadyExists + summary.invalid + summary.failed}</div>
                      <div className="text-muted-foreground">Skipped / Failed</div>
                    </div>
                  </div>

                  {summary.errors && summary.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-500">
                        <AlertCircle className="h-4 w-4" /> Issues Encountered
                      </h4>
                      <div className="max-h-40 overflow-y-auto text-xs bg-red-500/5 rounded-md border border-red-500/10 p-3 space-y-2">
                        {summary.errors.map((err: any, i: number) => (
                          <div key={i} className="text-red-700/80">
                            <strong>Row {err.row}</strong> ({err.email}): {err.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
