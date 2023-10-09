import Minio from 'minio';
import { env } from '../../env';

// Instantiate the minio client with the endpoint and access keys as shown below.
const minioClient = new Minio.Client({
    endPoint: env.minio.endPoint || '127.0.0.1',
    port: env.minio.port || 9000,
    useSSL: env.minio.useSSL || true,
    // accessKey: 'fwxPczjUDixUPv7AdzmB',
    // secretKey: '',
    accessKey: env.minio.accessKey,
    secretKey: env.minio.secretKey,
});

const BUCKET_NAME = env.minio.bucketName || 'pictures';

export async function putObject(objectName: string, buffer: Buffer) {
    // putObject(bucketName, objectName, stream, size, metaData[, callback])
    // Uploads an object from a stream/Buffer.
    await minioClient.putObject(BUCKET_NAME, objectName, buffer);
}
