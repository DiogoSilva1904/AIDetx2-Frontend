import refs from "./references.json";

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

export const HUMAN_BYTES =
    base64ToUint8Array(refs.human_bytes).slice(0, 65536);

export const AI_BYTES =
    base64ToUint8Array(refs.ai_bytes).slice(0, 65536);