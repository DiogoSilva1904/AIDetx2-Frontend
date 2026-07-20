//const { LZMA } = require('lzma');

function compressedSize(data: Uint8Array): number {
    const pop = data
    console.log(pop)
    return 0
}

export function ncd(
    text: string,
    reference: Uint8Array
): number {

    const encoder = new TextEncoder();

    const textBytes = encoder.encode(text);

    const combined = new Uint8Array(
        reference.length + textBytes.length
    );

    combined.set(reference);
    combined.set(textBytes, reference.length);

    const cCombined =
        compressedSize(combined);

    const cRef =
        compressedSize(reference);

    const cText =
        compressedSize(textBytes);

    return (
        cCombined -
        Math.min(cRef, cText)
    ) /
    Math.max(cRef, cText);
}


export function ncsd(
    text: string,
    reference: Uint8Array
): number {

    const encoder = new TextEncoder();

    const textBytes =
        encoder.encode(text);

    const combined =
        new Uint8Array(
            textBytes.length +
            reference.length
        );

    combined.set(textBytes);
    combined.set(reference, textBytes.length);

    const cAB =
        compressedSize(combined);

    const cA =
        compressedSize(textBytes);

    const cB =
        compressedSize(reference);

    return (cAB - cA) / cB;
}
