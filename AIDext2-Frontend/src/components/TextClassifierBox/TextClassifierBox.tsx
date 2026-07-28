import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from "react";
import './TextClassifierBox.css'
import ModelModal from "../ModelModal/ModelModal.tsx";
//import { API } from "../../api.tsx"
import ConfidenceGauge from "../ConfidenceGauge/ConfidenceGauge.tsx";
import { PieChart} from "@mui/x-charts/PieChart";
import SegmentTooltip from "../SegmentTooltip/SegmentTooltip";
import { LocalScanner } from "../LocalScanner";
import InfoTooltip from "../InfoTooltip/InfoTooltip.tsx";
import ChunkModal from "../ChunkModal/ChunkModal";
import { extractTextFromFile } from "../../utils/extractText";

const MAX_CHARS = 100000;
const MIN_WORDS = 10;

// ── Thresholds for hybrid zone ─────────────────────────────────────────────
const HYBRID_LOW  = 0.35;   // below this → Human
const HYBRID_HIGH = 0.65;   // above this → AI
                             // between    → Hybrid

export interface ChunkResult {
  start: number;
  end: number;
  probai: number;
  probhuman:number;         // probability of AI (0–1)
  //label: "AI" | "Human" | "Hybrid";
  label:number;
  features: Record<string, number>;
  gen_model?: string;
  probmodel?:number
}

interface ScanResponse {
  model: string;
  results: ChunkResult[];
  stride: number;
  window_size: number;
}

export interface TextSegment {
  text: string;
  label: "AI" | "Human" | "Hybrid";
  probai: number;
  probhuman: number;
  probmodel?: number;  
  gen_model?: string;
  chunkIndex: number;
  totalChunks: number;
  start: number;
  end: number;
  features: Record<string, number>;
}

interface OverallResult {
  label: "AI" | "Human" | "Hybrid";
  aiConfidence: number;
  humanConfidence: number;
  modelConfidence?: number;
}

const MODEL_COLORS: Record<string, string> = {
  deepseek: "#6366f1",  // indigo
  gpt_oss:  "#10b981",  // emerald
  llama:    "#f59e0b",  // amber
  mistral:  "#8b5cf6",  // purple
};


function getModelColor(model: string): string {
  return MODEL_COLORS[model] ?? "#888";
}

// ── Re-label chunks using score thresholds instead of trusting backend label ─
// This lets the frontend decide the hybrid zone independently of the backend.
/* function applyHybridLabel(results: ChunkResult[]): ChunkResult[] {
  return results; // labels come from model; hybrid is derived in parseSegments
}
 */
/* function parseSegments(text: string, results: ChunkResult[]): TextSegment[] {
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
} */

