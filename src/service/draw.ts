export async function draw(prompt: string) {
    // TODO Call the stable diffusion server to generate the image

    return {
        // fileName: `Cat.jpg`,
        fileName: `${prompt}.jpg`,
        usedTime: 3450,
    };
}
