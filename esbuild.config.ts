import { context } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";

import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";

const ctx = await context({
	bundle: true,
	entryPoints: ["./src/vereteno.ts", "./src/vereteno.scss"],
	outdir: "./dist",
	format: "iife",
	logLevel: "info",
	sourcemap: "inline",
	minifyWhitespace: false,
	minifySyntax: false,
	drop: [],
	plugins: [sassPlugin({
		logger: {
			warn: () => "",
		},
	}),
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