import { context } from "esbuild";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";

const ctx = await context({
	bundle: true,
	entryPoints: ["./src/vereteno.ts"],
	outdir: "./dist",
	format: "iife",
	logLevel: "info",
	sourcemap: "inline",
	minifyWhitespace: false,
	minifySyntax: false,
	drop: [],
	plugins: [
		{
			name: "external-files",
			setup(inBuild) {
				inBuild.onResolve(
					{ filter: /(\.\/assets|\.\/fonts|\/systems)/ },
					() => {
						return { external: true };
					},
				);
			},
		},
	],
});

ctx.rebuild();
ctx.watch();