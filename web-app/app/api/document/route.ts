import {
  getDocxFileAsString,
  putCustomMetric,
  putDocxFile,
} from "../../../lib/aws-clients"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const fileKey = url.searchParams.get("fileKey")

    console.log(fileKey)

    if (!fileKey) {
      return new Response("Missing fileKey", { status: 400 })
    }

    const base64 = await getDocxFileAsString(fileKey)
    const data = Buffer.from(base64, "base64")
    const filename = fileKey.split("/").pop() || "document.docx"

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(data.byteLength),
      },
    })
  } catch (err) {
    return new Response("File not found", { status: 404 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { fileKey, file } = body

    if (!fileKey || !file) {
      return new Response("Missing fileKey or file", { status: 400 })
    }

    await putDocxFile(fileKey, file)
    await putCustomMetric("UserEdits", 1, {
      dimensions: [
        {
          Name: "Environment",
          Value: "dev",
        },
      ],
    })

    return new Response("OK", { status: 200 })
  } catch (err) {
    console.error("POST /document error", err)
    return new Response("Failed to upload", { status: 500 })
  }
}
