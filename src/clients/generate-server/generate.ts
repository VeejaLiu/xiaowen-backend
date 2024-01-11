import { GenerateConfig, TATTOO_STYLE } from './type';
import { getGenerateConfig } from './generateConfig';

const fetch = require('node-fetch');

/**
 * Get images path from generate server
 *
 * @param body
 * @returns images path of minio, `bucketName/objectName`
 */
export async function draw({ style, prompt }: { style: TATTOO_STYLE; prompt: string }): Promise<{ images: string[] }> {
    // Get generate config
    const generateConfig: GenerateConfig = await getGenerateConfig({ style, prompt });

    // Send request to generate server

    // Get images base64 from generate server
    const images = [];

    // generate thumbnail

    // upload original image and thumbnail to minio

    // return images path of minio
    return { images };
}
