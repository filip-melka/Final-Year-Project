"use client"

import { useFileContext } from "@/context/file-context"
import { useEffect, useState } from "react"
import { TranslateResponse } from "../api/translate/route"
import { Euro, Eye, Loader2, Pencil, Repeat, Text } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function Translate() {
  const { file, language, filename, discardFile } = useFileContext()
  const [isEditing, setIsEditing] = useState(false)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [translationRes, setTranslationRes] =
    useState<TranslateResponse | null>(null)

  useEffect(() => {
    if (file && language) {
      // eslint-disable-next-line react-hooks/immutability
      handleTranslation(file)
    } else {
      discardFile()
    }
  }, [])

  async function handleTranslation(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("filename", filename)
    formData.append("languageCode", language!.code)

    const res = await fetch("/api/translate", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()
    console.log(data)
    setTranslationRes(data)
  }

  if (!translationRes) {
    return (
      <main className="flex min-h-[calc(70vh-5rem)] items-center justify-center">
        <div className="flex gap-4 items-center">
          <Loader2 className="animate-spin" />
          <span className="text-lg">Translating</span>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] p-8 flex justify-center gap-[5vw]">
      <div className="bg-gray-50 p-4 w-[900px] h-[calc(100vh-8rem)]">
        <div className="flex h-16 px-10 justify-between items-center">
          <span className="text-lg font-semibold">{filename}.docx</span>
          {isEditorReady && (
            <Button
              disabled={isEditing}
              onClick={() => setIsEditing(true)}
              variant="outline"
            >
              {isEditing ? (
                <>
                  <Pencil size={15} />
                  <span>Editing</span>
                </>
              ) : (
                <>
                  <Eye size={18} />
                  <span>Edit</span>
                </>
              )}
            </Button>
          )}
        </div>
        {/* Document editor */}
      </div>
      <div className="w-fit min-h-[calc(100vh-9rem)] flex flex-col justify-between py-20">
        <div className="flex flex-col gap-4 w-[300px]">
          <Card className="gap-1 py-4 px-6 shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="opacity-70 flex items-center gap-2 text-sm">
                <Text size={15} />
                Total Segments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <span className="text-2xl font-semibold">
                {translationRes.total_segments}
              </span>
            </CardContent>
          </Card>
          <Card className="gap-1 py-4 px-6 shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="opacity-70 flex items-center gap-2 text-sm">
                <Repeat size={15} />
                Reuse Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <span className="text-2xl font-semibold">
                {(
                  (translationRes.reused_segments /
                    translationRes.total_segments) *
                  100
                ).toFixed(2)}
                %
              </span>
            </CardContent>
          </Card>
          <Card className="gap-1 py-4 px-6 shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="opacity-70 flex items-center gap-2 text-sm">
                <Euro size={15} />
                Cost Savings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <span className="text-2xl font-semibold">
                $ {translationRes.cost_savings.toFixed(4)}
              </span>
            </CardContent>
          </Card>
        </div>
        {isEditorReady && (
          <div className="flex justify-end">{/* Save and edit buttons */}</div>
        )}
      </div>
    </main>
  )
}
