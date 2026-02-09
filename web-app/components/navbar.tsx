import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

export function Navbar() {
  return (
    <nav className="flex h-20 px-[10%] items-center justify-between">
      <div className="flex items-center">
        <h1 className="font-semibold">Polydoc</h1>
        <div className="flex ml-10 items-center gap-4">
          <Link href={"/"}>
            <Button variant="ghost">View Documents</Button>
          </Link>
          <Link href={"/"}>
            <Button variant="ghost">Query Vector DB</Button>
          </Link>
        </div>
      </div>
      <a
        href="https://renateq.grafana.net/public-dashboards/9ef68fa4e8494a708f718ea9d2764631"
        target="_blank"
      >
        <Button variant="ghost">
          <ExternalLink size={18} />
          <span>Grafana</span>
        </Button>
      </a>
    </nav>
  )
}
