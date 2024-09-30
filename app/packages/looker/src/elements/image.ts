/**
 * Copyright 2017-2024, Voxel51, Inc.
 */



import { ImageState } from "../state";
import { BaseElement, Events } from "./base";
import { S3Client,GetObjectCommand } from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
const s3Client = new S3Client({
  region: "us-east-1", // Replace with your S3 bucket region
  credentials: {
    accessKeyId: "minio_access_key", // Replace with your AWS access key
    secretAccessKey: "minio_secret_key", // Replace with your AWS secret key
  },
  endpoint: "http://localhost:9000", // Replace with your MinIO or S3 endpoint if necessary
  forcePathStyle: true, // Required for MinIO
});

function extractS3Details(s3Uri) {
  const uriWithoutPrefix = s3Uri.replace("s3://", "");
  const [bucketName, ...keyParts] = uriWithoutPrefix.split("/");
  const objectKey = keyParts.join("/");
  return { bucketName, objectKey };
}

async function getPresignedUrl(bucketName: string, objectKey: string): Promise<string | undefined> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    // Generate a presigned URL that expires in 1 hour
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return presignedUrl;
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return undefined;
  }
}




export class ImageElement extends BaseElement<ImageState, HTMLImageElement> {
  private src: string = "";
  private imageSource: HTMLImageElement;
  
  getEvents(): Events<ImageState> {
    return {
      load: ({ update }) => {
        this.imageSource = this.element;

        update({
          loaded: true,
          dimensions: [this.element.naturalWidth, this.element.naturalHeight],
        });
      },
      error: ({ update }) => {
        update({ error: true, dimensions: [512, 512], loaded: true });
      },
    };
  }

  createHTMLElement() {
    const element = new Image();
    element.crossOrigin = "Anonymous";
    element.loading = "eager";
    return element;
  }

  renderSelf({ config: { src } }: Readonly<ImageState>): HTMLImageElement | null {
    if (this.src !== src) {
      if (src.startsWith("s3://")) {
        const { bucketName, objectKey } = extractS3Details(src);

        getPresignedUrl(bucketName, objectKey).then((presignedUrl) => {
          if (presignedUrl) {
            this.src = src;
            this.element.setAttribute("src", presignedUrl);
          }})
      } else {
        this.src = src;
        this.element.setAttribute("src", src);
      }
    }

    return null;
  }
}