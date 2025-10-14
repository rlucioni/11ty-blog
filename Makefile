build:
	npx @11ty/eleventy

clean:
	rm -rf _site

serve:
	npx @11ty/eleventy --serve
