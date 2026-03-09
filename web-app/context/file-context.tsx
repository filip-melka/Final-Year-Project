"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"

type FileContextType = {
  file: File | null
  language: Language | null
  filename: string
  uploadFile: (file: File) => string | undefined
  setLanguage: (language: Language) => void
  setFilename: (filename: string) => void
  discardFile: () => void
}

type Language = {
  full: string
  code: string
}

const FileContext = createContext<FileContextType | undefined>(undefined)

export function FileContextProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState<Language | null>(null)
  const [filename, setFilename] = useState<string>("")

  function uploadFile(file: File): string | undefined {
    if (
      file.type !==
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
      !file.name.toLowerCase().endsWith(".docx")
    ) {
      return "Only .docx files are allowed."
    }

    const maxSize = 8 * 1024 * 1024 // 8MB
    if (file.size > maxSize) {
      return "File is too large. Must be under 8MB."
    }

    setFilename(file.name.replace(/\.docx$/i, ""))
    setFile(file)
  }

  function discardFile() {
    setFile(null)
    router.replace("/")
  }

  useEffect(() => {
    if (file === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguage(null)
    }
  }, [file])

  return (
    <FileContext.Provider
      value={{
        file,
        language,
        filename,
        setLanguage,
        uploadFile,
        discardFile,
        setFilename,
      }}
    >
      {children}
    </FileContext.Provider>
  )
}

export function useFileContext() {
  const context = useContext(FileContext)
  if (!context)
    throw new Error("'useFileContext' must be used within FileProvider")
  return context
}
