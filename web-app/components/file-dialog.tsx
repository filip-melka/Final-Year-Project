"use client"

import { useFileContext } from "@/context/file-context"
import { supportedLanguages } from "@/lib/languages"
import { useRouter } from "next/navigation"
import { Field, FieldDescription, FieldLabel } from "./ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group"
import { Button } from "./ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

export function FileDialog() {
  const router = useRouter()
  const { file, language, filename, setFilename, setLanguage, discardFile } =
    useFileContext()

  const languages = Array.from(supportedLanguages.entries()).sort((a, b) =>
    a[1].localeCompare(b[1]),
  )

  function handleClick() {
    router.push("/translate")
  }

  if (file) {
    return (
      <div className="w-full h-full fixed top-0 left-0 bg-black/20 backdrop-blur-xs flex items-center justify-center">
        <div className="bg-white rounded-xl px-8 py-6 w-fit max-w-sm">
          <Field>
            <FieldLabel htmlFor="filename-input">Filename</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="filename-input"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
              <InputGroupAddon align="inline-end">.docx</InputGroupAddon>
            </InputGroup>
            <FieldDescription>
              The filename will be used as a key.
            </FieldDescription>
          </Field>
          <Field className="mt-8">
            <FieldLabel htmlFor="language-input">Language</FieldLabel>
            <Select
              onValueChange={(code) =>
                setLanguage({
                  code: code,
                  full: supportedLanguages.get(code) || "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l[1]} value={l[0]}>
                    {l[1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="mt-12 flex items-center justify-end gap-4">
            <Button variant="outline" onClick={discardFile}>
              Cancel
            </Button>
            <Button onClick={handleClick} disabled={!language}>Translate</Button>
          </div>
        </div>
      </div>
    )
  }
}
