"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hexoFrontMatter = require("hexo-front-matter");
const ansi_colors_1 = __importDefault(require("ansi-colors"));
// Only work when post asset folder option enabled
if (hexo.config.post_asset_folder) {
    hexo.extend.filter.register("before_post_render", function (data) {
        if (!data.asset_dir) {
            const parse = hexoFrontMatter.parse(data.content);
            console.log(data);
            return; // need asset_dir attribute available
        }
        console.log("Post asset folder path:", ansi_colors_1.default.magenta(data.asset_dir));
        // Split by path delimiter, filter out empty string, last one is asset folder's name.
        const asset_dir_name = data.asset_dir
            .split(/[\/\\]/)
            .filter((i) => i)
            .pop();
        console.log("Post asset folder name:", ansi_colors_1.default.magenta(asset_dir_name));
        // Character may be ahead of paths: '(' or '<' or whitespace.
        const look_behind = "(?<=[(<\\s])";
        // Asset paths in markdown start with './' or not, then folder's name, end with '/'.
        const path_markdown = RegExp(look_behind + "(./)?" + asset_dir_name + "/", "g");
        if (!path_markdown.test(data.content))
            return; // no asset link found, do nothing
        // Permalink's pathname, supposed to start with '/'
        const pathname = new URL(data.permalink).pathname;
        hexo.log.d("Post html path name:", ansi_colors_1.default.magenta(pathname));
        // Strip any suffix if exists, supposed to start and end with '/', this is where assets would be in html.
        const path_html = pathname.replace(/\.[^/.]+$/, "/");
        data.content = data.content.replace(path_markdown, path_html);
        hexo.log.i("Path converted:", ansi_colors_1.default.yellow(path_markdown.toString()), "→", ansi_colors_1.default.green(path_html));
    });
}
