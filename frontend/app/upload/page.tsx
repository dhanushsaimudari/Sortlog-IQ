'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { uploadCatalogFile } from '../../lib/api/upload';
import { notifyCatalogUpdated } from '../../lib/session';

interface QueuedFile {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  extension: string;
  status: 'READY' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  error?: string;
  totalRows?: number;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.pdf', '.png', '.jpg', '.jpeg'];

export default function UploadPage() {
  const [fileQueue, setFileQueue] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<'IDLE' | 'PROCESSING' | 'COMPLETED'>('IDLE');
  const [currentStep, setCurrentStep] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { title: 'File Received', desc: 'Raw product feed files captured and validated' },
    { title: 'Structure Parsing', desc: 'Parsing rows, worksheets, and document specs' },
    { title: 'Manufacturer / Brand', desc: 'Resolving canonical Mfr & Brand names' },
    { title: 'Taxonomy Classification', desc: 'Predicting 4-tier industrial classification' },
    { title: 'AI Spec Extraction', desc: 'Extracting technical attribute triplets' },
    { title: 'Normalization', desc: 'Normalizing UOMs & commercial standards' },
    { title: 'Validation Engine', desc: 'Running 252-column deterministic rule checks' },
    { title: 'Quality Scoring', desc: 'Calculating explainable quality weights' },
    { title: 'Session Ready', desc: 'Catalogue enriched and ready for review/export' },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileExtension = (name: string): string => {
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    return ext;
  };

  const validateFile = (file: File): string | null => {
    const ext = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type '${ext}'. Please upload CSV, XLSX, PDF or image files.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File is too large (${formatFileSize(file.size)}). Maximum allowed size: 50 MB.`;
    }
    return null;
  };

  const addFilesToQueue = (files: File[]) => {
    setErrorMessage(null);
    const newItems: QueuedFile[] = [];
    let error: string | null = null;

    for (const f of files) {
      const valErr = validateFile(f);
      if (valErr) {
        error = valErr;
        continue;
      }

      // Avoid duplicates
      if (fileQueue.some((q) => q.name === f.name && q.file.size === f.size)) {
        continue;
      }

      newItems.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file: f,
        name: f.name,
        sizeFormatted: formatFileSize(f.size),
        extension: getFileExtension(f.name),
        status: 'READY',
        progress: 0,
      });
    }

    if (error) {
      setErrorMessage(error);
    }

    if (newItems.length > 0) {
      setFileQueue((prev) => [...prev, ...newItems]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // Drag and Drop Event Handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveFile = (id: string) => {
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProcessCatalogue = async () => {
    if (fileQueue.length === 0) return;

    setUploadState('PROCESSING');
    setCurrentStep(0);
    setErrorMessage(null);

    let totalProcessed = 0;

    for (let i = 0; i < fileQueue.length; i++) {
      const qFile = fileQueue[i];
      setFileQueue((prev) =>
        prev.map((item) => (item.id === qFile.id ? { ...item, status: 'UPLOADING', progress: 30 } : item))
      );

      try {
        const res = await uploadCatalogFile(qFile.file, (job) => {
          setFileQueue((prev) => prev.map((item) => item.id === qFile.id ? {
            ...item,
            status: job.status === 'PROCESSING' ? 'PROCESSING' : 'UPLOADING',
            progress: job.progress || 0,
            totalRows: job.total_rows,
          } : item));
          setProcessedCount(job.processed_rows || 0);
          setCurrentStep(job.stage === 'PARSING' ? 1 : job.stage === 'VALIDATING' ? 3 : 2);
        });
        if (res.status === 'FAILED') {
          throw new Error(res.error || 'Import processing failed');
        }
        totalProcessed += res.total_rows || 0;

        setFileQueue((prev) =>
          prev.map((item) =>
            item.id === qFile.id
              ? { ...item, status: 'COMPLETED', progress: 100, totalRows: res.total_rows }
              : item
          )
        );
      } catch (err: any) {
        setFileQueue((prev) =>
          prev.map((item) =>
            item.id === qFile.id
              ? { ...item, status: 'FAILED', progress: 0, error: err.message || 'Upload failed' }
              : item
          )
        );
        setErrorMessage(`Failed to process ${qFile.name}: ${err.message || 'Server error'}`);
      }
    }

    setProcessedCount(totalProcessed);

    setCurrentStep(steps.length - 1);
    setUploadState('COMPLETED');
    notifyCatalogUpdated();
  };

  const handleReset = () => {
    setUploadState('IDLE');
    setCurrentStep(0);
    setFileQueue([]);
    setErrorMessage(null);
    setProcessedCount(0);
  };

  const renderFileIcon = (ext: string) => {
    if (ext === '.pdf') return <FileText className="w-5 h-5 text-rose-500" />;
    if (['.png', '.jpg', '.jpeg'].includes(ext)) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    return <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Upload Catalogue Data</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            Ingest real manufacturer/distributor datasets for AI enrichment and quality validation
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Real File Processing Engine</span>
      </div>

      {/* Hidden HTML File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv, .xlsx, .xls, .pdf, .png, .jpg, .jpeg"
        multiple
        onChange={handleFileSelect}
      />

      {/* DRAG AND DROP ZONE */}
      <Card
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 border-dashed border-2 text-center space-y-4 cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/80 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 hover:border-blue-400 dark:hover:border-blue-600'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <Upload className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {isDragging ? 'DROP FILES TO UPLOAD' : 'Drag & Drop Product Feed Files'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Supports CSV, Excel (.xlsx), PDF datasheets, or Images (Max 50MB per file)
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="mx-auto"
        >
          <FileSpreadsheet className="w-4 h-4" /> Browse Files
        </Button>
      </Card>

      {/* ERROR NOTIFICATION */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-mono text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SELECTED FILES QUEUE */}
      {fileQueue.length > 0 && (
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Selected Files ({fileQueue.length})
            </h3>
            {uploadState === 'IDLE' && (
              <Button size="sm" variant="primary" onClick={handleProcessCatalogue}>
                Process Catalogue <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {fileQueue.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderFileIcon(item.extension)}
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                      Size: {item.sizeFormatted} &bull; Extension: {item.extension.toUpperCase()}
                      {item.totalRows ? ` \u2022 ${item.totalRows} rows parsed` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.status === 'UPLOADING' && <Progress value={item.progress} color="blue" className="w-24" />}
                  <Badge status={item.status}>{item.status}</Badge>

                  {uploadState === 'IDLE' && (
                    <button
                      onClick={() => handleRemoveFile(item.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* VISUAL PROCESSING TIMELINE */}
      {uploadState !== 'IDLE' && (
        <Card className="space-y-4 p-6">
          <CardHeader title="Pipeline Execution Timeline" subtitle="Step-by-step real-time enrichment stage tracking" />

          <div className="space-y-3">
            {steps.map((s, idx) => {
              let status: 'Waiting' | 'Processing' | 'Complete' = 'Waiting';
              if (idx < currentStep) status = 'Complete';
              else if (idx === currentStep) status = uploadState === 'COMPLETED' ? 'Complete' : 'Processing';

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-md border transition-all ${
                    status === 'Complete'
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                      : status === 'Processing'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500 text-blue-900 dark:text-blue-200 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {status === 'Complete' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : status === 'Processing' ? (
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-xs">{s.title}</span>
                      <p className="text-[11px] opacity-80">{s.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase">{status}</span>
                </div>
              );
            })}
          </div>

          {uploadState === 'COMPLETED' && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3">
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Batch Enrichment Complete! {processedCount} Products Processed.
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleReset}>
                  Upload Another File
                </Button>
                <Link href="/products">
                  <Button size="sm" variant="primary">
                    Inspect Catalogue Products <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
