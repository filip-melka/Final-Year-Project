import { FileDialog } from "@/components/file-dialog"
import { SelectFileBtn } from "@/components/select-file-btn"
import { Badge } from "@/components/ui/badge"
import { Brain, DollarSign, Languages, Sparkles } from "lucide-react"

const features = [
  {
    icon: Brain,
    label: "Vector Caching",
    description:
      "Past translations are stored as embeddings and reused automatically.",
  },
  {
    icon: DollarSign,
    label: "Cost Efficient",
    description: "Cached segments skip GPT-4o entirely, reducing API spend.",
  },
  {
    icon: Languages,
    label: "Multi-language",
    description: "Supports 15+ target languages with consistent terminology.",
  },
]

export default function Home() {
  return (
    <>
      <main className="min-h-[calc(100vh-5rem)] flex flex-col items-center pb-20 justify-center px-6 relative overflow-hidden">
        {/* Hero */}
        <div className="max-w-xl text-center">
          <Badge variant="outline" className="mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered</span>
          </Badge>
          <h1 className="text-5xl font-semibold tracking-tight leading-tight mb-4">
            Translate documents, smarter.
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Polydoc uses vector embeddings to cache and reuse past translations
            — cutting costs and keeping terminology consistent across your
            documents.
          </p>
          <div className="mt-10 flex flex-col items-center gap-2">
            <SelectFileBtn />
            <span className="text-sm text-muted-foreground">
              .docx · up to 8 MB
            </span>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-24 flex gap-5 flex-wrap justify-center">
          {features.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="flex items-start gap-4 border border-border rounded-xl px-6 py-5 w-72 bg-card"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <FileDialog />
    </>
  )
}
