build: clean
	npx @11ty/eleventy

clean:
	rm -rf dist

lint:
	npx eslint .

serve: clean
	npx @11ty/eleventy --serve
