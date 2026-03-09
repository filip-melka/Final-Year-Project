import {
  getDocxFileAsString,
  putCustomMetric,
  putDocxFile,
} from "../../../lib/aws-clients"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const fileKey = url.searchParams.get("fileKey")
    const type = (url.searchParams.get("type") || "docx").toLowerCase()

    if (!fileKey) {
      return new Response("Missing fileKey", { status: 400 })
    }
    const base64 = await getDocxFileAsString(fileKey)
    const data = Buffer.from(base64, "base64")
    const originalFilename = (fileKey.split("/").pop() || "document.docx").replace(/["\r\n]/g, "")

    if (type === "pdf") {
      const SUPERDOC_API_KEY = process.env.SUPERDOC_API_KEY
      if (!SUPERDOC_API_KEY) {
        return new Response("Missing SUPERDOC_API_KEY", { status: 500 })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const form: any = new FormData()
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
      form.append("file", blob, originalFilename)

      const resp = await fetch(
        "https://api.superdoc.dev/v1/convert?from=docx&to=pdf",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPERDOC_API_KEY}`,
          },
          body: form,
        },
      )

      if (!resp.ok) {
        const text = await resp.text().catch(() => "")
        console.error("Superdoc conversion failed", resp.status, text)
        return new Response("Conversion failed", { status: 502 })
      }

      const pdfArrayBuffer = await resp.arrayBuffer()
      const pdfBuffer = Buffer.from(pdfArrayBuffer)
      const pdfFilename = originalFilename.replace(/\.docx$/i, "") + ".pdf"

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${pdfFilename}"`,
          "Content-Length": String(pdfBuffer.byteLength),
        },
      })
    }

    // Default: return docx
    const filename = originalFilename

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
    const code =
      err instanceof Error && "Code" in err
        ? (err as unknown as { Code: string }).Code
        : undefined
    if (code === "NoSuchKey" || code === "NotFound") {
      return new Response("File not found", { status: 404 })
    }
    console.error("GET /document error", err)
    return new Response("Internal server error", { status: 500 })
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
