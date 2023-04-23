import momentlib, { tz } from "moment-timezone";
import { trueCasePathSync } from "true-case-path";
import * as path from "upath";
import * as fs from "fs";

// declare const hexo: import("hexo");

/**
 * get permalink by post path
 * transform permalink format in `_config.yml`
 * @param post post path
 */
export function parsePermalink(
	post: string,
	config: {
		[key: string]: any;
		/**
		 * permalink pattern
		 */
		permalink_pattern: string;
		/**
		 * post created date
		 */
		date: moment.MomentInput;
		/**
		 * post title
		 */
		title: string;
		/**
		 * hexo instance
		 */
		context: import("hexo");
	}
) {
	if (!post) throw new Error("parameter post is " + typeof post);
	const hexo = config.context;

	const moment = (input: momentlib.MomentInput) => {
		tz.setDefault(hexo.config.timezone || "UTC");
		return momentlib(input).tz(hexo.config.timezone || "UTC");
	};

	const normalizePath = (str: string | null | undefined) => {
		// immediately return empty string when str isnt string
		if (!str) return "";

		if (fs.existsSync(str)) {
			// when str path is exist (absolute)
			return path.toUnix(trueCasePathSync(str));
		} else {
			// return path.toUnix(trueCasePathSync(path.join(hexo.base_dir, str)));
			return path.toUnix(str);
		}
	};

	//hexo.log.d("permalink-src", post);
	const siteConfig = hexo.config;
	let pattern = config.permalink_pattern || siteConfig.permalink;
	const date = config.date;
	let cleanPathname = normalizePath(post).replace(/.md$/, "");
	//hexo.log.d("cleanPathname", cleanPathname);
	const toReplace = [
		normalizePath(siteConfig.cwd),
		siteConfig.source_dir + "/_posts/",
		`${siteConfig.post_dir || "src-posts"}/`,
		"_posts/",
		normalizePath(hexo.base_dir),
		path.toUnix(hexo.base_dir)
	].filter((str) => str.length > 0);
	//hexo.log.d("toReplace", ...toReplace);
	for (let i = 0; i < toReplace.length; i++) {
		const str = toReplace[i];
		cleanPathname = cleanPathname
			.replace(str, "/")
			// @todo remove multiple slashes
			.replace(/\/+/, "/")
			.replace(/^\/+/, "/");
		// @todo remove .md
		//.replace(/.md$/, '');
	}

	/**
	 * @see {@link https://hexo.io/docs/permalinks.html}
	 */
	const replacer: Record<string, string> = {
		":month": "MM",
		":year": "YYYY",
		":day": "DD",
		":i_month": "M",
		":hour": "HH",
		":minute": "mm",
		":second": "ss",
		// Filename (without pathname)
		":title": cleanPathname,
		// Filename (relative to “source/_posts/“ folder)
		":name": path.basename(cleanPathname),
		":post_title": config.title,
	};

	for (const date_pattern in replacer) {
		if (
			[":title", ":post_title", ":id", ":category", ":hash", ":name"].includes(
				date_pattern
			)
		) {
			// direct replace without moment for non-moment-pattern
			pattern = pattern.replace(date_pattern, replacer[date_pattern]);
		} else {
			pattern = pattern.replace(
				date_pattern,
				moment(date).format(replacer[date_pattern])
			);
		}
	}

	// replace %20 to space
	const newPattern = pattern.replace(/%20/g, " ");
	const result = newPattern.replace(/\/{2,10}/g, "/").replace(config.url, "");

	//hexo.log.d("permalink-result", result);
	return result;
}
