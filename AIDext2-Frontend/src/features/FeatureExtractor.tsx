import { Features } from "./Features";

function fnv1a(data: Uint8Array) {
    let h = 0x811c9dc5;

    for (let i = 0; i < data.length; i++) {
        h ^= data[i];
        h = Math.imul(h, 0x01000193);
    }

    return (h >>> 0).toString(16);
}

export class FeatureExtractor {

    private feat = new Features();
    private referenceModels: Record<string, Uint8Array>;

    constructor(
        referenceModels: Record<string, Uint8Array> = {}
    ) {
        this.feat = new Features();
        this.referenceModels = referenceModels;
    }

    extract(text: string): Record<string, number> {

        //console.log("Text",text)
        const words = text
            .toLowerCase()
            .replace(/['']/g, "'")
            .match(
                /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?|[^\s\p{L}\p{N}]/gu
            ) ?? [];
        // In FeatureExtractor.extract(), right after building words:
        //console.log("token count", words.length);
        console.log("tokens", words);

        const features: Record<string, number> = {};

        features["compression_ratio_1"] =
            this.feat.compressionRatio(text);

        features["perplexity_1"] =
            this.feat.perplexity(text);

        console.log("Human:", fnv1a(this.referenceModels["human_bytes"]));
        console.log("AI:", fnv1a(this.referenceModels["ai_bytes"]));

        let diff = 0;

        for (let i = 0; i < this.referenceModels["human_bytes"].length; i++) {
            if (this.referenceModels["human_bytes"][i] !== this.referenceModels["ai_bytes"][i]) {
                diff++;
            }
        }

        console.log("Different bytes:", diff);
        
         // NCD
        /* if (this.referenceModels["human_bytes"]) {
            features["ncd_human"] =
                this.feat.ncd(
                    text,
                    this.referenceModels["human_bytes"]
                );
        }

        if (this.referenceModels["ai_bytes"]) {
            features["ncd_ai"] =
                this.feat.ncd(
                    text,
                    this.referenceModels["ai_bytes"]
                );
        } */

        const ncdHuman = this.feat.ncd(
            text,
            this.referenceModels["human_bytes"]
        );

        const ncdAI = this.feat.ncd(
            text,
            this.referenceModels["ai_bytes"]
        );

        console.log("NCD HUMAN", ncdHuman);
        console.log("NCD AI", ncdAI);

        features["ncd_human"] = ncdHuman;
        features["ncd_ai"] = ncdAI;
        features["ncd_diff"] = ncdHuman - ncdAI;

        /* if (
            features["ncd_human"] !== undefined &&
            features["ncd_ai"] !== undefined
        ) {
            features["ncd_diff"] =
                features["ncd_human"] - features["ncd_ai"];
        } */

        console.log(
            this.referenceModels["human_bytes"].buffer.constructor.name
        );
        // NCSD
        if (this.referenceModels["human_bytes"]) {
            features["ncsd_human"] =
                this.feat.ncsd(
                    text,
                    this.referenceModels["human_bytes"]
                );
        }

        if (this.referenceModels["ai_bytes"]) {
            features["ncsd_ai"] =
                this.feat.ncsd(
                    text,
                    this.referenceModels["ai_bytes"]
                );
        }

        if (
            features["ncsd_human"] !== undefined &&
            features["ncsd_ai"] !== undefined
        ) {
            features["ncsd_diff"] =
                features["ncsd_human"] - features["ncsd_ai"];
        }


        features["shannon_entropy"] =
            this.feat.shannonEntropy(text);

        features["entropy_ratio_1"] =
            this.feat.entropyRatio(text);

        features["lexical_richness"] =
            this.feat.lexicalRichness(words);

        features["lexical_density"] =
            this.feat.lexicalDensity(words);

        features["hapax_ratio"] =
            this.feat.hapaxRatio(words);

        features["repetition_rate"] =
            this.feat.repetitionRate(words);

        features["vocabulary_richness_per100"] =
            this.feat.vocabularyRichnessPer100(words);

        features["avg_sentence_length"] =
            this.feat.averageSentenceLength(text);

        features["punctuation_density"] =
            this.feat.punctuationDensity(text);

        features["sentence_length_variance"] =
            this.feat.sentenceLengthVariance(text);


        features["bigram_repetition_rate"] =
            this.feat.bigramRepetitionRate(words);


        features["burstiness"] =
            this.feat.burstiness(words);


        features["uncommon_word_ratio"] =
            this.feat.uncommonWordRatio(words);



        //Object.assign(features, this.feat.posDistribution(text, words));


        Object.assign(
            features,
            this.feat.readability(text)
        );

        console.log(Object.keys(features).length);
        console.log(Object.keys(features));

        return features;
    }
}