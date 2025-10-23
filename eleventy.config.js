import * as sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { createHash } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
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

async function compileCSS() {
  console.info('compiling css');

  const cssDir = `${config.dir.input}/assets/css`;
  const cssResult = sass.compile(`${cssDir}/index.scss`, {
    style: 'compressed',
    loadPaths: [cssDir]
  });

  const postcssResult = await postcss([
    autoprefixer,
    cssnano({
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
      }]
    }),
  ]).process(cssResult.css, { from: undefined });

  const hash = createHash('sha256').update(postcssResult.css).digest('hex');
  const filename = `index.min.${hash}.css`;
  const filepath = `${config.dir.output}/${filename}`;

  mkdirSync(dirname(filepath), { recursive: true });
  writeFileSync(filepath, postcssResult.css);
  console.info(`wrote css to ${filepath}`);

  return `/${filename}`;
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
  eleventyConfig.addPassthroughCopy({
    [staticDir]: '/',
  });

  let cssPath;
  eleventyConfig.on('eleventy.before', async () => {
    cssPath = await compileCSS();
  });
  eleventyConfig.addShortcode('cssPath', () => cssPath);
  eleventyConfig.addWatchTarget(`${config.dir.input}/assets/css/`);
};
