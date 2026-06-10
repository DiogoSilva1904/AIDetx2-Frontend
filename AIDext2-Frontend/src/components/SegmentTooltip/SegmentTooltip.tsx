import { useState, useRef } from "react";

interface TextSegment {
  text: string;
  label: "AI" | "Human" | "Hybrid";  // ← Hybrid added
  score: number;
  gen_model?: string;
  chunkIndex: number;
  totalChunks: number;
  start: number;
  end: number;
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

export default function SegmentTooltip({ segments, selectedModel, windowMode, onRescan }: Props) {
  const [tooltip, setTooltip] = useState<{
    seg: TextSegment;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showGenModel = selectedModel?.id === "binary/model" || selectedModel?.id === "model";

  function handleMouseMove(e: React.MouseEvent<HTMLSpanElement>, seg: TextSegment) {
    const containerRect = containerRef.current!.getBoundingClientRect();
    setTooltip({
      seg,
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    });
  }

  const seg   = tooltip?.seg;
  const color = seg ? LABEL_COLORS[seg.label] : "#fff";

  const tooltipRows = seg ? [
    {
      label: "Confidence",
      value: `${(seg.score * 100).toFixed(1)}%`,
      color,
    },
    ...(showGenModel ? [{
      label: "Model",
      value: seg.gen_model ?? "—",
      color: "#fff",
    }] : []),
    {
      label: "Chunk",
      value: `${seg.chunkIndex} / ${seg.totalChunks}`,
      color: "#fff",
    },
    {
      label: "Range",
      value: `${seg.start} – ${seg.end}`,
      color: "rgba(255,255,255,0.7)",
    },
    {
      label: "Length",
      value: windowMode === "words"
        ? `${seg.text.trim().split(/\s+/).filter(Boolean).length} words`
        : `${seg.end - seg.start} chars`,
      color: "rgba(255,255,255,0.7)",
    },
  ] : [];

  return (
    <div ref={containerRef} className="result-text-box" style={{ position: "relative" }}>

      {/* Highlighted text */}
      {segments.map((s, i) => (
        <span
          key={i}
          // CSS classes: highlight-ai | highlight-human | highlight-hybrid
          // Add .highlight-hybrid to your TextClassifierBox.css (see below)
          className={
            s.label === "AI"     ? "highlight-ai"
          : s.label === "Hybrid" ? "highlight-hybrid"
          : "highlight-human"
          }
          style={{ cursor: "default" }}
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
            position:     "absolute",
            left:         tooltip.x + 14,
            top:          tooltip.y + 14,
            background:   "#2a282b",
            border:       "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding:      "10px 14px",
            fontSize:     13,
            pointerEvents: "none",
            zIndex:       100,
            minWidth:     190,
            whiteSpace:   "nowrap",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: color, flexShrink: 0,
            }} />
            <span style={{ fontWeight: 500, color: "#fff" }}>
              {LABEL_COPY[seg.label]}
            </span>
          </div>

          <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", marginBottom: 8 }} />

          {/* Rows */}
          {tooltipRows.map(({ label, value, color: rowColor }) => (
            <div key={label} style={{
              display:        "flex",
              justifyContent: "space-between",
              gap:            20,
              marginTop:      4,
              color:          "rgba(255,255,255,0.5)",
            }}>
              <span>{label}</span>
              <span style={{ fontWeight: 500, color: rowColor }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.6rem" }}>
        <span style={{ fontSize: 12, color: "#888" }}>
          Hover a segment for details —{" "}
          <span className="highlight-human" style={{ padding: "1px 4px", borderRadius: 3 }}>Human</span>{" "}
          <span className="highlight-hybrid" style={{ padding: "1px 4px", borderRadius: 3 }}>Hybrid</span>{" "}
          <span className="highlight-ai" style={{ padding: "1px 4px", borderRadius: 3 }}>AI</span>
        </span>
        <button onClick={onRescan} className="rescanBtnStyle">← Scan new text</button>
      </div>
    </div>
  );
}