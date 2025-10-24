build: clean
	npm run build

clean:
	rm -rf dist
	rm -rf src/assets/bundles

dev: clean
	npm run dev

lint:
	npx eslint .
