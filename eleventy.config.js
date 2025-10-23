import { readdirSync } from 'fs';
import { join } from 'path';
import { eleventyImageTransformPlugin } from '@11ty/eleventy-img';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import { minify } from 'html-minifier-terser';

export const config = {
  dir: {
    input: 'src',
    output: 'dist',
  }
};

function getBundleFiles() {
  const bundlesDir = join(config.dir.input, 'assets/bundles');
  
  try {
    const files = readdirSync(bundlesDir);
    const cssFiles = files.filter(file => file.endsWith('.css'));
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    return {
      css: cssFiles.map(file => `/${file}`),
      js: jsFiles.map(file => `/${file}`)
    };
  } catch {
    console.warn('Bundles directory not found, webpack may not have run yet');
    return { css: [], js: [] };
  }
}

export default async function(eleventyConfig) {
  eleventyConfig.addPreprocessor('drafts', '*', (data) => {
    if (data.draft && process.env.ELEVENTY_RUN_MODE === 'build') {
      return false;
    }
  });

  eleventyConfig.setLibrary('md', markdownIt({ html: true }));
  eleventyConfig.amendLibrary('md', (mdLib) => mdLib.use(markdownItAnchor));

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    transformOnRequest: false,
    formats: ['avif', 'webp', 'jpeg'],
    widths: ['auto'],
    htmlOptions: {
      imgAttributes: {
        loading: 'lazy',
        decoding: 'async',
      },
      pictureAttributes: {}
    },
  });

  eleventyConfig.addPlugin(syntaxHighlight, {
    preAttributes: {
      class: 'highlight',
    },
  });

  const staticDir = `${config.dir.input}/static`;
  const bundlesDir = `${config.dir.input}/assets/bundles`;
  
  eleventyConfig.addPassthroughCopy({
    [staticDir]: '/',
    [bundlesDir]: '/',
  });

  eleventyConfig.addShortcode('cssPath', () => {
    const bundles = getBundleFiles();
    const mainFile = bundles.css.find(file => file.includes('main'));
    return mainFile || '';
  });
  
  eleventyConfig.addShortcode('cssPathVendor', () => {
    const bundles = getBundleFiles();
    const vendorFile = bundles.css.find(file => file.includes('vendor'));
    return vendorFile || '';
  });

  eleventyConfig.addShortcode('jsPath', () => {
    const bundles = getBundleFiles();
    const mainFile = bundles.js.find(file => file.includes('main'));
    return mainFile || '';
  });
  
  eleventyConfig.addShortcode('jsPathVendor', () => {
    const bundles = getBundleFiles();
    const vendorFile = bundles.js.find(file => file.includes('vendor'));
    return vendorFile || '';
  });

  eleventyConfig.addShortcode('asciinema', (url, options = {}) => {
    const defaultOptions = {
      theme: 'asciinema',
      fontSize: 'small',
      ...options
    };
    
    const optionsStr = Object.entries(defaultOptions)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    return `<div class="asciinema-player" data-url="${url}" ${optionsStr}></div>
<script>
  if (window.AsciinemaPlayer) {
    AsciinemaPlayer.create('${url}', document.querySelector('.asciinema-player'), ${JSON.stringify(defaultOptions)});
  }
</script>`;
  });

  eleventyConfig.setUseGitIgnore(false);

  eleventyConfig.addTransform('htmlmin', async function(content, outputPath) {
    if (outputPath && (outputPath.endsWith('.html') || outputPath.endsWith('.xml'))) {
      try {
        const isXml = outputPath.endsWith('.xml');

        if (isXml) {
          // More conservative minification for XML files
          return await minify(content, {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: false, // Keep attributes for XML validity
            removeScriptTypeAttributes: false,
            removeStyleLinkTypeAttributes: false,
            useShortDoctype: false, // Keep full XML declaration
            minifyCSS: false, // Don't minify CSS in XML
            minifyJS: false, // Don't minify JS in XML
            removeAttributeQuotes: false, // Keep quotes for XML validity
            removeEmptyAttributes: false, // Keep empty attributes
            removeOptionalTags: false, // Don't remove optional tags in XML
            removeEmptyElements: false,
            caseSensitive: true, // XML is case sensitive
            conservativeCollapse: true, // More conservative whitespace handling
            html5: false, // Not HTML5
            keepClosingSlash: true, // Keep closing slashes for XML
            maxLineLength: false,
            preserveLineBreaks: false,
            quoteCharacter: '"',
            sortAttributes: false, // Don't sort attributes in XML
            sortClassName: false
          });
        } else {
          // Full minification for HTML files
          return await minify(content, {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true,
            removeAttributeQuotes: true,
            removeEmptyAttributes: true,
            removeOptionalTags: true,
            removeEmptyElements: false,
            caseSensitive: false,
            conservativeCollapse: false,
            html5: true,
            keepClosingSlash: false,
            maxLineLength: false,
            preserveLineBreaks: false,
            quoteCharacter: '"',
            sortAttributes: true,
            sortClassName: true
          });
        }
      } catch (err) {
        console.error(`Error minifying ${outputPath.endsWith('.xml') ? 'XML' : 'HTML'}:`, err);
        return content;
      }
    }
    return content;
  });
};
