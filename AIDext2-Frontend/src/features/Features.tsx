import nlp from "compromise";
// @ts-ignore
import rs from 'text-readability';
import { init, compress } from '@bokuweb/zstd-wasm';
import freqMap from './word_frequencies.json'; 
//await init();



declare const LZMA: {
  compress(data: string | number[] | Uint8Array, mode: number): number[];
  decompress(data: number[]): string | Uint8Array;
};

/* function fnv1a(data: Uint8Array) {
    let h = 0x811c9dc5;

    for (let i = 0; i < data.length; i++) {
        h ^= data[i];
        h = Math.imul(h, 0x01000193);
    }

    return (h >>> 0).toString(16);
} */

/* function fingerprint(data: Uint8Array) {
        let sum = 0;
        let xor = 0;

        for (let i = 0; i < data.length; i++) {
            sum = (sum + data[i]) >>> 0;
            xor ^= data[i];
        }

        return {
            length: data.length,
            sum,
            xor,
            first16: Array.from(data.slice(0, 16)),
            last16: Array.from(data.slice(-16))
        };
    } */

//const zlib = require('node:zlib');

const FREQ_MAP = freqMap as Record<string, number>;

export class Features {

    public static initialized = false;
    private static initPromise: Promise<void> | null = null;
    //private refCache = new Map<string, number>();

    /* private getCompressedReference(ref: Uint8Array): number {
        const key = fnv1a(ref);

        console.log("Cache key:", key);

        if (!this.refCache.has(key)) {
            const size = compress(ref, 3).length;
            console.log("Cache MISS ->", size);
            this.refCache.set(key, size);
        } else {
            console.log("Cache HIT ->", this.refCache.get(key));
        }

        return this.refCache.get(key)!;
    }
 */

    static async init(): Promise<void> {
        if (Features.initialized) return;
        if (Features.initPromise) return Features.initPromise;

        Features.initPromise = (async () => {
            await init();
            Features.initialized = true;
        })();

        return Features.initPromise;
    }

    static FUNCTION_WORDS = new Set([
        "the","a","an","in","on","at","to","for","of","and","or","but",
        "is","are","was","were","be","been","it","this","that","these",
        "those","i","you","he","she","we","they"
    ]);


    /*private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);
    }*/
    
    uncommonWordRatio(words: string[], threshold = 1e-6): number {
        if (!words.length) return 0;
        const rare = words.filter(w => (FREQ_MAP[w.toLowerCase()] ?? 0) < threshold);
        return rare.length / words.length;
    }

    countSyllables(word: string): number {

        word = word
            .toLowerCase()
            .replace(/[^a-z]/g, "");


        if (!word)
            return 0;


        if (word.length <= 3)
            return 1;


        const vowels =
            word.match(/[aeiouy]+/g);


        let count =
            vowels ? vowels.length : 1;


        // textstat-style silent e handling
        if (
            word.endsWith("e") &&
            !word.endsWith("le") &&
            count > 1
        ) {
            count--;
        }


        // endings that are usually silent
        if (
            word.endsWith("es") &&
            !word.endsWith("ses") &&
            count > 1
        ) {
            count--;
        }


        if (
            word.endsWith("ed") &&
            count > 1
        ) {
            count--;
        }


        return Math.max(count, 1);
    }


    readability(text: string) {

        const sentences =
            text
                .split(/[.!?]+/)
                .map(s => s.trim())
                .filter(Boolean);


        const words =
            text.match(/[a-zA-Z]+/g) ?? [];


        const syllables =
            words.reduce(
                (sum, word) =>
                    sum + this.countSyllables(word),
                0
            );


        const complexWords =
            words.filter(
                word =>
                    this.countSyllables(word) >= 3
            ).length;


        const sentenceCount =
            Math.max(sentences.length, 1);


        const wordCount =
            Math.max(words.length, 1);


        const avgSentenceLength =
            wordCount / sentenceCount;


        const avgSyllablesPerWord =
            syllables / wordCount;


        return {

            // same formula as textstat
            flesch_reading_ease:
                206.835
                - (1.015 * avgSentenceLength)
                - (84.6 * avgSyllablesPerWord),


            gunning_fog:
                0.4 *
                (
                    avgSentenceLength
                    +
                    100 *
                    (complexWords / wordCount)
                ),


            smog_index:
                1.043 *
                Math.sqrt(
                    complexWords *
                    (30 / sentenceCount)
                )
                + 3.1291
        };
    }

