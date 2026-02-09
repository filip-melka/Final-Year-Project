import { supportedLanguages } from "@/lib/languages"
import { NextRequest, NextResponse } from "next/server"
import { InvokeCommand } from "@aws-sdk/client-lambda"
import { lambdaClient } from "@/lib/aws-clients"

export type TranslateResponse = {
  statusCode: number
  total_segments: number
  reused_segments: number
  cost_savings: number
  key: string
  error?: string
}

type TranslateLambdaPayload = {
  filename: string
  file: string
  language: string
  languageCode: string
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const languageCode = formData.get("languageCode") as string | null
  const filename = formData.get("filename") as string | null

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 })
  }

  if (!filename || typeof filename !== "string") {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
  }

  const maxSize = 8 * 1024 * 1024 // 8MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File is too large. Must be under 8MB." },
      { status: 413 },
    )
  }

  if (!languageCode || typeof languageCode !== "string") {
    return NextResponse.json(
      { error: "Invalid language code" },
      { status: 400 },
    )
  }

  const language = supportedLanguages.get(languageCode)

  if (language === undefined) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const payload: TranslateLambdaPayload = {
    filename,
    file: buffer.toString("base64"),
    language,
    languageCode,
  }

  try {
    const command = new InvokeCommand({
      FunctionName: process.env.TRANSLATE_LAMBDA_FUNCTION,
      Payload: JSON.stringify(payload),
    })
    const lambdaRes = await lambdaClient.send(command)
    const res: TranslateResponse = JSON.parse(
      new TextDecoder().decode(lambdaRes.Payload),
    )

    if (res.error) {
      console.log(res.error)
      throw new Error(res.error)
    }

    return NextResponse.json(res)
  } catch (error) {
    console.log("e:", error)
    return NextResponse.json({ error: "Translation failed" }, { status: 500 })
  }
}