function isBoundary(char: string): boolean {
    return /\s/.test(char) || /[.,!?;:()[\]{}"'`]/.test(char);
}

function snapToWordBoundary(text: string, pos: number): number {
    if (pos <= 0) return 0;
    if (pos >= text.length) return text.length;

    // Already at a boundary
    if (isBoundary(text[pos])) return pos;

    let left = pos;
    let right = pos;

    while (left > 0 || right < text.length) {
        if (left > 0) {
            left--;
            if (isBoundary(text[left])) {
                return left + 1;
            }
        }

        if (right < text.length - 1) {
            right++;
            if (isBoundary(text[right])) {
                return right + 1;
            }
        }
    }

    return pos;
}

function parseSegments(text: string, results: ChunkResult[]): TextSegment[] {
    if (!results.length) return [];

    const segments: TextSegment[] = [];

    let previousEnd = 0;

    for (let i = 0; i < results.length; i++) {
        const chunk = results[i];

        const label: "AI" | "Human" | "Hybrid" =
            chunk.probai > HYBRID_HIGH
                ? "AI"
                : chunk.probhuman > HYBRID_HIGH
                    ? "Human"
                    : "Hybrid";

        // ----- Compute display boundaries -----

        const displayStart =
            i === 0
                ? chunk.start
                : previousEnd;

        let displayEnd: number;

        if (i === results.length - 1) {
            displayEnd = Math.min(chunk.end, text.length);
        } else {
            const next = results[i + 1];

            // midpoint of the overlap
            const midpoint = Math.floor((chunk.end + next.start) / 2);

            // move to nearest word boundary
            displayEnd = snapToWordBoundary(text, midpoint);
        }

        previousEnd = displayEnd;

        segments.push({
            text: text.slice(displayStart, displayEnd),

            label,

            probai: chunk.probai,
            probhuman: chunk.probhuman,
            probmodel: chunk.probmodel,
            gen_model: chunk.gen_model,
            features: chunk.features,

            start: displayStart,
            end: displayEnd,

            chunkIndex: i + 1,
            totalChunks: results.length,
        });
    }

    return segments;
}

/* function parseSegments(text: string, results: ChunkResult[]): TextSegment[] {
  if (!results.length) return [];

  return results.map((chunk, i) => {
    const start = chunk.start;
    const end   = Math.min(chunk.end, text.length);

    const label: "AI" | "Human" | "Hybrid" =
      chunk.probai    > HYBRID_HIGH ? "AI"    :
      chunk.probhuman > HYBRID_HIGH ? "Human" :
      "Hybrid";

    return {
      text:        text.slice(start, end),
      label,
      probai:      chunk.probai,
      probhuman:   chunk.probhuman,
      probmodel:   chunk.probmodel,
      features:    chunk.features,
      gen_model:   chunk.gen_model,
      start,
      end,
      chunkIndex:  i + 1,
      totalChunks: results.length,
    };
  }).filter(s => s.text.trim().length > 0);
} */

/* function deriveOverall(results: ChunkResult[]): { label: "AI" | "Human" | "Hybrid"; confidence: number } {
  const avgProbAI    = results.reduce((sum, r) => sum + r.probai,    0) / results.length;
  const avgProbHuman = results.reduce((sum, r) => sum + r.probhuman, 0) / results.length;

  const labelledChunks = results.map(r => ({
    label: r.probai    > HYBRID_HIGH ? "AI"    :
           r.probhuman > HYBRID_HIGH ? "Human" :
           "Hybrid"
  }));

  const hybridRatio = labelledChunks.filter(r => r.label === "Hybrid").length / results.length;
  if (hybridRatio >= 0.2) return { label: "Hybrid", confidence: avgProbAI };

  const aiCount    = labelledChunks.filter(r => r.label === "AI").length;
  const humanCount = labelledChunks.filter(r => r.label === "Human").length;

  return {
    label:      aiCount >= humanCount ? "AI" : "Human",
    confidence: aiCount >= humanCount ? avgProbAI : avgProbHuman,
  };
} */

function deriveOverall(results: ChunkResult[],mode: "binary" | "model" | "binary/model" = "binary"): OverallResult {
  const aiConfidence =
    results.reduce((sum, r) => sum + r.probai, 0) / results.length;

  const humanConfidence =
    results.reduce((sum, r) => sum + r.probhuman, 0) / results.length;

  const modelConfidence =
    results.some(r => r.probmodel !== undefined)
      ? results.reduce((sum, r) => sum + (r.probmodel ?? 0), 0) / results.length
      : undefined;

  console.log("mode",mode)

  if (mode === "model") {
    return {
      label: "AI",
      aiConfidence,
      humanConfidence,
      modelConfidence,
    };
  }

  const labelledChunks = results.map(r => ({
    label:
      r.probai > HYBRID_HIGH
        ? "AI"
        : r.probhuman > HYBRID_HIGH
          ? "Human"
          : "Hybrid",
  }));

  const hybridRatio =
    labelledChunks.filter(r => r.label === "Hybrid").length / results.length;

  let label: "AI" | "Human" | "Hybrid";

  // Strong overall evidence
  if (aiConfidence >= 0.65) {
    label = "AI";
  } else if (humanConfidence >= 0.65) {
    label = "Human";
  }
  // Only call it Hybrid if neither side is confident enough
  else if (hybridRatio >= 0.4) {
    label = "Hybrid";
  }
  // Fallback
  else {
    label = aiConfidence >= humanConfidence ? "AI" : "Human";
  }

  return {
    label,
    aiConfidence,
    humanConfidence,
    modelConfidence,
  };
}


function deriveGenModel(results: ChunkResult[]): string | null {
  console.log("Results",results)
  const aiChunks = results.filter(r => r.gen_model && r.label === 1);
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
  //const [selectedModel, setSelectedModel] = useState<{ id: string; category: "ml" | "dl" } | null>(null);
  const [selectedModel, setSelectedModel] = useState<{
    id: string;
    category: "ml" | "dl";
  }>({
    id: "binary",
    category: "ml",
  });
  const [showModelWarning, setShowModelWarning] = useState(false);
  const [windowMode, setWindowMode] = useState<"chars" | "words">("chars");
  const localScannerRef = useRef<LocalScanner | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [selectedSeg, setSelectedSeg] = useState<TextSegment | null>(null);
  const [chunkModalOpen, setChunkModalOpen] = useState(false);
  const [animatedGauge, setAnimatedGauge] = useState(0);

  const hasResults = scanResponse !== null;
  const canClear = text.trim().length > 0 || hasResults;

  if (!localScannerRef.current) {
        localScannerRef.current = new LocalScanner();
  }


  const showModel = showModelWarning;
  console.log(showModel)
  
  const canScan = wordCount >= MIN_WORDS && selectedModel !== null && scannerReady;

  // Apply hybrid re-labelling before parsing segments
  const labelledResults = scanResponse?.results ?? [];

  const segments = scanResponse && text.length > 0
    ? parseSegments(text, labelledResults)
    : [];

  const overall = labelledResults.length > 0 ? deriveOverall(labelledResults,selectedModel?.id as "binary" | "model" | "binary/model") : null;
  console.log("Overall",overall)

  let gaugeConfidence = 0;

  if (selectedModel?.id === "model") {
    // Pure model identification
    gaugeConfidence = overall?.modelConfidence ?? 0;
  } else {
    // Binary or Binary+Model
    switch (overall?.label) {
      case "AI":
        gaugeConfidence = overall?.aiConfidence ?? 0;
        break;

      case "Human":
        gaugeConfidence = overall?.humanConfidence ?? 0;
        break;

      case "Hybrid":
        // Only happens when neither class is confident enough
        gaugeConfidence = Math.max(
          overall?.aiConfidence ?? 0,
          overall?.humanConfidence ?? 0
        );
        break;

      default:
        gaugeConfidence = 0;
    }
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [text, scanResponse]);

  useEffect(() => {
      if (!localScannerRef.current) {
          localScannerRef.current = new LocalScanner();
      }
      // Eagerly initialize on mount, don't wait for user to click scan
      localScannerRef.current.load().then(() => {
          setScannerReady(true);
          console.log("Scanner ready");
      }).catch(err => {
          console.error("Scanner failed to load:", err);
      });
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    setScanResponse(null);
    //setText("");
  }, [windowMode]);

  useEffect(() => {
      const target = Math.round(gaugeConfidence * 100);

      let start: number | null = null;
      const initial = animatedGauge;
      const duration = 900;

      const step = (timestamp: number) => {
          if (!start) start = timestamp;

          const progress = Math.min((timestamp - start) / duration, 1);

          setAnimatedGauge(
              Math.round(initial + (target - initial) * progress)
          );

          if (progress < 1)
              requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
  }, [gaugeConfidence]);

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value.slice(0, MAX_CHARS));
  }

  /* function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(((ev.target?.result as string) ?? "").slice(0, MAX_CHARS));
    reader.readAsText(file);
  } */
  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const extracted = await extractTextFromFile(file);
          console.log("Extracted text",text);
          //setText(extracted.slice(0, MAX_CHARS));
          setText(normalizeText(extracted).slice(0, MAX_CHARS));  // ← normalize
      } catch (err) {
          console.error("Failed to extract text:", err);
      }
  }

  function normalizeText(text: string): string {
      return text
          .replace(/\r\n/g, "\n")  // Windows line endings
          .replace(/\r/g, "\n")    // Old Mac line endings
          .replace(/\u00A0/g, " ") // Non-breaking spaces
          .replace(/\u2028/g, "\n") // Line separator
          .replace(/\u2029/g, "\n"); // Paragraph separator
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

  /* function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(((ev.target?.result as string) ?? "").slice(0, MAX_CHARS));
    reader.readAsText(file);
  } */

  async function handleDrop(e: DragEvent<HTMLDivElement>) {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      try {
          const extracted = await extractTextFromFile(file);
          console.log("Extracted text File Drop",extracted);
          //setText(extracted.slice(0, MAX_CHARS));
          setText(normalizeText(extracted).slice(0, MAX_CHARS)); 
      } catch (err) {
          console.error("Failed to extract text:", err);
      }
  }

  async function handleScan() {
    //console.log("handleScan version: LOCAL");
    //console.log("handleScan START");
    console.log("Text length:", text.length);
    console.log("First 100 chars:", JSON.stringify(text.slice(0, 100)));
    console.log("selectedModel:", selectedModel);
    //console.log("localScannerRef.current:", localScannerRef.current);
    //console.log("scannerReady:", scannerReady);
    if (!selectedModel) {
      setShowModelWarning(true);
      return;
    }
    setShowModelWarning(false);
    setIsScanning(true);
    try {
      const normalizedText = normalizeText(text);  // ← normalize before scan
      if (normalizedText !== text) setText(normalizedText); // sync textarea
      const res = await localScannerRef.current!.scan(normalizedText, { windowMode }, selectedModel);
      //const res = await localScannerRef.current!.scan(text, { windowMode },selectedModel);
      console.log("Final response",res)
      console.log("First chunk:", res?.results[0]);
      console.log("First chunk text slice:", JSON.stringify(text.slice(res?.results[0].start, res?.results[0].end)));
      setScanResponse(res);
    } finally {
      setIsScanning(false);
    }
  }

  function handleRescan() {
    setScanResponse(null);
    setText("");
    setSelectedSeg(null);  
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
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRescan();
            }}
            disabled={!canClear}
            className="clearBtnStyle"
            style={{
              opacity: canClear ? 1 : 0.4,
              cursor: canClear ? "pointer" : "not-allowed",
            }}
          >
            Clear
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleScan();
            }}
            disabled={!canScan || isScanning || hasResults}
            className="scanBtnStyle"
            style={{
              opacity: canScan && !isScanning && !hasResults ? 1 : 0.4,
              cursor: canScan && !isScanning && !hasResults ? "pointer" : "not-allowed",
            }}
          >
            {isScanning ? "Scanning…" : "Scan"}
          </button>
        </div>
      </div>

      {scanResponse && overall && segments.length > 0 ? (
        /* ── RESULTS VIEW ── */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>

          <SegmentTooltip
            segments={segments}
            selectedModel={selectedModel}
            windowMode={windowMode}
            onRescan={handleRescan}
            onSegmentSelect={setSelectedSeg}
            selectedSeg={selectedSeg}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Metrics panel */}
            <div className="metrics-panel">
              <div className="metrics-header">Analysis</div>

              <div className="metric-row">
                <div className="metric-label-row">
                    <span className="metric-label">Verdict</span>
                    <InfoTooltip
                        text="The verdict is the final classification of the text as AI-generated, Human-written, or Mixed content based on the combined analysis of all text chunks."
                    />
                </div>
                
                <div className={`label-badge badge-${overall.label.toLowerCase()}`}>
                  <span className={`label-dot dot-${overall.label.toLowerCase()}`} />
                  {overall.label === "AI"     ? "AI-generated"
                  : overall.label === "Hybrid" ? "Mixed content"
                  : "Human-written"}
                </div>
              </div>

              {/* {(selectedModel?.id === "binary/model" || selectedModel?.id === "model") && (() => {
                const genModel = deriveGenModel(labelledResults);
                
                return genModel ? (
                  <div className="metric-row">
                    <div className="metric-label-row">
                        <span className="metric-label">Generated by:</span>
                        <InfoTooltip
                                text="The confidence represents (complete this later)?MISSING MISSING MISSING MISSING MISSING"
                        />
                    </div>
                    <div className="label-badge badge-ai">
                      <span className="label-dot dot-ai" />
                      {genModel}
                    </div>
                  </div>
                ) : null;
              })()} */}

              {(selectedModel?.id === "binary/model" || selectedModel?.id === "model") && (() => {
                const genModel = deriveGenModel(labelledResults);
                if (!genModel) return null;
                const modelKey = genModel === "gpt_oss" ? "gpt" : genModel;
                return (
                  <div className="metric-row">
                    <div className="metric-label-row">
                      <span className="metric-label">Generated by</span>
                      <InfoTooltip
                          text="The language model predicted to have generated the AI-written content. This prediction is based on the combined analysis of the detected AI text chunks."
                      />
                    </div>
                    <div className={`label-badge badge-${modelKey}`}>
                      <span className={`label-dot dot-${modelKey}`} />
                      {genModel}
                    </div>
                  </div>
                );
              })()}


              <div className="metric-row">
                <div className="metric-label-row">
                  <span className="metric-label">Confidence</span>
                  <InfoTooltip
                      text="The confidence score indicates how certain the model is about its prediction. For AI vs Human detection, it reflects confidence in the predicted class. For AI model detection, it reflects confidence in the predicted language model."
                  />
                </div>

                {/* Binary */}
                {selectedModel?.id === "binary" && (
                  <div className="gauge-block">
                    <PieChart
                      series={[
                        {
                          data: [
                            {
                              id: 0,
                              value: overall.aiConfidence * 100,
                              label: "AI",
                              color: "#E24B4A",
                            },
                            {
                              id: 1,
                              value: overall.humanConfidence * 100,
                              label: "Human",
                              color: "#4CAF50",
                            },
                          ],
                          innerRadius: 60,
                          outerRadius: 90,
                          startAngle: -90,
                          endAngle: 90,
                          cx: 180,
                          cy: 110,
                        },
                      ]}
                      width={300}
                      height={180}
                      sx={{
                        "& .MuiChartsLegend-root": {
                          transform: "translate(-20px) translateY(-20px)",
                        },
                      }}
                    />
                    <span className="gauge-block-title">AI vs Human</span>
                  </div>
                )}

                {/* Model */}
                {selectedModel?.id === "model" && (
                  <div className="gauge-block" style={{ padding: "12px 0" }}>
                    <ConfidenceGauge confidence={overall.modelConfidence ?? 0} />
                    <span className="gauge-block-title">Model detection</span>
                  </div>
                )}

                {/* Binary + Model */}
                {selectedModel?.id === "binary/model" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                    <div className="gauge-block">
                      <PieChart
                        series={[
                          {
                            data: [
                              {
                                id: 0,
                                value: overall.aiConfidence * 100,
                                label: "AI",
                                color: "#E24B4A",
                              },
                              {
                                id: 1,
                                value: overall.humanConfidence * 100,
                                label: "Human",
                                color: "#4CAF50",
                              },
                            ],
                            innerRadius: 60,
                            outerRadius: 90,
                            startAngle: -90,
                            endAngle: 90,
                            cx: 180,
                            cy: 110,
                          },
                        ]}
                        width={300}
                        height={180}
                        sx={{
                          "& .MuiChartsLegend-root": {
                            transform: "translate(-20px) translateY(-20px)",
                          },
                        }}
                      />
                      <span className="gauge-block-title">AI vs Human</span>
                    </div>

                    <div className="gauge-block">
                      <ConfidenceGauge confidence={overall.modelConfidence ?? 0} />
                      <span className="gauge-block-title">Model detection</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="metric-row">
                <div className="metric-label-row">
                    <span className="metric-label">Chunks</span>

                    <InfoTooltip
                        text="The text is divided into overlapping chunks before being analyzed independently. These chunk predictions are combined to produce the overall verdict and highlighted regions."
                    />
                </div>
                <div className="metric-value">{scanResponse.results.length}</div>
              </div>

              {selectedModel?.id !== "model" && (
                <>
                  <div className="metric-row">
                    <div className="metric-label">AI chunks</div>
                    <div className="metric-value" style={{ color: "#e05c5c" }}>
                      {labelledResults.filter(r => r.probai > HYBRID_HIGH).length}
                    </div>
                  </div>

                  {labelledResults.some(r => r.probai <= HYBRID_HIGH && r.probhuman <= HYBRID_HIGH) && (
                    <div className="metric-row">
                      <div className="metric-label">Hybrid chunks</div>
                      <div className="metric-value" style={{ color: "#f0a500" }}>
                        {labelledResults.filter(r => r.probai <= HYBRID_HIGH && r.probhuman <= HYBRID_HIGH).length}
                      </div>
                    </div>
                  )}

                  <div className="metric-row">
                    <div className="metric-label">Human chunks</div>
                    <div className="metric-value" style={{ color: "#4caf50" }}>
                      {labelledResults.filter(r => r.probhuman > HYBRID_HIGH).length}
                    </div>
                  </div>
                </>
              )}

              {/* Window configuration */}
              <div className="metric-row">
                <div className="metric-label-row">
                  <span className="metric-label">Window config</span>
                  <InfoTooltip
                      text="Long texts are analyzed in overlapping chunks rather than all at once. These settings determine how the chunks are created before their predictions are combined into the final verdict."
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#888" }}>Type</span>
                    <span style={{ fontWeight: 500, color: "#333" }}>{windowMode === "words" ? "Words" : "Characters"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#888" }}>Window size</span>
                    <span style={{ fontWeight: 500, color: "#333" }}>{scanResponse.window_size} {windowMode === "words" ? "words" : "chars"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#888" }}>Stride</span>
                    <span style={{ fontWeight: 500, color: "#333" }}>{scanResponse.stride} {windowMode === "words" ? "words" : "chars"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#888" }}>Overlap</span>
                    <span style={{ fontWeight: 500, color: "#333" }}>
                      {scanResponse.window_size - scanResponse.stride} {windowMode === "words" ? "words" : "chars"}
                    </span>
                  </div>
                </div>
              </div>

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

              {/* Model detection legend — only when model or binary/model */}
              {(selectedModel?.id === "model" || selectedModel?.id === "binary/model") && (() => {
                // Get unique models that actually appeared in results
                const detectedModels = [...new Set(
                  labelledResults
                    .filter(r => r.gen_model)
                    .map(r => r.gen_model!)
                )];

                if (!detectedModels.length) return null;

                return (
                  <div className="metric-row" style={{ borderTop: "0.5px solid #f0f0f0", paddingTop: "0.75rem" }}>
                    <div className="metric-label" style={{ marginBottom: 6 }}>Model key</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {detectedModels.map(model => (
                        <div key={model} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                          <span style={{
                            width: 10, height: 10, borderRadius: 2,
                            background: getModelColor(model),
                            flexShrink: 0,
                          }} />
                          <span style={{ color: "#333", fontWeight: 500 }}>{model}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>
             {selectedSeg && (
              <div
                className="metrics-panel"
                style={{ cursor: "pointer" }}
                onClick={() => setChunkModalOpen(true)}
              >
                {/* Header */}
                <div className="metrics-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: selectedSeg.label === "AI" ? "#E24B4A"
                                : selectedSeg.label === "Human" ? "#639922" : "#f0a500",
                      flexShrink: 0,
                    }} />
                    <span>Chunk {selectedSeg.chunkIndex} / {selectedSeg.totalChunks}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedSeg(null); }}
                    style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                  >✕</button>
                </div>

                {/* Rows */}
                <div className="metric-row">
                  <div className="metric-label">Range</div>
                  <div className="metric-value" style={{ fontSize: 14 }}>{selectedSeg.start} – {selectedSeg.end}</div>
                </div>

                {selectedSeg.probai > 0 && (
                  <div className="metric-row">
                    <div className="metric-label">P(AI)</div>
                    <div className="metric-value" style={{ fontSize: 14, color: "#E24B4A" }}>
                      {(selectedSeg.probai * 100).toFixed(1)}%
                    </div>
                  </div>
                )}

                {selectedSeg.probhuman > 0 && (
                  <div className="metric-row">
                    <div className="metric-label">P(Human)</div>
                    <div className="metric-value" style={{ fontSize: 14, color: "#639922" }}>
                      {(selectedSeg.probhuman * 100).toFixed(1)}%
                    </div>
                  </div>
                )}

                {selectedSeg.gen_model && (
                  <div className="metric-row">
                    <div className="metric-label">Model</div>
                    <div className="metric-value" style={{ fontSize: 14, color: getModelColor(selectedSeg.gen_model) }}>
                      {selectedSeg.gen_model}
                    </div>
                  </div>
                )}

                <div className="metric-row" style={{ textAlign: "center", color: "#aaa", fontSize: 11 }}>
                  Click to view all features →
                </div>
              </div>
            )}
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
              accept=".docx,.txt,.pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
            <span style={{ fontSize: 12, color: charCount > 11000 ? "#e07b30" : "#888" }}>
              {charCount.toLocaleString()} / 12,000 characters
            </span>
          </div>
          
        </>
      )}
      <ChunkModal
        seg={selectedSeg}
        open={chunkModalOpen}
        onClose={() => setChunkModalOpen(false)}
        selectedModelId={selectedModel?.id}
      />
    </div>
  );
}