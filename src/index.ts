"use strict";

import hexoFrontMatter = require("hexo-front-matter");
import ansiColors from "ansi-colors";

declare const hexo: import('hexo')

// Only work when post asset folder option enabled
if (hexo.config.post_asset_folder) {
	hexo.extend.filter.register("before_post_render", function (data) {
		if (!data.asset_dir) {
			const parse = hexoFrontMatter.parse(data.content);
			console.log(data);
			return; // need asset_dir attribute available
		}
		console.log("Post asset folder path:", ansiColors.magenta(data.asset_dir));
		// Split by path delimiter, filter out empty string, last one is asset folder's name.
		const asset_dir_name = data.asset_dir
			.split(/[\/\\]/)
			.filter((i) => i)
			.pop();
		console.log("Post asset folder name:", ansiColors.magenta(asset_dir_name));
		// Character may be ahead of paths: '(' or '<' or whitespace.
		const look_behind = "(?<=[(<\\s])";
		// Asset paths in markdown start with './' or not, then folder's name, end with '/'.
		const path_markdown = RegExp(
			look_behind + "(./)?" + asset_dir_name + "/",
			"g"
		);
		if (!path_markdown.test(data.content)) return; // no asset link found, do nothing
		// Permalink's pathname, supposed to start with '/'
		const pathname = new URL(data.permalink).pathname;
		hexo.log.d("Post html path name:", ansiColors.magenta(pathname));
		// Strip any suffix if exists, supposed to start and end with '/', this is where assets would be in html.
		const path_html = pathname.replace(/\.[^/.]+$/, "/");
		data.content = data.content.replace(path_markdown, path_html);
		hexo.log.i(
			"Path converted:",
			ansiColors.yellow(path_markdown.toString()),
			"→",
			ansiColors.green(path_html)
		);
	});
}
