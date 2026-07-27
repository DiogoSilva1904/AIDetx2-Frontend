import { useState } from "react";
import "./ChunkModal.css";
import type { TextSegment } from "../TextClassifierBox/TextClassifierBox";
import ConfidenceGauge from "../ConfidenceGauge/ConfidenceGauge";
import { PieChart } from "@mui/x-charts/PieChart";

interface Props {
  seg: TextSegment | null;
  open: boolean;
  onClose: () => void;
  selectedModelId?: string;
}

const MODEL_COLORS: Record<string, string> = {
  deepseek: "#6366f1",
  gpt_oss:  "#10b981",
  llama:    "#f59e0b",
  mistral:  "#8b5cf6",
};

export default function ChunkModal({ seg, open, onClose, selectedModelId }: Props) {
  const [activeFeatureSet, setActiveFeatureSet] = useState<"binary" | "model">("binary");

  if (!open || !seg) return null;

  const labelColor = seg.label === "AI" ? "#E24B4A"
                   : seg.label === "Human" ? "#639922" : "#f0a500";

  const labelText = seg.label === "AI" ? "AI-generated"
                  : seg.label === "Human" ? "Human-written" : "Mixed / transition";

  const hasBinaryConfidence = seg.probai !== undefined && seg.probhuman !== undefined;
  /* const binaryGaugeValue = hasBinaryConfidence
    ? (seg.label === "Human" ? seg.probhuman : seg.probai)
    : undefined; */
  const hasModelConfidence = seg.probmodel !== undefined;

  const showBinaryGauge = hasBinaryConfidence && selectedModelId !== "model";
  const showModelGauge  = hasModelConfidence;

  const featuresBinary  = (seg as any).featuresBinary as number[] | undefined;
  const featuresModel   = (seg as any).featuresModel  as number[] | undefined;
  const fallbackFeatures = seg.features;

  const hasBothFeatureSets = !!featuresBinary && !!featuresModel;
  const activeFeatures = hasBothFeatureSets
    ? (activeFeatureSet === "binary" ? featuresBinary : featuresModel)
    : (fallbackFeatures ?? {});

  return (
    <div className="chunk-modal-overlay" onClick={onClose}>
      <div className="chunk-modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="chunk-modal-header">
          <div className="chunk-modal-header-left">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: labelColor, flexShrink: 0, display: "inline-block" }} />
            <span className="chunk-modal-title">Chunk {seg.chunkIndex} / {seg.totalChunks}</span>
            <span className="chunk-modal-badge" style={{ background: `${labelColor}18`, color: labelColor }}>
              {labelText}
            </span>
          </div>
          <button className="chunk-modal-close" onClick={onClose}>✕</button>
        </div>

        <hr className="chunk-modal-divider" />

        {/* Body */}
        <div className="chunk-modal-body">

          {/* Left */}
          <div className="chunk-modal-left">
            <Section title="Classification">
              {selectedModelId !== "model" && hasBinaryConfidence && (
                <>
                  <Row label="P(AI)"    value={`${(seg.probai * 100).toFixed(1)}%`}    color="#E24B4A" />
                  <Row label="P(Human)" value={`${(seg.probhuman * 100).toFixed(1)}%`} color="#639922" />
                </>
              )}
              {seg.gen_model && (
                <Row label="Detected model" value={seg.gen_model} color={MODEL_COLORS[seg.gen_model] ?? "#888"} />
              )}
              {seg.probmodel !== undefined && (
                <Row label="Model confidence" value={`${(seg.probmodel * 100).toFixed(1)}%`} color={MODEL_COLORS[seg.gen_model ?? ""] ?? "#888"} />
              )}
            </Section>

            <Section title="Position">
              <Row label="Start"  value={String(seg.start)} />
              <Row label="End"    value={String(seg.end)} />
              <Row label="Length" value={`${seg.end - seg.start} chars`} />
              <Row label="Words"  value={String(seg.text.trim().split(/\s+/).filter(Boolean).length)} />
            </Section>

            <Section title="Text preview">
              <div className="chunk-modal-preview">
                {seg.text.slice(0, 300)}{seg.text.length > 300 ? "…" : ""}
              </div>
            </Section>
          </div>

          {/* Right — Gauges */}
          {(showBinaryGauge || showModelGauge) && (
            <div className="chunk-modal-right">
              <div className="chunk-modal-right-title">Confidence</div>

              {selectedModelId === "binary" && showBinaryGauge && (
                <BinaryPieBlock
                  aiConfidence={seg.probai}
                  humanConfidence={seg.probhuman}
                />
              )}

              {selectedModelId === "model" && showModelGauge && (
                <ModelGaugeBlock
                  confidence={seg.probmodel!}
                />
              )}

              {selectedModelId === "binary/model" && (
                <>
                  {showBinaryGauge && (
                    <BinaryPieBlock
                      aiConfidence={seg.probai}
                      humanConfidence={seg.probhuman}
                    />
                  )}

                  {showModelGauge && (
                    <ModelGaugeBlock
                      confidence={seg.probmodel!}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div>
          <div className="chunk-modal-features-header">
            <div className="chunk-modal-section-title">Features</div>
            {hasBothFeatureSets && (
              <div className="chunk-modal-tab-group">
                <button
                  className={`chunk-modal-tab ${activeFeatureSet === "binary" ? "chunk-modal-tab--active" : "chunk-modal-tab--inactive"}`}
                  onClick={() => setActiveFeatureSet("binary")}
                >Binary</button>
                <button
                  className={`chunk-modal-tab ${activeFeatureSet === "model" ? "chunk-modal-tab--active" : "chunk-modal-tab--inactive"}`}
                  onClick={() => setActiveFeatureSet("model")}
                >Model</button>
              </div>
            )}
          </div>

          <div className="chunk-modal-features-grid">
            {Array.isArray(activeFeatures)
              ? activeFeatures.map((val, i) => (
                  <Row key={i} label={`feature_${i}`} value={typeof val === "number" ? val.toFixed(4) : String(val)} />
                ))
              : Object.entries(activeFeatures).map(([key, val]) => (
                  <Row key={key} label={key} value={typeof val === "number" ? val.toFixed(4) : String(val)} />
                ))
            }
          </div>
        </div>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="chunk-modal-section-title">{title}</div>
      <div className="chunk-modal-section-box">{children}</div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="chunk-modal-row">
      <span className="chunk-modal-row-label">{label}</span>
      <span className="chunk-modal-row-value" style={color ? { color } : undefined}>{value}</span>
    </div>
  );
}

function BinaryPieBlock({
  aiConfidence,
  humanConfidence,
}: {
  aiConfidence: number;
  humanConfidence: number;
}) {
  return (
    <div className="gauge-block">
      <PieChart
        series={[
          {
            data: [
              {
                id: 0,
                value: aiConfidence * 100,
                label: "AI",
                color: "#E24B4A",
              },
              {
                id: 1,
                value: humanConfidence * 100,
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
        height={140}
        sx={{
          "& .MuiChartsLegend-root": {
            transform: "translate(-5px) translateY(10px)",
          },
        }}
      />

      <span className="gauge-block-title">
        AI vs Human
      </span>
    </div>
  );
}

function ModelGaugeBlock({
  confidence,
}: {
  confidence: number;
}) {
  return (
    <div className="gauge-block">
      <ConfidenceGauge confidence={confidence} />
      <span className="gauge-block-title">
        Model detection
      </span>
    </div>
  );
}