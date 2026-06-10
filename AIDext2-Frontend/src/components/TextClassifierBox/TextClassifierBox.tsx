import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from "react";
import './TextClassifierBox.css'
import ModelModal from "../ModelModal/ModelModal.tsx";
import { API } from "../../api.tsx"
import GaugeComponent from 'react-gauge-component';
import SegmentTooltip from "../SegmentTooltip/SegmentTooltip";

const MAX_CHARS = 12000;
const MIN_WORDS = 10;

// ── Thresholds for hybrid zone ─────────────────────────────────────────────
const HYBRID_LOW  = 0.35;   // below this → Human
const HYBRID_HIGH = 0.65;   // above this → AI
                             // between    → Hybrid

interface ChunkResult {
  start: number;
  end: number;
  score: number;
  label: "AI" | "Human" | "Hybrid";   // ← added Hybrid
  gen_model?: string;
}

interface ScanResponse {
  model: string;
  results: ChunkResult[];
  stride: number;
  window_size: number;
}

interface TextSegment {
  text: string;
  label: "AI" | "Human" | "Hybrid";  // ← added Hybrid
  score: number;
  gen_model?: string;
  chunkIndex: number;
  totalChunks: number;
  start: number;
  end: number;
}

// ── Re-label chunks using score thresholds instead of trusting backend label ─
// This lets the frontend decide the hybrid zone independently of the backend.
function applyHybridLabel(results: ChunkResult[]): ChunkResult[] {
  return results.map(r => ({
    ...r,
    label: r.score > HYBRID_HIGH ? "AI"
         : r.score < HYBRID_LOW  ? "Human"
         : "Hybrid",
  }));
}

function parseSegments(text: string, results: ChunkResult[]): TextSegment[] {
  if (!results.length) return [];

  return results
    .map((chunk, i) => {
      const start = chunk.start;
      // Use next chunk's start as this chunk's end — guarantees no overlap, no gap
      const end   = Math.min(results[i + 1]?.start ?? text.length, text.length);

      if (start >= text.length) return null;
      const slice = text.slice(start, end);
      if (!slice.length) return null;

      return {
        text:        slice,
        label:       chunk.label,
        score:       chunk.score,
        gen_model:   chunk.gen_model,
        start,
        end,
        chunkIndex:  i + 1,
        totalChunks: results.length,
      };
    })
    .filter(Boolean) as TextSegment[];
}

function deriveOverall(results: ChunkResult[]): { label: "AI" | "Human" | "Hybrid"; confidence: number } {
  const aiCount     = results.filter(r => r.label === "AI").length;
  const humanCount  = results.filter(r => r.label === "Human").length;
  const hybridCount = results.filter(r => r.label === "Hybrid").length;

  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  // If more than 20% of chunks are in the hybrid zone → overall is Hybrid
  const hybridRatio = hybridCount / results.length;
  if (hybridRatio >= 0.2) return { label: "Hybrid", confidence: avgScore };

  const label = aiCount >= humanCount ? "AI" : "Human";
  return { label, confidence: avgScore };
}

