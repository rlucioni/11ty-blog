import { readdirSync } from 'fs';
import { join } from 'path';
import { eleventyImageTransformPlugin } from '@11ty/eleventy-img';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';

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
};
