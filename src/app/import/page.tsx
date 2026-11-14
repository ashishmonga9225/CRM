'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Users,
  Sparkles,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import {
  parseExcelOrCsvFile,
  commitBulkLeads,
  downloadExcelTemplate,
  ParsedLeadRow,
} from '@/lib/exportImport';

export default function BulkImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Result Summary
  const [result, setResult] = useState<{
    added: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);
    setResult(null);

    try {
      const rows = await parseExcelOrCsvFile(selectedFile);
      setParsedRows(rows);
    } catch (err) {
      console.error(err);
      alert('Failed to read Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);

    try {
      const summary = await commitBulkLeads(parsedRows, skipDuplicates);
      setResult(summary);
      setParsedRows([]);
      setFile(null);
    } catch (err) {
      console.error(err);
      alert('Error importing leads. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
              Bulk Data Onboarding
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Excel Bulk Lead Upload
            </h1>
          </div>
        </div>

        <button
          onClick={downloadExcelTemplate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 shadow-sm transition-all"
          title="Download sample Excel template with Name and Number columns"
        >
          <Download className="w-4 h-4" />
          <span>Sample Template</span>
        </button>
      </div>

      {/* SUCCESS CONFIRMATION BANNER */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-4 shadow-sm animate-in fade-in duration-300">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-950">
              Bulk Upload Completed!
            </h3>
            <p className="text-xs text-emerald-800 mt-1">
              Your leads have been successfully imported into the CRM.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
            <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Added</span>
              <span className="text-xl font-black text-emerald-600">{result.added}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Updated</span>
              <span className="text-xl font-black text-blue-600">{result.updated}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Skipped</span>
              <span className="text-xl font-black text-slate-600">{result.skipped}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Link
              href="/status"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <span>View Client Status Board</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/today"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <span>Start Follow-ups</span>
            </Link>
          </div>
        </div>
      )}

      {/* DROPZONE / FILE SELECTOR */}
      <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-colors text-center space-y-4 shadow-sm">
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <FileSpreadsheet className="w-8 h-8" />
        </div>

        <div>
          <h3 className="font-extrabold text-base text-slate-900">
            {file ? file.name : 'Choose an Excel file with Name & Number'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong>. Columns like <em>Name</em>, <em>Number / Phone</em>, and <em>Status</em> (Interested, Not Interested) are automatically detected.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{file ? 'Change File' : 'Select Excel File'}</span>
          </button>
        </div>
      </div>

      {/* PARSING INDICATOR */}
      {isParsing && (
        <div className="text-center py-6 text-slate-500 text-xs font-semibold animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Reading rows and detecting statuses...</span>
        </div>
      )}

      {/* PREVIEW TABLE (When file is parsed) */}
      {parsedRows.length > 0 && !isParsing && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                Ready to Import
              </span>
              <h2 className="text-base font-extrabold text-slate-900">
                Found {parsedRows.length} Leads in File
              </h2>
            </div>

            {/* Duplicate Handling Toggle */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-600 font-semibold cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={e => setSkipDuplicates(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Skip if phone already exists</span>
              </label>
            </div>
          </div>

          {/* Quick Preview List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-slate-50/50">
            {parsedRows.map((row, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-white transition-colors">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-bold text-slate-900 truncate">{row.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{row.phone}</div>
                  {row.requirement && (
                    <div className="text-[10px] text-slate-600 truncate">{row.requirement}</div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      row.status === 'lost'
                        ? 'bg-red-100 text-red-800'
                        : row.status === 'booked'
                        ? 'bg-emerald-100 text-emerald-800'
                        : row.temperature === 'hot'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {row.status === 'lost' ? 'Not Interested' : row.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleStartImport}
            disabled={isImporting}
            className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isImporting ? 'Importing Leads...' : `Confirm & Import ${parsedRows.length} Leads`}</span>
          </button>
        </div>
      )}
    </div>
  );
}