function deriveGenModel(results: ChunkResult[]): string | null {
  const aiChunks = results.filter(r => r.gen_model && r.label === "AI");
  if (!aiChunks.length) return null;

  const counts: Record<string, number> = {};
  for (const chunk of aiChunks) {
    const m = chunk.gen_model!;
    counts[m] = (counts[m] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export default function TextScanner() {
  const [text, setText]               = useState<string>("");
  const [isDragging, setIsDragging]   = useState<boolean>(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const [scanResponse, setScanResponse] = useState<ScanResponse | null>(null);
  const [isScanning, setIsScanning]   = useState(false);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const [selectedModel, setSelectedModel] = useState<{ id: string; category: "ml" | "dl" } | null>(null);
  const [showModelWarning, setShowModelWarning] = useState(false);
  const [windowMode, setWindowMode] = useState<"chars" | "words">("chars");


  const showModel = showModelWarning;
  console.log(showModel)
  
  const canScan = wordCount >= MIN_WORDS && selectedModel !== null;

  // Apply hybrid re-labelling before parsing segments
  const labelledResults = scanResponse ? applyHybridLabel(scanResponse.results) : [];

  const segments = scanResponse && text.length > 0
    ? parseSegments(text, labelledResults)
    : [];

  const overall = labelledResults.length > 0 ? deriveOverall(labelledResults) : null;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [text, scanResponse]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    setScanResponse(null);
    setText("");
  }, [windowMode]);

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value.slice(0, MAX_CHARS));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(((ev.target?.result as string) ?? "").slice(0, MAX_CHARS));
    reader.readAsText(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(((ev.target?.result as string) ?? "").slice(0, MAX_CHARS));
    reader.readAsText(file);
  }

  async function handleScan() {
    if (!selectedModel) {
      setShowModelWarning(true);
      return;
    }
    setShowModelWarning(false);
    setIsScanning(true);
    try {
      const res = await API.scanText(text, selectedModel.id, selectedModel.category, windowMode);
      console.log("Response", res);
      setScanResponse(res);
    } finally {
      setIsScanning(false);
    }
  }

  function handleRescan() {
    setScanResponse(null);
    setText("");
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 1700, margin: "0 auto", padding: "1.5rem" }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
        <ModelModal
          currentModel={selectedModel?.id ?? ""}
          onSelect={(modelId, category) => {
            setScanResponse(null);
            setSelectedModel({ id: modelId, category });
            setShowModelWarning(false);
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#888" }}>Window by</span>
          <div
            onClick={() => setWindowMode(m => m === "chars" ? "words" : "chars")}
            role="switch"
            aria-checked={windowMode === "words"}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setWindowMode(m => m === "chars" ? "words" : "chars");
              }
            }}
            style={{
              position: "relative",
              width: 120,
              height: 34,
              borderRadius: 999,
              background: windowMode === "words" ? "#ddeeff" : "#fde8e8",
              cursor: "pointer",
              transition: "background 0.3s",
              userSelect: "none",
              flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute",
              top: 4,
              left: 4,
              width: 62,
              height: 26,
              borderRadius: 999,
              background: windowMode === "words" ? "#3b9ae8" : "#e05c5c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.04em",
              transform: windowMode === "words" ? "translateX(50px)" : "translateX(0)",
              transition: "transform 0.3s cubic-bezier(.4,0,.2,1), background 0.3s",
            }} />
          </div>
          <span style={{ fontSize: 13, color: "#888" }}>
            {windowMode === "words" ? "Words" : "Characters"}
          </span>
        </div>
        {wordCount >= MIN_WORDS && !selectedModel && (
          <span style={{ fontSize: 13, color: "#e05c5c" }}>
            ⚠ Please select a model before scanning
          </span>
        )}
      </div>

      {scanResponse && overall && segments.length > 0 ? (
        /* ── RESULTS VIEW ── */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>

          <SegmentTooltip
            segments={segments}
            selectedModel={selectedModel}
            windowMode={windowMode}
            onRescan={handleRescan}
          />

          {/* Metrics panel */}
          <div className="metrics-panel">
            <div className="metrics-header">Analysis</div>

            <div className="metric-row">
              <div className="metric-label">Verdict</div>
              <div className={`label-badge badge-${overall.label.toLowerCase()}`}>
                <span className={`label-dot dot-${overall.label.toLowerCase()}`} />
                {overall.label === "AI"     ? "AI-generated"
                 : overall.label === "Hybrid" ? "Mixed content"
                 : "Human-written"}
              </div>
            </div>

            <div className="metric-row">
              <div className="metric-label">Confidence</div>
              <GaugeComponent
                value={Math.round(overall.confidence * 100)}
                type="grafana"
                minValue={0}
                maxValue={100}
                arc={{
                  width: 0.4,
                  cornerRadius: 6,
                  nbSubArcs: 52,
                  colorArray: overall.label === "AI"
                    ? ["#f5cd19", "#f0a500", "#e05c5c"]
                    : overall.label === "Hybrid"
                    ? ["#a8e063", "#f5cd19", "#e05c5c"]
                    : ["#a8e063", "#4caf50", "#1a9e3f"],
                  padding: 0,
                  subArcsStrokeWidth: 0,
                  outerArc: { width: 0 },
                  subArcs: []
                }}
                pointer={{
                  type: "needle",
                  elastic: false,
                  animationDelay: 200,
                  animationDuration: 1000,
                  length: 0.87,
                  width: 24,
                  baseColor: "#ffffff",
                  strokeWidth: 2,
                  strokeColor: "#000000",
                  maxFps: 60,
                  animationThreshold: 0.0096,
                  animate: true
                }}
                labels={{
                  valueLabel: {
                    matchColorWithArc: true,
                    style: { fontSize: "29px" },
                    offsetY: 25,
                    animateValue: true
                  },
                  tickLabels: { type: "outer", hideMinMax: true, ticks: [] }
                }}
                startAngle={-90}
                endAngle={90}
                pointers={[]}
              />
            </div>

            <div className="metric-row">
              <div className="metric-label">Chunks</div>
              <div className="metric-value">{scanResponse.results.length}</div>
            </div>

            <div className="metric-row">
              <div className="metric-label">AI chunks</div>
              <div className="metric-value" style={{ color: "#e05c5c" }}>
                {labelledResults.filter(r => r.label === "AI").length}
              </div>
            </div>

            {/* Hybrid chunks row — only shown when at least one exists */}
            {labelledResults.some(r => r.label === "Hybrid") && (
              <div className="metric-row">
                <div className="metric-label">Hybrid chunks</div>
                <div className="metric-value" style={{ color: "#f0a500" }}>
                  {labelledResults.filter(r => r.label === "Hybrid").length}
                </div>
              </div>
            )}

            <div className="metric-row">
              <div className="metric-label">Human chunks</div>
              <div className="metric-value" style={{ color: "#4caf50" }}>
                {labelledResults.filter(r => r.label === "Human").length}
              </div>
            </div>

            {(selectedModel?.id === "binary/model" || selectedModel?.id === "model") && (() => {
              const genModel = deriveGenModel(labelledResults);
              return genModel ? (
                <div className="metric-row">
                  <div className="metric-label">Generated by</div>
                  <div className="label-badge badge-ai">
                    <span className="label-dot dot-ai" />
                    {genModel}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Legend */}
            <div className="metric-row" style={{ marginTop: "1rem", borderTop: "0.5px solid rgba(255,255,255,0.08)", paddingTop: "0.75rem" }}>
              <div className="metric-label" style={{ marginBottom: 6 }}>Highlight key</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { label: "Human",  color: "#4caf50", desc: `score < ${HYBRID_LOW}` },
                  { label: "Hybrid", color: "#f0a500", desc: `score ${HYBRID_LOW}–${HYBRID_HIGH}` },
                  { label: "AI",     color: "#e05c5c", desc: `score > ${HYBRID_HIGH}` },
                ].map(({ label, color, desc }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ color: "#fff", fontWeight: 500, minWidth: 46 }}>{label}</span>
                    <span style={{ color: "#888" }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      ) : (
        /* ── SCAN INPUT VIEW ── */
        <>
          <div
            className={`cardStyle ${isDragging ? "cardStyle--dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => textareaRef.current?.focus()}
          >
            <div className={`drag-overlay ${isDragging ? "show" : ""}`}>
              <span className="drag-overlay-icon">⬆</span>
              <span className="drag-overlay-text">Drop your file here</span>
            </div>

            {text.length === 0 && !isDragging && (
              <div className="ghost-placeholder">
                Paste or write at least 10 words to start scanning…
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              className="textareaStyle"
              placeholder=""
            />

            {text.length === 0 && !isDragging && (
              <div className="card-upload-hint">
                <span style={{ color: "#aaa" }}>Drag files or </span>
                <button
                  className="pasteBtnStyle"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  ⬆ Upload file
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.txt"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
            <span style={{ fontSize: 12, color: charCount > 11000 ? "#e07b30" : "#888" }}>
              {charCount.toLocaleString()} / 12,000 characters
            </span>
            <button
              onClick={handleScan}
              disabled={!canScan || isScanning}
              className="scanBtnStyle"
              style={{
                opacity: canScan && !isScanning ? 1 : 0.4,
                cursor: canScan && !isScanning ? "pointer" : "not-allowed",
              }}
            >
              {isScanning ? "Scanning…" : "Scan"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}