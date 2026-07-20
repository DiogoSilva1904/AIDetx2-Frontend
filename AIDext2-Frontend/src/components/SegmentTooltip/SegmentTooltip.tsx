import { useState, useRef } from "react";

interface TextSegment {
  text: string;
  label: "AI" | "Human" | "Hybrid";
  probai: number;
  probhuman: number;
  probmodel?: number;   // ← add
  gen_model?: string;
  chunkIndex: number;
  totalChunks: number;
  start: number;
  end: number;
  features: Record<string, number>;
}

interface Props {
  segments: TextSegment[];
  selectedModel: { id: string; category: "ml" | "dl" } | null;
  windowMode: "chars" | "words";
  onRescan: () => void;
}

// Centralised colour map — single source of truth for all three labels
const LABEL_COLORS: Record<"AI" | "Human" | "Hybrid", string> = {
  AI:     "#e05c5c",
  Hybrid: "#f0a500",
  Human:  "#4caf50",
};

const LABEL_COPY: Record<"AI" | "Human" | "Hybrid", string> = {
  AI:     "AI-generated",
  Hybrid: "Mixed / transition",
  Human:  "Human-written",
};

const MODEL_COLORS: Record<string, string> = {
  deepseek: "#6366f1",
  gpt_oss:  "#10b981",
  llama:    "#f59e0b",
  mistral:  "#8b5cf6",
};

interface Props {
  segments: TextSegment[];
  selectedModel: { id: string; category: "ml" | "dl" } | null;
  windowMode: "chars" | "words";
  onRescan: () => void;
  onSegmentSelect: (seg: TextSegment | null) => void;  // ← add
  selectedSeg: TextSegment | null;                      // ← add
}

export default function SegmentTooltip({ segments, selectedModel, windowMode, onRescan, onSegmentSelect, selectedSeg }: Props) {
  const [tooltip, setTooltip] = useState<{
    seg: TextSegment;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  

  const showGenModel = selectedModel?.id === "binary/model" || selectedModel?.id === "model";
  const isModelOnly  = selectedModel?.id === "model";

  function handleMouseMove(e: React.MouseEvent<HTMLSpanElement>, seg: TextSegment) {
    const containerRect = containerRef.current!.getBoundingClientRect();
    setTooltip({
      seg,
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    });
  }

  const seg   = tooltip?.seg;

  const headerText = seg
    ? (isModelOnly && seg.gen_model ? seg.gen_model : LABEL_COPY[seg.label])
    : "";

  const color = seg
    ? (isModelOnly && seg.gen_model ? MODEL_COLORS[seg.gen_model] ?? "#888" : LABEL_COLORS[seg.label])
    : "#888";

  const tooltipRows = seg
  ? [
      ...(!isModelOnly
        ? [
            {
              label: "P(AI)",
              value: `${(seg.probai * 100).toFixed(1)}%`,
              color: "#e05c5c",
            },
            {
              label: "P(Human)",
              value: `${(seg.probhuman * 100).toFixed(1)}%`,
              color: "#4caf50",
            },
          ]
        : []),

      ...(showGenModel && seg.gen_model
        ? [
            {
            label: "Model",
            value: seg.gen_model,
            color: MODEL_COLORS[seg.gen_model] ?? "#f0a500",  // ← per-model color
          },
          ...(seg.probmodel !== undefined ? [{
            label: "Model confidence",
            value: `${(seg.probmodel * 100).toFixed(1)}%`,
            color: MODEL_COLORS[seg.gen_model] ?? "#f0a500",  // ← same color
          }] : []),
        ] : []),

      {
        label: "Chunk",
        value: `${seg.chunkIndex} / ${seg.totalChunks}`,
        color: "#333",
      },
      {
        label: "Range",
        value: `${seg.start} – ${seg.end}`,
        color: "#555",
      },
      {
        label: "Length",
        value:
          windowMode === "words"
            ? `${seg.text.trim().split(/\s+/).filter(Boolean).length} words`
            : `${seg.end - seg.start} chars`,
        color: "#555",
      },
    ]
  : [];

  return (
    <div ref={containerRef} className="result-text-box" style={{ position: "relative" }}>

      {/* Highlighted text */}
      {segments.map((s, i) => (
        <span
          key={i}
          // CSS classes: highlight-ai | highlight-human | highlight-hybrid
          // Add .highlight-hybrid to your TextClassifierBox.css (see below)
          className={
            isModelOnly && s.gen_model
              ? undefined  // no class, use inline style instead
              : s.label === "AI"     ? "highlight-ai"
              : s.label === "Hybrid" ? "highlight-hybrid"
              : "highlight-human"
          }
          style={{
            cursor: "pointer",
            ...(isModelOnly && s.gen_model ? {
              backgroundColor: `${MODEL_COLORS[s.gen_model] ?? "#888"}22`,
              borderRadius: 4,
              padding: "1px 0",
            } : {})
          }}
          onClick={() => onSegmentSelect(s === selectedSeg ? null : s)}
          //style={{ cursor: "default" }}
          onMouseMove={(e) => handleMouseMove(e, s)}
          onMouseLeave={() => setTooltip(null)}
        >
          {s.text}
        </span>
      ))}

      {/* Tooltip */}
      {tooltip && seg && (
        <div
          style={{
            position:      "absolute",
            left:          tooltip.x + 14,
            top:           tooltip.y + 14,
            background:    "#fff",
            border:        "0.5px solid #e0e0e0",
            borderRadius:  10,
            padding:       "10px 14px",
            fontSize:      13,
            pointerEvents: "none",
            zIndex:        100,
            minWidth:      190,
            whiteSpace:    "nowrap",
            boxShadow:     "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: color, flexShrink: 0,
            }} />
            <span style={{ fontWeight: 500, color: "#111" }}>{headerText}</span>
          </div>

          <div style={{ borderTop: "0.5px solid #f0f0f0", marginBottom: 8 }} />

          {/* Rows */}
          {tooltipRows.map(({ label, value, color: rowColor }) => (
            <div key={label} style={{
              display:        "flex",
              justifyContent: "space-between",
              gap:            20,
              marginTop:      4,
              color:          "#888",
            }}>
              <span>{label}</span>
              <span style={{ fontWeight: 500, color: rowColor === "rgba(255,255,255,0.7)" ? "#555" : rowColor }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.6rem" }}>
        {isModelOnly ? (
          <span style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            Hover for details —{" "}
            {Object.entries(MODEL_COLORS).map(([model, color]) => (
              <span key={model} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
                <span>{model}</span>
              </span>
            ))}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#888" }}>
            Hover a segment for details —{" "}
            <span className="highlight-human" style={{ padding: "1px 4px", borderRadius: 3 }}>Human</span>{" "}
            <span className="highlight-hybrid" style={{ padding: "1px 4px", borderRadius: 3 }}>Hybrid</span>{" "}
            <span className="highlight-ai" style={{ padding: "1px 4px", borderRadius: 3 }}>AI</span>
          </span>
        )}
        <button onClick={onRescan} className="rescanBtnStyle">← Scan new text</button>
      </div>
    </div>
  );
}