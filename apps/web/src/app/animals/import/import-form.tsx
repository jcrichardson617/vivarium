"use client";

import { useActionState, useTransition } from "react";
import { importCsv, type ImportResult } from "./actions";

const KIND_LABEL: Record<string, string> = {
  animals: "Animals",
  feedings: "Feedings",
  weights: "Weights",
  lengths: "Lengths",
  sheds: "Sheds",
  health: "Health events",
  notes: "Notes",
};

// Submitted by hand so the chosen files stay selected after a check,
// ready to import with one more click.
export function ImportForm() {
  const [result, action, pending] = useActionState(importCsv, null as ImportResult);
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
          startTransition(() => action(data));
        }}
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          CSV files
          <input type="file" name="files" accept=".csv,text/csv" multiple required className="field" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button name="mode" value="check" disabled={pending} className="btn-secondary">
            {pending ? "Working…" : "Check files"}
          </button>
          <button name="mode" value="import" disabled={pending} className="btn-primary">
            Import
          </button>
        </div>
        <p className="text-xs text-muted">Check files reads everything and reports what would happen, without saving.</p>
      </form>

      {result?.error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{result.error}</p>}
      {result && result.files.length > 0 && (
        <div aria-live="polite" className="flex flex-col gap-3">
          <h2 className="font-semibold">{result.dryRun ? "Check results (nothing saved yet)" : "Import finished"}</h2>
          {result.files.map((f) => (
            <div key={f.file} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">
                {f.file}
                {f.kind && <span className="font-normal text-muted"> · {KIND_LABEL[f.kind]}</span>}
              </p>
              {f.kind && (
                <p className="mt-1">
                  {result.dryRun ? "Ready to import" : "Imported"} <strong>{f.imported}</strong>
                  {f.skipped > 0 && <>, skipped <strong>{f.skipped}</strong></>}
                </p>
              )}
              {f.problems.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-muted">
                  {f.problems.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {result.dryRun && <p className="text-sm text-muted">Looks right? Press Import to save it.</p>}
        </div>
      )}
    </div>
  );
}
