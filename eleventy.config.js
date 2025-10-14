import * as sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { createHash } from 'crypto';
import { writeFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { eleventyImageTransformPlugin } from '@11ty/eleventy-img';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function compileCSS() {
  console.log('compiling css');

  const scssDir = join(__dirname, 'assets/scss');
  const outputDir = join(__dirname, '_site/css');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const scssFiles = readdirSync(scssDir)
    .filter(file => extname(file) === '.scss')
    .sort();

  console.log(`found ${scssFiles.length} scss files: ${scssFiles.join(', ')}`);

  let concatenatedScss = '';
  for (const file of scssFiles) {
    const filePath = join(scssDir, file);
    const fileContent = readFileSync(filePath, 'utf8');
    concatenatedScss += `/* ${file} */\n${fileContent}\n\n`;
  }

  const scssResult = sass.compileString(concatenatedScss, { 
    style: 'expanded',
    loadPaths: [scssDir]
  });

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

  eleventyConfig.addPassthroughCopy({
    './static/': '/',
  });

  let cssFilename;
  eleventyConfig.on('eleventy.before', async () => {
    cssFilename = await compileCSS();
  });

  eleventyConfig.addWatchTarget('assets/scss/');

  eleventyConfig.addShortcode('css', () => cssFilename);
};
