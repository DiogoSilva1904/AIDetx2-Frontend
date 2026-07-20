import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Required for pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "/AIDext2-Frontend/pdf.worker.min.mjs";

interface TextItem {
    x: number;
    y: number;
    text: string;
}

const START_HEADERS = [
    /^abstract\b[:.]?/i,
    /^summary\b[:.]?/i,
    /^executive summary\b[:.]?/i,
    /^introduction\b[:.]?/i,
    /^1\.?\s*introduction\b/i,
];

const END_HEADERS = [
    /^references?$/i,
    /^bibliography$/i,
    /^works cited$/i,
    /^appendix$/i,
    /^acknowledg(e)?ments?$/i,
];

/* function buildColumn(items: TextItem[]): string {

    const tolerance = 3;

    const lines: {
        y: number;
        words: TextItem[];
    }[] = [];

    for (const item of items) {

        let line = lines.find(
            l => Math.abs(l.y - item.y) <= tolerance
        );

        if (!line) {

            line = {
                y: item.y,
                words: [],
            };

            lines.push(line);
        }

        line.words.push(item);
    }

    // Top → Bottom
    lines.sort((a, b) => b.y - a.y);

    return lines
        .map(line => {

            // Left → Right
            line.words.sort((a, b) => a.x - b.x);

            return line.words
                .map(w => w.text)
                .join(" ");

        })
        .join("\n");
} */

function removeHeaders(pages: string[]): string[] {
    const counter = new Map<string, number>();

    for (const page of pages.slice(1)) {
        const lines = page.split("\n").map(l => l.trim()).filter(Boolean);

        for (const line of lines.slice(0, 3)) {
            if (line.split(/\s+/).length <= 15) {
                counter.set(line, (counter.get(line) ?? 0) + 1);
            }
        }
    }

    const repeated = new Set(
        [...counter.entries()]
            .filter(([, count]) => count >= 2)
            .map(([line]) => line)
    );

    return pages.map((page, index) => {
        if (index === 0) return page;

        const lines = page.split("\n");

        while (lines.length && repeated.has(lines[0].trim())) {
            lines.shift();
        }

        return lines.join("\n");
    });
}

function removeFooters(pages: string[]): string[] {
    const counter = new Map<string, number>();

    for (const page of pages.slice(1)) {
        const lines = page.split("\n").map(l => l.trim()).filter(Boolean);

        for (const line of lines.slice(-3)) {
            if (line.split(/\s+/).length <= 15) {
                counter.set(line, (counter.get(line) ?? 0) + 1);
            }
        }
    }

    const repeated = new Set(
        [...counter.entries()]
            .filter(([, count]) => count >= 2)
            .map(([line]) => line)
    );

    return pages.map(page => {
        const lines = page.split("\n");

        while (
            lines.length &&
            repeated.has(lines[lines.length - 1].trim())
        ) {
            lines.pop();
        }

        return lines.join("\n");
    });
}


function removePageNumbers(pages: string[]): string[] {
    const patterns = [
        /^\d+$/,
        /^page\s+\d+$/i,
        /^\d+\s*\/\s*\d+$/,
        /^\d+\s+of\s+\d+$/i,
    ];

    return pages.map(page => {
        return page
            .split("\n")
            .filter(line => {
                const trimmed = line.trim();

                return !patterns.some(p => p.test(trimmed));
            })
            .join("\n");
    });
}



