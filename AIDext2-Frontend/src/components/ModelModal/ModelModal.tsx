import { useState } from "react";
import "./ModelModal.css";

interface Model {
  id: string;
  name: string;
  description: string;
  badge?: string;
  category: "ml" | "dl";
}

const MODELS: Model[] = [
  {
    id: "binary",
    name: "HUMAN vs AI",
    description: "Detect if text is human or ai",
    category: "ml",
  },
  {
    id: "binary/model",
    name: "HUMAN vs AI AND MODEL DETECTION",
    description: "Detect if a text is human or AI, if it is AI, the model that generated it.",
    category: "ml",
  },
  {
    id: "model",
    name: "MODEL DETECTION",
    description: "Detect the model that generated the text",
    category: "ml",
  },
  {
    id: "binary",
    name: "HUMAN vs AI",
    description: "Detect if text is human or ai",
    category: "dl",
  },
  {
    id: "binary/model",
    name: "HUMAN/AI + MODEL DETECTION",
    description: "Detect if a text is human or AI, if it is AI, the model that generated it.",
    category: "dl",
  },
  {
    id: "model",
    name: "MODEL DETECTION",
    description: "Detect the model that generated the text",
    category: "dl",
  },
];

type Category = "ml" | "dl";

interface ModelModalProps {
  currentModel: string;
  onSelect: (modelId: string, category: "ml"|"dl") => void;
}

export default function ModelModal({ currentModel, onSelect }: ModelModalProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<string>(currentModel);
  const [category, setCategory] = useState<Category>("ml");

  function handleSelect(modelId: string, category: "ml"|"dl") {
    setSelected(modelId);
    onSelect(modelId, category);
    setIsOpen(false);
  }

  const currentModelName = MODELS.find((m) => m.id === selected)?.name ?? "Select Model";
  const filteredModels = MODELS.filter((m) => m.category === category);

  return (
    <>
      {/* Trigger button */}
      <button className="model-trigger-btn" onClick={() => setIsOpen(true)}>
        {currentModelName}
        <span className="model-trigger-chevron">▾</span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h2 className="modal-title">Choose a Model</h2>
              <button className="modal-close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {/* Category toggle */}
            <div className="modal-toggle-wrap">
              <div className="modal-toggle">
                <button
                  className={`toggle-btn ${category === "ml" ? "toggle-btn--active" : ""}`}
                  onClick={() => setCategory("ml")}
                >
                  Machine Learning
                </button>
                <button
                  className={`toggle-btn ${category === "dl" ? "toggle-btn--active" : ""}`}
                  onClick={() => setCategory("dl")}
                >
                  Deep Learning
                </button>
              </div>
            </div>

            <div className="modal-cards">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  className={`model-card ${
                    category === "ml" && selected === model.id
                      ? "model-card--selected"
                      : ""
                  } ${category === "dl" ? "model-card--disabled" : ""}`}
                  onClick={category === "ml"
                    ? () => handleSelect(model.id, model.category)
                    : undefined
                  }
                >
                  <div className="model-card-top">
                    <span className="model-card-name">{model.name}</span>
                    {model.badge && (
                      <span className={`model-card-badge model-card-badge--${model.badge.toLowerCase()}`}>
                        {model.badge}
                      </span>
                    )}
                  </div>
                  <p className="model-card-desc">{model.description}</p>
                  {category === "ml" && selected === model.id && (
                    <span className="model-card-check">✓</span>
                  )}
                </div>
              ))}
            </div>

            {category === "dl" && (
              <div className="coming-soon">
                🚀 Deep Learning models are coming soon.
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}