build: clean
	npm run build

clean:
	rm -rf dist

dev: clean
	npm run dev

lint:
	npx eslint .
