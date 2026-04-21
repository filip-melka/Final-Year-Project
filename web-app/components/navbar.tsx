"use client"

import { Button } from "@/components/ui/button"
import { useFileContext } from "@/context/file-context"
import { ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

export function Navbar() {
  const router = useRouter()
  const { file, discardFile } = useFileContext()

  function navigateWithConfirm(message: string, action: () => void) {
    if (!file || window.confirm(message)) {
      action()
    }
  }

  function handleLogoClick() {
    navigateWithConfirm(
      "Going back will discard the current file. Continue?",
      discardFile,
    )
  }

  function handleAboutClick() {
    router.push("/about")
  }

  return (
    <nav className="flex h-20 px-[10%] items-center justify-between">
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleLogoClick}
          className="font-semibold cursor-pointer hover:opacity-70 transition-opacity duration-150"
        >
          Polydoc
        </button>
        <div className="flex ml-10 items-center gap-4">
          <Button
            disabled={file != null}
            variant="ghost"
            onClick={handleAboutClick}
          >
            About
          </Button>
        </div>
      </div>
      <a
        href="https://renateq.grafana.net/public-dashboards/9ef68fa4e8494a708f718ea9d2764631"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="ghost">
          <ExternalLink size={18} />
          <span>Grafana</span>
        </Button>
      </a>
    </nav>
  )
}
