import { LambdaClient } from "@aws-sdk/client-lambda"
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import {
  CloudWatchClient,
  PutMetricDataCommand,
  StandardUnit,
} from "@aws-sdk/client-cloudwatch"
import { Readable } from "stream"

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
}

export const lambdaClient = new LambdaClient({
  region: "us-east-1",
  credentials,
})

export const s3 = new S3Client({
  region: "us-east-1",
  credentials,
})

export async function getDocxFileAsString(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: "polydoc-bucket",
    Key: fileKey,
  })

  const response = await s3.send(command)

  if (!response.Body) throw new Error("S3 response has no Body")

  const stream = response.Body as Readable
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }

  const fileBuffer = Buffer.concat(chunks)

  // Convert binary buffer to Base64 string
  const base64String = fileBuffer.toString("base64")
  return base64String
}

// Upload a base64-encoded DOCX string to S3
export async function putDocxFile(
  fileKey: string,
  base64: string,
): Promise<void> {
  const buffer = Buffer.from(base64, "base64")

  const command = new PutObjectCommand({
    Bucket: "polydoc-bucket",
    Key: fileKey,
    Body: buffer,
    ContentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ContentLength: buffer.length,
  })

  await s3.send(command)
}

const cloudwatchClient = new CloudWatchClient({
  region: "us-east-1",
  credentials,
})
export async function putCustomMetric(
  metricName: string,
  value: number,
  options?: {
    namespace?: string
    unit?: StandardUnit
    dimensions?: { Name: string; Value: string }[]
  },
): Promise<void> {
  const namespace = options?.namespace ?? "FYP/Translations"
  const metricData = [
    {
      MetricName: metricName,
      Value: value,
      Unit: options?.unit ?? StandardUnit.Count,
      Dimensions: options?.dimensions,
    },
  ]

  try {
    const cmd = new PutMetricDataCommand({
      Namespace: namespace,
      MetricData: metricData,
    })
    await cloudwatchClient.send(cmd)
  } catch (err) {
    console.error("putCustomMetric error:", err)
  }
}