    sentenceLengthVariance(text: string): number {
        const sentences = text.split('.')
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => s.split(/\s+/).filter(Boolean).length);

        if (sentences.length < 2) return 0;
        const mean = sentences.reduce((a, b) => a + b, 0) / sentences.length;
        return sentences.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / sentences.length;
    }

    bigramRepetitionRate(words:string[]):number {
        //console.log("WORDS",words)

        if(words.length < 2)
            return 0;


        const counts =
            new Map<string,number>();


        for(let i=0;i<words.length-1;i++){

            const bg =
                words[i] + " " + words[i+1];

            counts.set(
                bg,
                (counts.get(bg)||0)+1
            );
        }


        let repeated = 0;

        counts.forEach(v=>{
            if(v > 1)
                repeated += v;
        });


        return repeated/(words.length-1);
    }

    posDistribution(text: string,words: string[]) {
        const doc = nlp(text);
        const total = words.length || 1; 

        const nouns    = doc.nouns();
        //const verbs    = doc.verbs();

        return {
            pos_NN:  nouns.not('#Plural').not('#ProperNoun').length / total,
            pos_NNS: nouns.match('#Plural').length / total,
            pos_NNP: nouns.match('#ProperNoun').length / total,
            pos_VB: doc.verbs().match('#Infinitive').length / total,
            pos_VBD: doc.verbs().match('#PastTense').not('#Gerund').length / total,
            pos_VBG: doc.verbs().match('#Gerund').length / total,
            pos_VBN: doc.verbs().match('#PastTense #Passive').length / total,
            pos_VBP: doc.verbs().match('#PresentTense').not('#ThirdPerson').length / total,
            pos_VBZ: doc.verbs().match('#PresentTense').filter((t: any) => t.text().match(/\w+s$/i) && !t.has('#Gerund')).length / total,
            pos_JJ:  doc.adjectives().length / total,
            pos_RB:  doc.adverbs().length / total,
            pos_PRP: doc.pronouns().length / total,
            pos_DT:  doc.match('#Determiner').length / total,
            pos_IN:  doc.match('#Preposition').length / total,
        };
    }

    burstiness(words:string[]):number {

        const positions =
            new Map<string,number[]>();


        words.forEach((w,i)=>{

            if(!positions.has(w))
                positions.set(w,[]);

            positions.get(w)!.push(i);

        });


        const gaps:number[]=[];


        positions.forEach(pos=>{

            if(pos.length<2)
                return;


            for(let i=0;i<pos.length-1;i++)
                gaps.push(pos[i+1]-pos[i]);

        });


        if(!gaps.length)
            return 0;


        const mean =
            gaps.reduce((a,b)=>a+b,0)
            / gaps.length;


        const variance =
            gaps
            .map(x=>Math.pow(x-mean,2))
            .reduce((a,b)=>a+b,0)
            / gaps.length;


        const std =
            Math.sqrt(variance);


        return (std-mean)/(std+mean);
    }

    compressionRatio(text: string): number {
        if (!Features.initialized) throw new Error("ZSTD not initialized");
        const bytes = new TextEncoder().encode(text);
        /*console.log({
            textLength: text.length,
            bytesLength: bytes.length,
            first32: Array.from(bytes.slice(0, 32)),
            last32: Array.from(bytes.slice(-32))
        });*/

        const compressed = compress(bytes, 3);

        /*console.log({
            compressedLength: compressed.length
        });*/

        return compressed.length / bytes.length;
    }

    perplexity(text: string): number {
        const ratio = this.compressionRatio(text);
        return Math.pow(2, ratio * 8);
    }

    shannonEntropy(text: string): number {
        const counts: Record<string, number> = {};

        for (const c of text) {
            counts[c] = (counts[c] || 0) + 1;
        }

        const total = text.length;

        let entropy = 0;

        for (const count of Object.values(counts)) {
            const p = count / total;
            entropy -= p * Math.log2(p);
        }

        return entropy;
    }

    entropyRatio(text: string): number {
        const shannon = this.shannonEntropy(text);

        if (shannon === 0) return 0;

        return (this.compressionRatio(text) * 8) / shannon;
    }

    lexicalRichness(words: string[]): number {
        if (!words.length) return 0;
        return new Set(words).size / words.length;
    }

    lexicalDensity(words: string[]): number {
        if (!words.length) return 0;

        const content =
            words.filter(
                w => !Features.FUNCTION_WORDS.has(w)
            ).length;

        return content / words.length;
    }

    hapaxRatio(words: string[]): number {
        const counts = new Map<string, number>();

        words.forEach(w => {
            counts.set(w, (counts.get(w) || 0) + 1);
        });

        const hapax =
            [...counts.values()]
                .filter(v => v === 1)
                .length;

        return hapax / words.length;
    }

    repetitionRate(words: string[]): number {
        const counts = new Map<string, number>();

        words.forEach(w => {
            counts.set(w, (counts.get(w) || 0) + 1);
        });

        let repeated = 0;

        counts.forEach(v => {
            if (v > 1) repeated += v;
        });

        return repeated / words.length;
    }

    vocabularyRichnessPer100(words: string[]): number {
        return new Set(words.slice(0, 100)).size;
    }

    averageSentenceLength(text: string): number {
        const sentences = text.split('. ').filter(Boolean);
        const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
        if (!lengths.length) return 0;
        return lengths.reduce((a, b) => a + b, 0) / lengths.length;
    }

    punctuationDensity(text: string): number {
        if (!text.length) return 0;

        const matches =
            text.match(/[!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~]/g);

        return (matches?.length || 0)
            / text.length;
    }


    compressedSize(data: Uint8Array): number {
        if (!Features.initialized) throw new Error("ZSTD not initialized");
        return compress(data, 3).length;
    }

    compressedSizeLZMA(data: Uint8Array): number {
        return (LZMA.compress(data, 6) as number[]).length;
    }
    

    ncd(text: string, reference: Uint8Array): number {
        const textBytes = new TextEncoder().encode(text);
        const ref = reference;

        const cRef = this.compressedSize(ref);
        const cText = this.compressedSize(textBytes);
        
        /*console.log({
            refHash: fnv1a(ref),
            refFingerprint: fingerprint(ref),
        });*/

        const combined = new Uint8Array(ref.length + textBytes.length);
        combined.set(ref);
        combined.set(textBytes, ref.length);

        const cCombined = this.compressedSize(combined);

        /*console.log({
            combinedHash: fnv1a(combined),
            combinedFingerprint: fingerprint(combined),
        });*/

        const result =
            (cCombined - Math.min(cRef, cText)) /
            Math.max(cRef, cText);

       /*console.log("NCD");
        console.log({
            ref: fnv1a(reference),
            cRef,
            cText,
            cCombined,
            result
        });*/

        /*console.table({
            textLength: text.length,
            textBytes: textBytes.length,
            refLength: ref.length,
            cRef,
            cText,
            cCombined,
            result
        });*/

        return result;
    }


    ncsd(
        text: string,
        reference: Uint8Array
    ): number {

        const encoder = new TextEncoder();

        const textBytes =
            encoder.encode(text);

        //console.log(reference.length);
        //console.log(reference.slice(0, 32));
        

        const ref = reference;

        

        const combined = new Uint8Array(textBytes.length + ref.length);
        combined.set(textBytes);
        combined.set(ref, textBytes.length);

        const cAB =
            this.compressedSize(combined);

        const cA =
            this.compressedSize(textBytes);

        const cB = this.compressedSize(ref);

        /*console.log("NCSD");
        console.log({
            ref: fnv1a(reference),
            cB,
            cA,
            cAB,
            result: (cAB - cA) / cB
        });*/

        return (cAB - cA) / cB;
    }

}