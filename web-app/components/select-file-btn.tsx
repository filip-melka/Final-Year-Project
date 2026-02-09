"use client"

import { useRef } from "react"
import { useFileContext } from "@/context/file-context"
import { Button } from "./ui/button"

export function SelectFileBtn() {
  const { uploadFile } = useFileContext()
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleClick() {
    console.log("click")
    inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (
      file.type !==
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
      !file.name.toLowerCase().endsWith(".docx")
    ) {
      console.log("Only .docx files are allowed.")
      return
    }

    const error = uploadFile(file)
    console.log("upload error:", error)
  }
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={handleChange}
      />
      <Button onClick={handleClick}>Select File</Button>
    </>
  )
}
