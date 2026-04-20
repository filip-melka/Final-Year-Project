"use client";

import { FileText } from "lucide-react";
import { useState } from "react";

const segments = [
	{
		en: "This Agreement is entered into as of January 1, 2024.",
		fr: "Le présent Accord est conclu à partir du 1er janvier 2024.",
		cached: false,
		threshold: 30,
	},
	{
		en: "All parties agree to the terms and conditions set forth herein.",
		fr: "Toutes les parties acceptent les termes et conditions énoncés ci-après.",
		cached: true,
		threshold: 6,
	},
	{
		en: "The contract shall be governed by the laws of Ireland.",
		fr: "Le contrat sera régi par les lois d'Irlande.",
		cached: true,
		threshold: 4,
	},
	{
		en: "Payment shall be made within thirty (30) days of invoice.",
		fr: "Le paiement doit être effectué dans les trente (30) jours suivant la facture.",
		cached: false,
		threshold: 55,
	},
	{
		en: "This document contains confidential information.",
		fr: "Ce document contient des informations confidentielles.",
		cached: true,
		threshold: 10,
	},
	{
		en: "Any amendments to this Agreement must be made in writing.",
		fr: "Toute modification de cet Accord doit être faite par écrit.",
		cached: false,
		threshold: 75,
	},
];

export function TranslationDemo() {
	const [value, setValue] = useState(0);

	const translatedCount = segments.filter((s) => value >= s.threshold).length;
	const cacheHits = segments.filter(
		(s) => value >= s.threshold && s.cached,
	).length;

	return (
		<div className="w-full max-w-xl">
			{/* Document card */}
			<div className="border border-border rounded-xl bg-card overflow-hidden">
				<div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
					<FileText className="w-3.5 h-3.5 text-muted-foreground" />
					<span className="text-xs text-muted-foreground font-medium">
						contract_2024.docx
					</span>
				</div>
				<div className="px-6 py-5 space-y-3">
					{segments.map((seg) => {
						const isTranslated = value >= seg.threshold;
						return (
							<div key={seg.en} className="flex items-start gap-2">
								{/* Stack both texts in the same grid cell for smooth crossfade */}
								<div className="flex-1 grid text-sm leading-relaxed">
									<span
										className="transition-opacity duration-300"
										style={{ gridArea: "1/1", opacity: isTranslated ? 0 : 1 }}
									>
										{seg.en}
									</span>
									<span
										className="transition-opacity duration-300"
										style={{ gridArea: "1/1", opacity: isTranslated ? 1 : 0 }}
									>
										{seg.fr}
									</span>
								</div>
								<div
									className="shrink-0 w-1.5 h-1.5 mt-1.5 rounded-full transition-opacity duration-300"
									style={{
										opacity: isTranslated && seg.cached ? 1 : 0,
										backgroundColor:
											isTranslated && seg.cached
												? "rgb(16 185 129)"
												: "transparent",
									}}
								/>
							</div>
						);
					})}
				</div>
			</div>

			{/* Slider */}
			<div className="mt-4 px-1">
				<input
					type="range"
					min={0}
					max={100}
					value={value}
					onChange={(e) => setValue(Number(e.target.value))}
					className="w-full cursor-pointer accent-foreground"
				/>
				<div className="flex justify-between mt-1">
					<span className="text-xs text-muted-foreground">English</span>
					<span className="text-xs text-muted-foreground">Français</span>
				</div>
			</div>

			{/* Live stats */}
			<div className="flex gap-5 mt-3 justify-center">
				<span className="text-xs text-muted-foreground">
					<span className="font-medium text-foreground">{translatedCount}</span>
					{" / "}
					{segments.length} translated
				</span>
				<span className="text-xs text-muted-foreground">
					<span className="font-medium" style={{ color: "rgb(16 185 129)" }}>
						{cacheHits}
					</span>{" "}
					cache hits
				</span>
			</div>
		</div>
	);
}
