import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default function Home() {
  return (
    <>
      <main className="min-h-[calc(80vh-10rem)] flex items-center justify-center">
        <div className="max-w-xl text-center">
          <Badge variant="outline">
            <Sparkles />
            <span>AI-Powered</span>
          </Badge>
          <p className="text-5xl font-semibold mt-4 mb-8">Welcome to Polydoc</p>
          <p className="opacity-70">
            A smart translation system that uses a vector database to reduce
            costs and improve translation consistency.
          </p>
          <div className="flex mt-28 gap-4 items-center justify-center">
            {/* Select file btn */}
            <Button variant="outline">Learn More</Button>
          </div>
        </div>
      </main>
      {/* File dialog */}
    </>
  )
}
