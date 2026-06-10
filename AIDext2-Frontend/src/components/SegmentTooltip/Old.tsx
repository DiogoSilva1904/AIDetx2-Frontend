import { useState, useRef } from "react";

interface TextSegment {
  text: string;
  label: "AI" | "Human";
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
  windowMode: "chars" | "words";  // added
}


export default function SegmentTooltip({ segments, selectedModel, windowMode }: Props) {
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

  const isAI = tooltip?.seg.label === "AI";

  const tooltipRows = [
    {
      label: "Confidence",
      value: `${((tooltip?.seg.score ?? 0) * 100).toFixed(1)}%`,  // fixed brackets
      color: isAI ? "#e05c5c" : "#4caf50",
    },
    ...(showGenModel ? [{
      label: "Model",
      value: tooltip?.seg.gen_model ?? "—",
      color: "#fff",
    }] : []),
    {
      label: "Chunk",
      value: `${tooltip?.seg.chunkIndex} / ${tooltip?.seg.totalChunks}`,
      color: "#fff",
    },
    {
      label: "Range",
      value: `${tooltip?.seg.start} – ${tooltip?.seg.end}`,
      color: "rgba(255,255,255,0.7)",
    },
    {
      label: "Length",
      value: windowMode === "words"
        ? `${tooltip?.seg.text.trim().split(/\s+/).filter(Boolean).length ?? 0} words`
        : `${(tooltip?.seg.end ?? 0) - (tooltip?.seg.start ?? 0)} chars`,
      color: "rgba(255,255,255,0.7)",
    },
  ];

  return (
    <div ref={containerRef} className="result-text-box" style={{ position: "relative" }}>
      {segments.map((seg, i) => (
        <span
          key={i}
          className={seg.label === "AI" ? "highlight-ai" : "highlight-human"}
          style={{ cursor: "default" }}
          onMouseMove={(e) => handleMouseMove(e, seg)}
          onMouseLeave={() => setTooltip(null)}
        >
          {seg.text}
        </span>
      ))}

      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 14,
            top: tooltip.y + 14,
            background: "#2a282b",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            pointerEvents: "none",
            zIndex: 100,
            minWidth: 190,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: isAI ? "#e05c5c" : "#4caf50",
              flexShrink: 0,
            }} />
            <span style={{ fontWeight: 500, color: "#fff" }}>
              {isAI ? "AI-generated" : "Human-written"}
            </span>
          </div>

          <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", marginBottom: 8 }} />

          {tooltipRows.map(({ label, value, color }) => (
            <div key={label} style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              marginTop: 4,
              color: "rgba(255,255,255,0.5)",
            }}>
              <span>{label}</span>
              <span style={{ fontWeight: 500, color }}>{value as string}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}