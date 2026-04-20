import { Brain, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { TranslationDemo } from "@/components/translation-demo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const steps = [
	{
		icon: FileText,
		label: "Upload",
		description:
			"Upload a .docx file and choose a target language. Polydoc extracts every text segment — paragraphs, tables, headers, and footers.",
	},
	{
		icon: Brain,
		label: "Cache Lookup",
		description:
			"Each segment is embedded with text-embedding-3-small and queried against ChromaDB. Segments within cosine distance 0.3 of a past translation are reused instantly.",
	},
	{
		icon: Sparkles,
		label: "Translate & Store",
		description:
			"Only novel segments reach GPT-4o. New translations are stored back into the vector database, so the cache grows smarter with every document.",
	},
];

const stats = [
	{
		value: "Up to 46%",
		label: "Cache hit rate",
		detail: "on structured documents",
	},
	{
		value: "Up to 21.5%",
		label: "Reuse rate",
		detail: "growing across serialised corpora",
	},
	{
		value: "~16%",
		label: "Cost reduction",
		detail: "demonstrated on a 1,000-line benchmark",
	},
];

const stack = [
	"GPT-4o",
	"text-embedding-3-small",
	"ChromaDB",
	"Next.js",
	"AWS Lambda",
	"Amazon S3",
	"Terraform",
];

export default function About() {
	return (
		<main className="flex flex-col items-center px-6 pb-24">
			{/* Hero */}
			<section className="max-w-xl text-center pt-20 pb-16">
				<Badge variant="outline" className="mb-5">
					<span>Research Project</span>
				</Badge>
				<h1 className="text-5xl font-semibold tracking-tight leading-tight mb-4">
					Translation that gets smarter over time.
				</h1>
				<p className="text-muted-foreground text-base leading-relaxed">
					Polydoc caches every translation as a vector embedding. Future
					documents query that cache first — only novel content ever reaches the
					LLM, cutting costs and keeping terminology consistent across your
					entire document portfolio.
				</p>
			</section>

			{/* Interactive demo */}
			<section className="flex flex-col items-center pb-16">
				<p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">
					See it in action
				</p>
				<TranslationDemo />
			</section>

			{/* The Problem / Solution */}
			<section className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
				<div className="border border-border rounded-xl px-6 py-6 bg-card">
					<p className="text-sm font-semibold mb-2">Translation is expensive</p>
					<p className="text-sm text-muted-foreground leading-relaxed">
						LLM APIs charge per token. Large document portfolios — legal
						contracts, product manuals, subtitle libraries — repeat the same
						phrases constantly. Without caching, you pay for every word on every
						run.
					</p>
				</div>
				<div className="border border-border rounded-xl px-6 py-6 bg-card">
					<p className="text-sm font-semibold mb-2">Polydoc fixes that</p>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Each translated segment is stored as a high-dimensional embedding.
						Before touching the API, Polydoc checks whether a semantically
						equivalent translation already exists. If it does, the result is
						returned instantly — no API call, no cost.
					</p>
				</div>
			</section>

			{/* How It Works */}
			<section className="max-w-3xl w-full pt-16">
				<h2 className="text-2xl font-semibold tracking-tight mb-8 text-center">
					How it works
				</h2>
				<div className="flex gap-5 flex-wrap justify-center">
					{steps.map(({ icon: Icon, label, description }) => (
						<div
							key={label}
							className="flex items-start gap-4 border border-border rounded-xl px-6 py-5 w-80 bg-card"
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
			</section>

			{/* By the Numbers */}
			<section className="max-w-3xl w-full pt-16">
				<h2 className="text-2xl font-semibold tracking-tight mb-8 text-center">
					By the numbers
				</h2>
				<div className="flex gap-5 flex-wrap justify-center">
					{stats.map(({ value, label, detail }) => (
						<div
							key={label}
							className="border border-border rounded-xl px-6 py-5 w-56 bg-card text-center"
						>
							<p className="text-3xl font-semibold tracking-tight">{value}</p>
							<p className="text-sm font-medium mt-1">{label}</p>
							<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
								{detail}
							</p>
						</div>
					))}
				</div>
				<p className="text-xs text-muted-foreground text-center mt-5">
					Figures from controlled research benchmarks. Results vary by document
					similarity.
				</p>
			</section>

			{/* Tech Stack */}
			<section className="max-w-xl w-full pt-16 text-center">
				<h2 className="text-2xl font-semibold tracking-tight mb-6">
					Built with
				</h2>
				<div className="flex flex-wrap gap-2 justify-center">
					{stack.map((item) => (
						<Badge key={item} variant="secondary" className="text-sm px-3 py-1">
							{item}
						</Badge>
					))}
				</div>
			</section>

			{/* CTA */}
			<section className="pt-20 text-center">
				<p className="text-muted-foreground text-base mb-6">
					Ready to translate your first document?
				</p>
				<Link href="/">
					<Button size="lg">Try it now</Button>
				</Link>
			</section>
		</main>
	);
}
