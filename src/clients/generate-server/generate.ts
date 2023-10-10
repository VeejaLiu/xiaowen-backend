export enum TATTOO_STYLE {
    BLACK_WORK = 0,
    DOT_WORK = 1,
    GEOMETRIC = 2,
    WATERCOLOR = 3,
    REALISM = 4,
    NEO_TRADITIONAL = 5,
    NEW_SCHOOL = 6,
    JAPANESE = 7,
    TRIBAL = 8,
    LETTERING = 9,
    TRASH_POLKA = 10,
}

/**
 * Get images path from generate server
 *
 * @param body
 * @returns images path of minio, `bucketName/objectName`
 */
export async function draw(body: { style: TATTOO_STYLE; prompt: string }) {
    const response = await fetch('http://127.0.0.1:10102/draw', {
        method: 'POST',
        // request a image
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: `${body.prompt}`,
            style: body.style,
        }),
    });
    return await response.json();
}