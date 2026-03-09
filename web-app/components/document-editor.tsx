import React, {
  RefObject,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react"
import dynamic from "next/dynamic"
import { Button } from "./ui/button"
import { Loader2, Save, FileDown } from "lucide-react"
import { SuperDoc } from "@harbour-enterprises/superdoc"
import { putDocxFile } from "@/lib/aws-clients"

type EditorHandle = {
  getSuperDoc: () => SuperDoc | null
  exportDoc: (opts?: unknown) => Promise<Blob | undefined>
}

type DocumentEditorProps = {
  document: string
  isEditing: boolean
  onReady: () => void
}

// actual component (forwardRef to expose EditorHandle)
const DocumentEditorComponent = forwardRef<EditorHandle, DocumentEditorProps>(
  function DocumentEditorComponent({ document, isEditing, onReady }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const idRef = useRef(`superdoc-${Math.random().toString(36).slice(2)}`)
    const superdocRef = useRef<SuperDoc | null>(null)

    useEffect(() => {
      if (isEditing && superdocRef.current) {
        superdocRef.current.setDocumentMode("editing")
      }
    }, [isEditing])

    useEffect(() => {
      let mounted = true

      const initEditor = async () => {
        try {
          const { SuperDoc } = await import("@harbour-enterprises/superdoc")

          if (mounted && containerRef.current) {
            superdocRef.current = new SuperDoc({
              selector: `#${idRef.current}`,
              document,
              documentMode: "viewing",
              modules: {
                comments: false,
              },
              onEditorCreate: onReady,
            })
          }
        } catch (error) {
          console.error("SuperDoc init error:", error)
        }
      }

      initEditor()

      return () => {
        mounted = false
        if (superdocRef.current?.destroy) {
          try {
            superdocRef.current.destroy()
          } catch (e) {
            console.error("Error destroying SuperDoc:", e)
          }
        }
        superdocRef.current = null
      }
    }, [document])

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      getSuperDoc: () => superdocRef.current ?? null,
      exportDoc: async (opts?: unknown) => {
        if (!superdocRef.current) return undefined
        try {
          const result = await superdocRef.current.export({
            commentsType: "clean",
            triggerDownload: false,
            ...(opts || {}),
          })
          if (!result) return undefined
          return result as Blob
        } catch (e) {
          console.error("exportDoc error:", e)
          return undefined
        }
      },
    }))

    return (
      <div
        id={idRef.current}
        className="w-fit mt-4 h-[calc(100%-3rem)] overflow-scroll mx-auto"
        ref={containerRef}
      />
    )
  },
)

// Prevent SSR issues by dynamically loading the forwarded component
const DocumentEditor = dynamic(
  async () => {
    return DocumentEditorComponent
  },
  { ssr: false },
)

type EditorHandleRef = RefObject<EditorHandle | null>

export function SaveDocBtn({
  editorRef,
  fileKey,
  onSave,
}: {
  editorRef: EditorHandleRef
  fileKey: string
  onSave: () => void
}) {
  const [isSaving, setIsSaving] = useState(false)

  async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        const base64 = dataUrl.split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  async function handleClick() {
    setIsSaving(true)
    try {
      const blob = await editorRef.current?.exportDoc({
        triggerDownload: false,
        commentsType: "clean",
      })
      if (!blob) return
      const base64 = await blobToBase64(blob)
      await putDocxFile(fileKey, base64)
      const res = await fetch("/api/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey, file: base64 }),
      })
      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`)
      }
      editorRef.current?.getSuperDoc()?.setDocumentMode("viewing")
      onSave()
    } catch (e) {
      console.error("SaveDocBtn error", e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isSaving}
      className="w-full cursor-pointer"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          Save
        </>
      )}
    </Button>
  )
}

export function DownloadDocBtn({
  editorRef,
  fileKey,
}: {
  editorRef: EditorHandleRef
  fileKey?: string
}) {
  const [downloadingDocx, setDownloadingDocx] = React.useState(false)
  const [downloadingPdf, setDownloadingPdf] = React.useState(false)

  function getFilenameFromKey(key?: string, fallback = "document.docx") {
    if (!key) return fallback
    return key.split("/").pop() || fallback
  }

  async function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleDocx() {
    setDownloadingDocx(true)
    try {
      const blob = await editorRef.current?.exportDoc?.({
        triggerDownload: false,
        commentsType: "clean",
      })
      if (!blob) {
        console.error("No docx blob returned from editor")
        return
      }
      await downloadBlob(blob, getFilenameFromKey(fileKey, "document.docx"))
    } catch (e) {
      console.error("Download error", e)
      alert("Download failed")
    } finally {
      setDownloadingDocx(false)
    }
  }

  async function handlePdf() {
    if (!fileKey) {
      alert("Missing fileKey: cannot request PDF conversion")
      return
    }
    setDownloadingPdf(true)
    try {
      const url = `/api/document?fileKey=${encodeURIComponent(fileKey)}&type=pdf`
      const resp = await fetch(url)
      if (!resp.ok) {
        console.error("Failed to fetch PDF", resp.status)
        alert("Failed to convert/download PDF")
        return
      }
      const arrayBuffer = await resp.arrayBuffer()
      const pdfBlob = new Blob([arrayBuffer], { type: "application/pdf" })
      const original = getFilenameFromKey(fileKey, "document.docx")
      const pdfFilename = original.replace(/\.docx$/i, "") + ".pdf"
      await downloadBlob(pdfBlob, pdfFilename)
    } catch (e) {
      console.error("Download error", e)
      alert("Download failed")
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleDocx}
        disabled={downloadingDocx || downloadingPdf}
        className="w-full cursor-pointer"
      >
        {downloadingDocx ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Downloading…
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4" />
            Download DOCX
          </>
        )}
      </Button>
      <Button
        variant="outline"
        onClick={handlePdf}
        disabled={downloadingDocx || downloadingPdf}
        className="w-full cursor-pointer"
      >
        {downloadingPdf ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Converting…
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4" />
            Download PDF
          </>
        )}
      </Button>
    </div>
  )
}

export type { EditorHandle }
export default DocumentEditor
