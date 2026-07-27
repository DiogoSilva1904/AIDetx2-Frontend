import { useEffect, useState } from 'react'
import './Documentation.css'

interface NavItem {
  id: string
  label: string
  icon: string
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ id: 'overview', label: 'Introduction', icon: 'ti-home' }],
  },
  {
    label: 'The tool',
    items: [
      { id: 'tool', label: 'How it works', icon: 'ti-scan' },
      { id: 'window', label: 'Window modes', icon: 'ti-layout-columns' },
    ],
  },
  {
    label: 'Architecture',
    items: [
        { id: 'arch-backend', label: 'Backend architecture', icon: 'ti-server-2' },
        { id: 'arch-local', label: 'Local architecture', icon: 'ti-device-laptop' },
    ],
  },
  {
    label: 'Features',
    items: [
      { id: 'app-features', label: 'App features', icon: 'ti-sparkles' },
    ],
  },
  {
    label: 'Reference',
    items: [
        { id: 'limitations', label: 'Limitations', icon: 'ti-alert-triangle' },
        { id: 'comparison', label: 'Local vs Backend', icon: 'ti-arrows-left-right' },
        { id: 'faq', label: 'FAQ', icon: 'ti-help-circle' },
        { id: 'contributing', label: 'Contributing', icon: 'ti-git-pull-request' },
    ],
  },
  {
    label: 'Resources',
    items: [{ id: 'github', label: 'GitHub', icon: 'ti-brand-github' }],
  },
]

const appFeatures = [
  {
    icon: 'ti-highlight',
    name: 'Segment highlighting',
    desc: 'Each text segment is highlighted in-place — red for AI, green for human — with hover tooltips showing per-block details.(change colors later?????)',
  },
  {
    icon: 'ti-gauge',
    name: 'Confidence gauge',
    desc: 'An animated gauge shows the document-level confidence score derived from the average of all block predictions.',
  },
  {
    icon: 'ti-upload',
    name: 'File upload',
    desc: 'Drag and drop or upload .txt, .docx and .pdf files. Text is extracted and loaded directly into the scanner.',
  },
  {
    icon: 'ti-cpu',
    name: 'Model selection',
    desc: 'Choose between multiple detection models. Switching models clears the previous result so comparisons are always fresh.',
  },
  {
    icon: 'ti-toggle-left',
    name: 'Window mode toggle',
    desc: 'Switch between character and word windowing at any time. Changing mode resets both the result and the input text.',
  },
  {
    icon: 'ti-robot',
    name: 'Generator attribution',
    desc: 'For supported models, the most common generator (GPT-4, Gemini, etc.) is identified from AI-flagged chunks and shown in the analysis panel.',
  },
]

/*const extractedFeatures = [
  {
    label: 'label',
    desc: 'Binary classification result — AI or Human — for the block.',
  },
  {
    label: 'score',
    desc: 'Confidence in the predicted label, expressed as a float between 0 and 1.',
  },
  {
    label: 'start / end',
    desc: 'Character offsets into the original text.',
  },
  {
    label: 'gen_model',
    desc: 'The generating model identified for the block.',
  },
  {
    label: 'chunk_index / total_chunks',
    desc: 'Position of this block within the full sliding window sequence.',
  },
]*/

