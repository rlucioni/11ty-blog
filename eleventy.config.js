import * as sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { createHash } from 'crypto';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function compileCSS() {
  console.log('compiling css');

  const scssPath = join(__dirname, 'assets/scss/main.scss');
  const outputDir = join(__dirname, '_site/css');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const scssResult = sass.compile(scssPath, { style: 'expanded' });

  const postcssResult = await postcss([
    autoprefixer,
    cssnano({
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
      }]
    })
  ]).process(scssResult.css, { from: undefined });

  const hash = createHash('sha256').update(postcssResult.css).digest('hex');
  const filename = `main.${hash}.css`;
  const filepath = join(outputDir, filename);

  writeFileSync(filepath, postcssResult.css);

  console.info(`wrote css to ${filepath}`);

  return `/css/${filename}`;
}

export default async function(eleventyConfig) {
  eleventyConfig.setInputDirectory('content');

  eleventyConfig.addPassthroughCopy({
    './static/': '/',
  });

  const cssFilename = await compileCSS();

  eleventyConfig.addShortcode('css', () => cssFilename);
};
