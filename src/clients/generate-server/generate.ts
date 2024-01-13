import { GenerateConfig, TATTOO_STYLE } from './type';
import { getGenerateConfig } from './generateConfig';
import { putObject } from '../minio/minio';
import { Logger } from '../../lib/logger';

const fetch = require('node-fetch');
const log = new Logger(__filename);

/**
 * Get images path from generate server
 *
 * @param body
 * @returns images path of minio, `bucketName/objectName`
 */
export async function draw({ style, prompt }: { style: TATTOO_STYLE; prompt: string }): Promise<{
    images: {
        original: string;
        thumbnail: string;
    }[];
    parameters?: any;
}> {
    // Get generate config
    const generateConfig: GenerateConfig = await getGenerateConfig({ style, prompt });

    // Send request to generate server
    const generateRes = await fetch('http://region-42.seetacloud.com:53733/sdapi/v1/txt2img', {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
            prompt: generateConfig.prompt,
            negative_prompt: generateConfig.negativePrompt,
            batch_size: 4,
            cfg_scale: 7,
            steps: 20,
            width: generateConfig.width,
            height: generateConfig.height,
        }),
    });
    // console.log(generateRes);
    if (generateRes.status !== 200) {
        log.error(`[draw] generate server error: ${generateRes.status}`);
        throw new Error(`generate server error: ${generateRes.status}`);
    }

    const generateResJson = await generateRes.json();
    // console.log(generateResJson);

    // Get images base64 from generate server
    const images = generateResJson.images;

    const imagePaths: { original: string; thumbnail: string }[] = [];
    for (let i = 0; i < images.length; i++) {
        const imageBase64: string = images[i];
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const objectName = `${new Date().toISOString()}_${i}.png`;
        // upload image to minio
        const minioPath = await putObject(objectName, imageBuffer);
        // TODO create image thumbnail
        if (minioPath === false) {
            continue;
        }
        imagePaths.push({ original: minioPath as string, thumbnail: minioPath as string });
    }
    const parameters = generateResJson.parameters;
    return {
        images: imagePaths,
        parameters,
    };
}