export default function Documentation() {
    const [activeId, setActiveId] = useState('overview')

    useEffect(() => {
        // 1. Define the observer to watch section visibility
        const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
            // If a section is in view (intersecting), set it as active
            // threshold: 0.5 means when 50% of the section is visible
            if (entry.isIntersecting) {
                setActiveId(entry.target.id)
            }
            })
        },
        { rootMargin: '-20% 0% -35% 0%', threshold: 0.2 }
        )

        // 2. Observe all sections that have an ID
        const sections = document.querySelectorAll('.docs-section')
        sections.forEach((section) => observer.observe(section))

        return () => {
        sections.forEach((section) => observer.unobserve(section))
        }
    }, [])
    return (
        <div className="docs-shell">
        <aside className="docs-sidebar">
            {navGroups.map((group) => (
            <div className="docs-nav-group" key={group.label}>
                <div className="docs-nav-group-label">{group.label}</div>

                {group.items.map((item) => (
                <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`docs-nav-item ${activeId === item.id ? 'active' : ''}`}
                >
                    <i className={`ti ${item.icon}`} aria-hidden="true" />
                    {item.label}
                </a>
                ))}
            </div>
            ))}
        </aside>

        <main className="docs-main">

            {/* ───────────────── Overview ───────────────── */}

            <section className="docs-section" id="overview">
            <div className="docs-eyebrow">Getting started</div>

            <h1 className="docs-title">Introduction</h1>

            <p className="docs-lead">
                AIDetx2 is an AI-generated text detection platform designed
                to analyze and classify written content.
            </p>

            <hr className="docs-divider" />

            <h2 className="docs-h2">What does it do?</h2>

            <p className="docs-prose">
                AIDetx2 analyzes text to determine whether it was written
                by a human or generated by an AI model. When AI-generated
                content is detected, the platform can also identify the
                most likely model responsible for generating the text.
            </p>

            <p className="docs-prose">
                The analysis is performed at both segment and document levels.
                Using a sliding window approach, the system evaluates smaller
                portions of the text independently, allowing for more accurate
                detection of mixed or partially AI-generated content.
            </p>

            <p className="docs-prose">
                AIDetx2 supports multiple detection models, configurable
                windowing modes based on characters or words, and provides
                confidence scores for each analyzed segment alongside the
                final document-level prediction.
            </p>
            </section>

            {/* ───────────────── Tool ───────────────── */}

            <section className="docs-section" id="tool">
            <div className="docs-eyebrow">The tool</div>

            <h1 className="docs-title">How it works</h1>

            <p className="docs-lead">
                AIDetx2 analyzes text through a multi-stage detection pipeline
                that combines segment-level predictions into a final document
                classification.
            </p>

            <hr className="docs-divider" />

            <h2 className="docs-h2">Detection pipeline</h2>

            <p className="docs-prose">
                When a document is submitted, the text first goes through
                a preprocessing stage where formatting inconsistencies,
                spacing issues, and unsupported characters are normalized.
            </p>

            <p className="docs-prose">
                After preprocessing, the document is divided into smaller
                overlapping segments using a sliding window approach.
                For each segment, statistical, linguistic, and stylometric
                features are extracted and analyzed by the selected
                detection model.
            </p>

            <p className="docs-prose">
                The predictions generated for each segment are then aggregated
                to produce a document-level classification, improving overall
                detection stability and robustness.
            </p>

            <div className="docs-pipeline">
                <h1>missing pipeline diagram(?)</h1>
            </div>
            </section>

            {/* ───────────────── Window ───────────────── */}

            <section className="docs-section" id="window">

            <h1 className="docs-title">Sliding Window Segmentation</h1>

            <p className="docs-lead">
                AIDetx2 uses an overlapping sliding window strategy to divide documents into
                smaller text segments that can be analyzed independently by the detection models.
            </p>

            <hr className="docs-divider" />

            <p className="docs-prose">
                Instead of processing an entire document as a single input, the text is split
                into multiple overlapping blocks. Each block is independently analyzed, allowing
                the system to detect localized AI-generated patterns across different regions of
                the document.
            </p>


            <p className="docs-prose">
                This approach is particularly useful for identifying hybrid documents that contain
                both human-written and AI-generated content. By analyzing smaller segments
                independently, AIDetx2 can detect isolated AI-generated regions even when they
                are embedded within predominantly human-written text.
            </p>

            <p className="docs-prose">
                The overlap between consecutive blocks is controlled through a configurable
                stride value. This overlap helps reduce boundary effects, improves contextual
                continuity between segments, and increases the stability of the final prediction.
            </p>

            <p className="docs-prose">
                AIDetx2 supports two segmentation modes: a word-based sliding window and a
                character-based sliding window. Depending on the selected mode and the size
                of the submitted document, the system automatically determines the most
                appropriate window size and stride configuration.
            </p>

            <p className="docs-prose">
                Smaller documents may be processed as a single segment, while larger documents
                are divided into multiple overlapping windows to improve detection accuracy
                and provide more detailed segment-level analysis.
            </p>

            <hr className="docs-divider" />

            <div className="docs-feature-grid">
            <div className="docs-feature-card">
                <div className="docs-feature-icon">
                <i className="ti ti-text-size" />
                </div>

                <div className="docs-feature-name">
                Character mode
                </div>

                <div className="docs-feature-desc">
                <br />
                <strong>Behavior:</strong><br />
                • &lt; 1,000 chars → single prediction<br />
                • 1,000–4,999 → block 500 / stride 250<br />
                • 5,000–14,999 → block 750 / stride 375<br />
                • 15,000+ → block 1,000 / stride 500
                </div>
            </div>

            <div className="docs-feature-card">
                <div className="docs-feature-icon">
                <i className="ti ti-align-left" />
                </div>

                <div className="docs-feature-name">
                Word mode
                </div>

                <div className="docs-feature-desc">
                <br />
                <strong>Behavior:</strong><br />
                • &lt; 200 words → single prediction<br />
                • 200–999 → block 100 / stride 50<br />
                • 1,000–2,999 → block 150 / stride 75<br />
                • 3,000+ → block 200 / stride 100
                </div>
            </div>
            </div>

            {/* ───────────────── Backend Architecture ───────────────── */}
            <section className="docs-section" id="arch-backend">
            <div className="docs-eyebrow">Architecture</div>

            <h1 className="docs-title">Backend Architecture</h1>

            <p className="docs-lead">
                The backend version runs detection entirely server-side, exposing a
                REST API that the frontend calls for every analysis request.
            </p>

            <hr className="docs-divider" />

            <h2 className="docs-h2">How a request flows through the system</h2>

            <p className="docs-prose">
                The React + Vite frontend sends the submitted text to a FastAPI-based
                REST API. The API forwards the text to the processing layer, where it
                is normalized and segmented before being passed to the detection
                models.
            </p>

            <p className="docs-prose">
                Detection itself is split across two model families: classical{' '}
                <a href="#ml">Machine Learning</a> classifiers running on the extracted
                feature set, and <a href="#dl">Deep Learning</a> models (BERT-based)
                operating directly on the text. Once a prediction is produced, FastAPI
                returns the result back to the frontend for rendering.
            </p>

            <div className="docs-diagram">
                <svg width="100%" viewBox="0 0 680 610" style={{ fontFamily: 'inherit' }}>
                    <defs>
                    <marker id="arrowB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M2 1L8 5L2 9" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </marker>
                    </defs>

                    {/* User */}
                    <rect x="310" y="16" width="100" height="36" rx="18" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="39" textAnchor="middle" fontSize="14">User</text>
                    <line x1="360" y1="52" x2="360" y2="104" stroke="#333" strokeWidth="1" markerEnd="url(#arrowB)" />

                    {/* Frontend container */}
                    <rect x="220" y="70" width="280" height="90" rx="10" fill="#f5f7fb" stroke="#3355aa" strokeWidth="1" />
                    <text x="236" y="90" fontSize="13" fontWeight="600" fill="#3355aa">Frontend</text>
                    <rect x="270" y="104" width="180" height="44" rx="6" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="130" textAnchor="middle" fontSize="14">React + Vite</text>

                    {/* REST API bidirectional arrow */}
                    <line x1="360" y1="160" x2="360" y2="270" stroke="#333" strokeWidth="1" markerStart="url(#arrowB)" markerEnd="url(#arrowB)" />
                    <rect x="330" y="204" width="80" height="20" fill="#eee" />
                    <text x="370" y="218" textAnchor="middle" fontSize="12" fill="#555">REST API</text>

                    {/* Backend container */}
                    <rect x="150" y="230" width="440" height="340" rx="10" fill="#f7f7f7" stroke="#333" strokeWidth="1" />
                    <text x="166" y="250" fontSize="13" fontWeight="600">Backend</text>

                    <rect x="280" y="270" width="160" height="44" rx="6" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="296" textAnchor="middle" fontSize="14">FastAPI REST API</text>
                    <line x1="360" y1="314" x2="360" y2="350" stroke="#333" strokeWidth="1" markerEnd="url(#arrowB)" />

                    <rect x="280" y="350" width="160" height="44" rx="6" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="376" textAnchor="middle" fontSize="14">Text processing</text>
                    <line x1="360" y1="394" x2="360" y2="430" stroke="#333" strokeWidth="1" markerEnd="url(#arrowB)" />

                    <rect x="280" y="430" width="160" height="44" rx="6" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="456" textAnchor="middle" fontSize="14">Detection models</text>

                    <path d="M360 474 L360 490 L260 490 L260 506" fill="none" stroke="#333" strokeWidth="1" markerEnd="url(#arrowB)" />
                    <path d="M360 474 L360 490 L467 490 L467 506" fill="none" stroke="#333" strokeWidth="1" markerEnd="url(#arrowB)" />

                    <rect x="180" y="506" width="160" height="44" rx="6" fill="#eef2fb" stroke="#333" strokeWidth="1" />
                    <text x="260" y="532" textAnchor="middle" fontSize="14">Machine learning</text>

                    <rect x="370" y="506" width="195" height="44" rx="6" fill="#fbeeee" stroke="#333" strokeWidth="1" />
                    <text x="467" y="532" textAnchor="middle" fontSize="14">Deep learning (BERT)</text>

                    {/* Feedback loop back to FastAPI */}
                    <path d="M440 452 C 555 452 555 292 440 292" fill="none" stroke="#333" strokeWidth="1" markerEnd="url(#arrowB)" />
                </svg>
            </div>

            <p className="docs-prose">
                Because inference happens on the server, the backend version can run
                larger, more accurate models without being constrained by the user's
                device, at the cost of requiring a network round-trip for every
                analysis.
            </p>
            </section>

            {/* ───────────────── Local Architecture ───────────────── */}

            <section className="docs-section" id="arch-local">
            <div className="docs-eyebrow">Architecture</div>

            <h1 className="docs-title">Local Architecture</h1>

            <p className="docs-lead">
                The local version runs entirely in the browser — no server round-trip
                is needed, and no text ever leaves the user's device.
            </p>

            <hr className="docs-divider" />

            <h2 className="docs-h2">How a request flows through the system</h2>

            <p className="docs-prose">
                Instead of calling a remote API, the React + Vite frontend hands the
                submitted text to a local inference engine running in the same page.
                This engine performs the same text processing steps as the backend
                version, but then routes the result to{' '}
                <strong>ONNX Runtime Web</strong>, which executes the detection models
                directly in the browser via WebAssembly.
            </p>

            <p className="docs-prose">
                As with the backend version, detection combines Machine Learning
                classifiers and a BERT-based Deep Learning model — the difference is
                that both now run client-side, compiled to a WebAssembly target instead
                of a Python server process.
            </p>

            <div className="docs-diagram">
                <svg width="100%" viewBox="0 0 680 660" style={{ fontFamily: 'inherit' }}>
                    <defs>
                    <marker id="arrowL" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M2 1L8 5L2 9" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </marker>
                    </defs>

                    {/* User */}
                    <rect x="310" y="16" width="100" height="36" rx="18" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="39" textAnchor="middle" fontSize="14">User</text>
                    <line x1="360" y1="52" x2="360" y2="68" stroke="#333" strokeWidth="1" markerEnd="url(#arrowL)" />

                    <rect x="310" y="68" width="100" height="40" rx="6" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="93" textAnchor="middle" fontSize="14">UI</text>
                    <line x1="360" y1="108" x2="360" y2="140" stroke="#333" strokeWidth="1" markerEnd="url(#arrowL)" />

                    {/* Browser/frontend container */}
                    <rect x="150" y="140" width="440" height="480" rx="10" fill="#f5f7fb" stroke="#3355aa" strokeWidth="1" />
                    <text x="166" y="160" fontSize="13" fontWeight="600" fill="#3355aa">Frontend (browser)</text>

                    <rect x="270" y="180" width="180" height="44" rx="6" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="206" textAnchor="middle" fontSize="14">React + Vite</text>
                    <line x1="360" y1="224" x2="360" y2="250" stroke="#333" strokeWidth="1" markerEnd="url(#arrowL)" />

                    <rect x="255" y="250" width="210" height="44" rx="6" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="276" textAnchor="middle" fontSize="14">Local inference engine</text>
                    <line x1="360" y1="294" x2="360" y2="320" stroke="#333" strokeWidth="1" markerEnd="url(#arrowL)" />

                    <rect x="280" y="320" width="160" height="44" rx="6" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="346" textAnchor="middle" fontSize="14">Text processing</text>
                    <line x1="360" y1="364" x2="360" y2="390" stroke="#333" strokeWidth="1" markerEnd="url(#arrowL)" />

                    <rect x="265" y="390" width="190" height="56" rx="6" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="412" textAnchor="middle" fontSize="14">ONNX Runtime Web</text>
                    <text x="360" y="430" textAnchor="middle" fontSize="12" fill="#666">WebAssembly</text>
                    <line x1="360" y1="446" x2="360" y2="470" stroke="#333" strokeWidth="1" markerEnd="url(#arrowL)" />

                    <rect x="280" y="470" width="160" height="44" rx="6" fill="#fff" stroke="#333" strokeWidth="1" />
                    <text x="360" y="496" textAnchor="middle" fontSize="14">Detection models</text>

                    <path d="M360 514 L360 530 L260 530 L260 546" fill="none" stroke="#333" strokeWidth="1" markerEnd="url(#arrowL)" />
                    <path d="M360 514 L360 530 L467 530 L467 546" fill="none" stroke="#333" strokeWidth="1" markerEnd="url(#arrowL)" />

                    <rect x="180" y="546" width="160" height="44" rx="6" fill="#eef2fb" stroke="#333" strokeWidth="1" />
                    <text x="260" y="572" textAnchor="middle" fontSize="14">Machine learning</text>

                    <rect x="370" y="546" width="195" height="44" rx="6" fill="#fbeeee" stroke="#333" strokeWidth="1" />
                    <text x="467" y="572" textAnchor="middle" fontSize="14">Deep learning (BERT)</text>

                    {/* Feedback loop back to inference engine */}
                    <path d="M440 492 C 545 492 545 272 465 272" fill="none" stroke="#333" strokeWidth="1" markerEnd="url(#arrowL)" />
                </svg>
            </div>

            <p className="docs-prose">
                Running fully client-side means the local version works offline after
                the initial page load and keeps all text on-device — useful for
                privacy-sensitive use cases. The trade-off is that it's bound by the
                user's hardware and by what ONNX Runtime Web can execute efficiently in
                WebAssembly, which may limit model size compared to the backend
                version.
            </p>
            </section>
            </section>

            {/* ───────────────── Local vs Backend ───────────────── */}
            <section className="docs-section" id="comparison">
            <div className="docs-eyebrow">Reference</div>

            <h1 className="docs-title">Local vs. Backend: which should I use?</h1>

            <p className="docs-lead">
                Both versions run the same detection pipeline — the difference is
                where inference happens. See the{' '}
                <a href="/models#dl">architecture pages</a> for how each is built.
            </p>

            <hr className="docs-divider" />

            <div className="docs-table-wrapper">
                <table className="docs-table">
                <thead>
                    <tr>
                    <th></th>
                    <th>Local</th>
                    <th>Backend</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td>Where inference runs</td>
                    <td>In-browser (ONNX Runtime Web / WASM)</td>
                    <td>Server (FastAPI + Python)</td>
                    </tr>
                    <tr>
                    <td>Data leaves your device?</td>
                    <td>No — text never leaves the browser</td>
                    <td>Yes — text is sent to the API for analysis</td>
                    </tr>
                    <tr>
                    <td>Works offline?</td>
                    <td>Yes, after the initial page load</td>
                    <td>No — requires a network connection</td>
                    </tr>
                    <tr>
                    <td>Speed</td>
                    <td>Depends on device hardware</td>
                    <td>Consistent, server-controlled</td>
                    </tr>
                    <tr>
                    <td>Model size / accuracy ceiling</td>
                    <td>Limited by what runs efficiently in WASM</td>
                    <td>Can run larger, more accurate models</td>
                    </tr>
                    <tr>
                    <td>Best for</td>
                    <td>Privacy-sensitive or offline use</td>
                    <td>Higher accuracy, heavier workloads</td>
                    </tr>
                </tbody>
                </table>
            </div>
            </section>

            {/* ───────────────── App Features ───────────────── */}

            <section className="docs-section" id="app-features">
            <div className="docs-eyebrow">Features</div>

            <h1 className="docs-title">App features</h1>

            <p className="docs-lead">
                Everything available in the interface.
            </p>

            <hr className="docs-divider" />

            <div className="docs-feature-grid">
                {appFeatures.map((f) => (
                <div className="docs-feature-card" key={f.name}>
                    <div className="docs-feature-icon">
                    <i className={`ti ${f.icon}`} />
                    </div>

                    <div className="docs-feature-name">
                    {f.name}
                    </div>

                    <div className="docs-feature-desc">
                    {f.desc}
                    </div>
                </div>
                ))}
            </div>
            </section>

            {/* ───────────────── FAQ ───────────────── */}
            <section className="docs-section" id="faq">
            <div className="docs-eyebrow">Reference</div>

            <h1 className="docs-title">FAQ</h1>

            <p className="docs-lead">
                Quick answers to common questions. For the technical detail behind
                any of these, see <a href="#limitations">Limitations</a>.
            </p>

            <hr className="docs-divider" />

            <h2 className="docs-h2">What file types are supported?</h2>
            <p className="docs-prose">
                .txt, .docx, and .pdf. Text is extracted automatically on upload.
            </p>

            <h2 className="docs-h2">Is my text stored anywhere?</h2>
            <p className="docs-prose">
                {/* TODO: confirm actual backend behavior before publishing */}
                In the local version, no — analysis happens entirely in your browser.
                In the backend version, submitted text is sent to the API for
                processing. See <a href="#comparison">Local vs. Backend</a> for the
                full comparison.
            </p>

            <h2 className="docs-h2">How accurate is it?</h2>
            <p className="docs-prose">
                Accuracy varies by text length, language, and how heavily AI-generated
                content has been edited — see <a href="#limitations">Limitations</a>{' '}
                for the details that affect this.
            </p>

            <h2 className="docs-h2">Is there a file size limit?</h2>
            <p className="docs-prose">
                {/* TODO: fill in your actual limit */}
                [add your file size / character limit here]
            </p>

            <h2 className="docs-h2">Can I use this offline?</h2>
            <p className="docs-prose">
                Yes, with the local version, once the page has loaded once. See{' '}
                <a href="#comparison">Local vs. Backend</a>.
            </p>
            </section>

            {/* ───────────────── Limitations ───────────────── 
            <section className="docs-section" id="limitations">
            <div className="docs-eyebrow">Reference</div>

            <h1 className="docs-title">Limitations & known issues</h1>

            <p className="docs-lead">
                AIDetx2 is a statistical classifier, not a certainty machine. It's worth
                understanding where it's less reliable before treating a result as
                definitive.
            </p>

            <hr className="docs-divider" />

            <h2 className="docs-h2">Text length</h2>
            <p className="docs-prose">
                Very short inputs give the sliding window little to work with — most
                features (lexical richness, sentence length variance, entropy) become
                noisy below a few hundred characters, so confidence on short snippets
                should be treated cautiously.
            </p>

            <h2 className="docs-h2">Heavily edited AI text</h2>
            <p className="docs-prose">
                Text that started as AI-generated but was substantially rewritten,
                paraphrased, or mixed with human edits can fall in between the two
                classes. The stylometric signals AIDetx2 relies on (repetition,
                burstiness, vocabulary distribution) are the first to blur under
                manual editing.
            </p>

            <h2 className="docs-h2">Language coverage</h2>
            <p className="docs-prose">
                The extracted features and models were built and tuned primarily on
                English text. Behavior on other languages is currently unverified and
                should not be assumed to match English-language performance.
            </p>

            <h2 className="docs-h2">Adversarial input</h2>
            <p className="docs-prose">
                Like any classifier, AIDetx2 can be targeted by inputs specifically
                crafted to evade detection (e.g. injecting irregular punctuation or
                unusual phrasing to shift feature values). It is not designed as a
                security control against a motivated adversary.
            </p>

            <h2 className="docs-h2">Model attribution</h2>
            <p className="docs-prose">
                Identifying *which* AI model generated a text is inherently harder than
                the binary human/AI decision, since newer or fine-tuned models can
                closely resemble the writing patterns of models already in the
                reference set.
            </p>
            </section> */}

            {/* ───────────────── GitHub ───────────────── */}

            <section className="docs-section" id="github">
            <div className="docs-eyebrow">Resources</div>

            <h1 className="docs-title">GitHub</h1>

            <p className="docs-lead">
                Source code, issues, and contributions.
            </p>

            <hr className="docs-divider" />

            <div className="docs-github-card">
                <div className="docs-github-left">
                <i className="ti ti-brand-github docs-github-icon" />

                <div>
                    <div className="docs-github-title">
                    your-org / appname
                    </div>

                    <div className="docs-github-sub">
                    Replace with your actual repository URL
                    </div>
                </div>
                </div>

                <a
                href="https://github.com"
                className="docs-github-btn"
                target="_blank"
                rel="noreferrer"
                >
                <i className="ti ti-external-link" />
                View repo
                </a>
            </div>
            </section>

            {/* ───────────────── Contributing ───────────────── */}

            <section className="docs-section" id="contributing">
            <div className="docs-eyebrow">Reference</div>

            <h1 className="docs-title">Contributing</h1>

            <p className="docs-lead">
                Contributions are welcome. Here's the process for submitting a change.
            </p>

            <hr className="docs-divider" />

            <ol className="docs-list">
                <li><strong>Fork</strong> the repository and clone it locally.</li>
                <li><strong>Create a branch</strong> for your change: <code>git checkout -b fix/short-description</code>.</li>
                <li><strong>Make your changes</strong>, keeping commits focused and descriptive.</li>
                <li><strong>Test locally</strong> before opening a PR (both the local and backend versions, if your change touches shared logic).</li>
                <li><strong>Open a pull request</strong> against <code>main</code>, describing what changed and why.</li>
            </ol>

            <p className="docs-prose">
                {/* TODO: add coding style / lint rules, issue template, or license note if applicable */}
            </p>
            </section>

        </main>
        </div>
    )
}