"use strict";

import ansiColors from "ansi-colors";

// declare const hexo: import("hexo");

// Only work when post asset folder option enabled
if (hexo.config.post_asset_folder === true) {
	hexo.extend.filter.register("before_post_render", async function (data) {
		if (!data.asset_dir) {
			const hexoFrontMatter = await import("hexo-front-matter");
			const parsePermalink = (await import("./parse-permalink")).parsePermalink;
			const parse = hexoFrontMatter.parse(data.content);
			// fix permalink
			if (!parse.permalink && !data.permalink) {
				const pathSource = data.source;
				const permalink = parsePermalink(pathSource, {
					date: parse.date,
					title: parse.title,
					permalink_pattern: data.config.permalink,
					context: hexo,
				});

				data.permalink = parse.permalink = permalink;
			} else if (!data.permalink && parse.permalink) {
				data.permalink = parse.permalink;
			}
			data.asset_dir = data.source
				.replace(hexo.config.source_dir + "/_posts/", "")
				.replace(/.(md)$/, "");
		}

		let asset_dir_name: string;

		if (data.asset_dir) {
			hexo.log.d("Post asset folder path:", ansiColors.magenta(data.asset_dir));
			// Split by path delimiter, filter out empty string, last one is asset folder's name.
			asset_dir_name = data.asset_dir
				.split(/[\/\\]/)
				.filter((i: any) => i)
				.pop();
		}

		hexo.log.d("Post asset folder name:", ansiColors.magenta(asset_dir_name));
		// Character may be ahead of paths: '(' or '<' or whitespace.
		const look_behind = "(?<=[(<\\s])";
		// Asset paths in markdown start with './' or not, then folder's name, end with '/'.
		const path_markdown = RegExp(
			look_behind + "(./)?" + asset_dir_name + "/",
			"g"
		);
		if (!path_markdown.test(data.content)) return; // no asset link found, do nothing
		// Permalink's pathname, supposed to start with '/'
		let pathname: string;
		try {
			pathname = new URL(data.permalink).pathname;
		} catch (_err) {
			hexo.log.d("Post permalink", hexo.config.url + "/" + data.permalink);
			pathname = new URL(hexo.config.url + "/" + data.permalink).pathname;
		}
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
