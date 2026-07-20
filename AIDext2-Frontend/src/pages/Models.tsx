import { useEffect, useState } from 'react'
import './Models.css'


interface NavItem {
  id: string
  label: string
  icon: string
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Models',
    items: [
        { id: 'overview', label: 'Available Models', icon: 'ti-ai' },
        { id: 'ml', label: 'Machine Learning Models', icon: 'ti-ai' },
        { id: 'dl', label: 'Deep Learning Models', icon: 'ti-ai' },
    ]
  },
  {
    label: 'Features',
    items: [
      { id: 'extracted_features', label: 'Extracted features', icon: 'ti-tag' },
    ],
  },
]


export default function Models(){
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

            <h1 className="docs-title">Models</h1>

            <p className="docs-lead">
                AIDetx2 offers different various depending in which the use case scenario is. 
                There are 3 models: AI vs Human which allows to detect if a text is of Human or AI origin; 
                Model Detection that given an AI text, it detects which model detected it; 
                Human vs AI and Model Detection is a pipeline combining both the previous models doing both
                things at once.
            </p>

            <hr className="docs-divider" />

            </section>

            {/* ───────────────── ML ───────────────── */}

            <section className="docs-section" id="ml">

            <h1 className="docs-title">Machine Learning Models</h1>

            <p className="docs-lead">
                write something
            </p>

            <hr className="docs-divider" />


            <p className="docs-prose">
                
            </p>

            </section>

            {/* ───────────────── Deep Learning Models ───────────────── */}

            <section className="docs-section" id="dl">

            <h1 className="docs-title">Deep Learning Models</h1>

            <p className="docs-lead">
                write something
            </p>

            <hr className="docs-divider" />

            <p className="docs-prose">
        
            </p>

            </section>


            <section className="docs-section" id="extracted_features">

            <h1 className="docs-title">Extracted features</h1>

            <p className="docs-lead">
                write something
            </p>

            <hr className="docs-divider" />

            <div className="docs-table-wrapper">
                <table className="docs-table">
                    <thead>
                    <tr>
                        <th>Feature</th>
                        <th>Definition</th>
                    </tr>
                    </thead>

                    <tbody>
                    <tr>
                        <td>Entropy Ratio</td>
                        <td>
                        Measures the relationship between the observed entropy of a text and its
                        maximum possible entropy. It helps evaluate how predictable or uniform
                        the text distribution is, which can reveal AI-generated writing patterns.
                        </td>
                    </tr>

                    <tr>
                        <td>Shannon Entropy</td>
                        <td>
                        Quantifies the amount of information and randomness present in the text
                        based on character or token probability distributions. Lower entropy can
                        indicate more repetitive or structured text generation.
                        </td>
                    </tr>

                    <tr>
                        <td>Average Word Length</td>
                        <td>
                        Computes the average number of characters per word within a text segment.
                        This feature helps capture stylistic differences between writing sources.
                        </td>
                    </tr>

                    <tr>
                        <td>Lexical Richness</td>
                        <td>
                        Measures vocabulary diversity by analyzing the proportion of unique words
                        relative to the total number of words. Human-written text generally
                        exhibits higher lexical variation.
                        </td>
                    </tr>

                    <tr>
                        <td>Average Sentence Length</td>
                        <td>
                        Represents the average number of words per sentence in a segment.
                        Variations in sentence length can reflect differences in writing style
                        and text complexity.
                        </td>
                    </tr>

                    <tr>
                        <td>Punctuation Density</td>
                        <td>
                        Calculates the frequency of punctuation marks relative to the total text
                        length. AI-generated text may present different punctuation usage
                        patterns compared to human writing.
                        </td>
                    </tr>

                    <tr>
                        <td>Repetition Rate</td>
                        <td>
                        Measures how frequently words or phrases are repeated within a text
                        segment. High repetition rates can indicate limited variation and are
                        often associated with generated content.
                        </td>
                    </tr>
                    </tbody>
                </table>
                </div>

            </section>
        </main>
        </div>

    )

}