function cleanExtractedText(text: string): string {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    console.log("Cleaning text...")

    // ── Remove title block (first few short lines before main content) ──
    let startIdx = 0;
    /* for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i];
        const wordCount = line.split(/\s+/).length;
        // Skip short lines (title, authors, institution, date, abstract header)
        if (wordCount <= 6 || /^(abstract|keywords?|doi|arxiv|university|department|email|@)/i.test(line)) {
            startIdx = i;
        } else {
            break; // first "real" paragraph found
        }
    } */
    for (let i = 0; i < lines.length; i++) {
        if (START_HEADERS.some(r => r.test(lines[i]))) {
            startIdx = i + 1;
            break;
        }
    }

    // Fallback if no section header exists
    if (startIdx === 0) {
        while (
            startIdx < Math.min(15, lines.length)
        ) {
            const line = lines[startIdx];
            const words = line.split(/\s+/).length;

            if (
                words <= 8 ||
                /doi|orcid|university|department|faculty|@|email/i.test(line)
            ) {
                startIdx++;
            } else {
                break;
            }
        }
    }

    // ── Remove references section at the end ──
    /* let endIdx = lines.length;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (/^(references?|bibliography|works cited|citations?)\s*$/i.test(line)) {
            endIdx = i;
            break;
        }
        // Also detect numbered reference patterns like [1] Author...
        if (i < lines.length - 5 && /^\[\d+\]/.test(line)) {
            // Check if many surrounding lines also look like references
            const refCount = lines.slice(Math.max(0, i - 5), i + 5)
                .filter(l => /^\[\d+\]/.test(l)).length;
            if (refCount >= 3) {
                endIdx = i;
                break;
            }
        }
    } */
   let endIdx = lines.length;

    for (let i = startIdx; i < lines.length; i++) {

        if (END_HEADERS.some(r => r.test(lines[i]))) {
            endIdx = i;
            break;
        }

    }

    let cleaned = lines.slice(startIdx, endIdx).join("\n");

    // Fix hyphenated words
    cleaned = cleaned.replace(/(\w)-\n(\w)/g, "$1$2");

    // Merge wrapped lines (keep paragraph breaks)
    cleaned = cleaned.replace(/(?<!\n)\n(?!\n)/g, " ");

    // Remove duplicate spaces
    cleaned = cleaned.replace(/[ \t]+/g, " ");

    return cleaned.trim();

    //return lines.slice(startIdx, endIdx).join("\n");
}

export async function extractTextFromFile(file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "txt") {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) ?? "");
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    if (ext === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return cleanExtractedText(result.value); 
        //return result.value;
    }
    if (ext === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1 });
            const midX = viewport.width / 2;
            const content = await page.getTextContent();

            // Separate items into left and right columns
            /* const leftItems:  { y: number; text: string }[] = [];
            const rightItems: { y: number; text: string }[] = [];

            for (const item of content.items as any[]) {
                const x = item.transform[4];
                const y = Math.round(item.transform[5]);
                const target = x < midX ? leftItems : rightItems;
                target.push({ y, text: item.str });
            } */
            const leftItems: TextItem[] = [];
            const rightItems: TextItem[] = [];

            for (const item of content.items as any[]) {

                const x = item.transform[4];
                const y = item.transform[5];   // <-- don't round anymore

                const target = x < midX ? leftItems : rightItems;

                target.push({
                    x,
                    y,
                    text: item.str,
                });
            }

            // Group each column by Y, sort top-to-bottom
            const buildColumn = (items: { y: number; text: string }[]) => {
                const lineMap = new Map<number, string[]>();
                for (const { y, text } of items) {
                    if (!lineMap.has(y)) lineMap.set(y, []);
                    lineMap.get(y)!.push(text);
                }
                return [...lineMap.entries()]
                    .sort((a, b) => b[0] - a[0])
                    .map(([, words]) => words.join(" ").trim())
                    .filter(Boolean)
                    .join("\n");
            };

            const leftText  = buildColumn(leftItems);
            const rightText = buildColumn(rightItems);

            // Only use right column if it has substantial content
            const pageText = rightText.trim().length > 50
                ? leftText + "\n" + rightText
                : leftText;

            pages.push(pageText);
        }

        //const raw = pages.join("\n");
        //return cleanExtractedText(raw);
        const cleanedPages = removePageNumbers(
            removeFooters(
                removeHeaders(pages)
            )
        );

        const raw = cleanedPages.join("\n");

        return cleanExtractedText(raw);
    }

    /* if (ext === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
                .map((item: any) => item.str)
                .join(" ");
            pages.push(pageText);
        }
        const raw = pages.join("\n");
        return cleanExtractedText(raw);
        //return pages.join("\n");
    } */

    throw new Error(`Unsupported file type: .${ext}`);
}