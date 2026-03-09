"use client"

import { Euro, FileText, Loader2, Pencil, Repeat, Text } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  DownloadDocBtn,
  type EditorHandle,
  SaveDocBtn,
} from "@/components/document-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFileContext } from "@/context/file-context"
import type { TranslateResponse } from "../api/translate/route"

const DocumentEditor = dynamic(() => import("@/components/document-editor"), {
  ssr: false,
  loading: () => <div>Loading editor...</div>,
})

export default function Translate() {
  const editorRef = useRef<EditorHandle | null>(null)

  const { file, language, filename, discardFile } = useFileContext()
  const [isEditing, setIsEditing] = useState(false)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [translationRes, setTranslationRes] =
    useState<TranslateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (file && language) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      handleTranslation(file)
    } else {
      discardFile()
    }
  }, [])

  async function handleTranslation(file: File) {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("filename", filename)
      formData.append("languageCode", language!.code)

      const res = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Translation request failed (${res.status})`)
      }

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setTranslationRes(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Translation failed. Please try again."
      setError(message)
      toast.error(message)
    }
  }

  if (error) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center pb-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-sm font-medium text-destructive">Translation failed</span>
          <span className="text-sm text-muted-foreground">{error}</span>
        </div>
      </main>
    )
  }

  if (!translationRes) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center pb-20">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
              <FileText className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-sm font-medium">
              Translating your document
            </span>
            <span className="text-sm text-muted-foreground">
              This may take a moment…
            </span>
          </div>
        </div>
      </main>
    )
  }

  const reuseRate =
    translationRes.total_segments > 0
      ? (translationRes.reused_segments / translationRes.total_segments) * 100
      : 0

  return (
    <main className="min-h-[calc(100vh-5rem)] p-6 pb-20 flex justify-center gap-6">
      {/* Document Editor Panel */}
      <div className="flex flex-col border border-border rounded-xl overflow-hidden shadow-sm w-[900px] h-[calc(100vh-8rem)] shrink-0">
        {/* Editor Header */}
        <div className="flex h-12 px-4 justify-between items-center border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate">
              {filename}.docx
            </span>
          </div>
          {isEditorReady && (
            <Button
              size="sm"
              variant={isEditing ? "secondary" : "outline"}
              onClick={() => !isEditing && setIsEditing(true)}
              disabled={isEditing}
              className="shrink-0 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              {isEditing ? "Editing" : "Edit"}
            </Button>
          )}
        </div>
        {/* Editor Body */}
        <div className="flex-1 min-h-0 bg-white">
          <DocumentEditor
            ref={editorRef}
            onReady={() => setIsEditorReady(true)}
            isEditing={isEditing}
            document={`/api/document?fileKey=${encodeURIComponent(translationRes.key)}`}
          />
        </div>
      </div>

      {/* Stats & Actions Sidebar */}
      <div className="w-[240px] shrink-0 flex flex-col justify-between py-2">
        {/* Stats Cards */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
            Summary
          </p>

          <Card className="py-4 px-5 shadow-none gap-1.5">
            <CardHeader className="p-0">
              <CardTitle className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <Text className="w-3.5 h-3.5" />
                Total Segments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <span className="text-2xl font-semibold tabular-nums">
                {translationRes.total_segments}
              </span>
            </CardContent>
          </Card>

          <Card className="py-4 px-5 shadow-none gap-1.5">
            <CardHeader className="p-0">
              <CardTitle className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <Repeat className="w-3.5 h-3.5" />
                Reuse Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col gap-2">
              <span className="text-2xl font-semibold tabular-nums">
                {reuseRate.toFixed(1)}%
              </span>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-700 ease-out"
                  style={{ width: `${reuseRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="py-4 px-5 shadow-none gap-1.5">
            <CardHeader className="p-0">
              <CardTitle className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <Euro className="w-3.5 h-3.5" />
                Cost Savings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <span className="text-2xl font-semibold tabular-nums">
                ${translationRes.cost_savings.toFixed(4)}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        {isEditorReady && (
          <div className="flex flex-col gap-2">
            {isEditing ? (
              <SaveDocBtn
                editorRef={editorRef}
                fileKey={translationRes.key}
                onSave={() => {
                  toast.info("Document has been saved.")
                  setIsEditing(false)
                }}
              />
            ) : (
              <DownloadDocBtn
                fileKey={translationRes.key}
                editorRef={editorRef}
              />
            )}
          </div>
        )}
      </div>
    </main>
  )
}
