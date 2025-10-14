export default function(eleventyConfig) {
  eleventyConfig.setInputDirectory('content');

  eleventyConfig.addPassthroughCopy({
    './static/': '/',
  });
};
