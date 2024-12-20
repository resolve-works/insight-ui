dev:
	npm run dev

prod:
	set -a; source ./.env; set +a; node build/index.js
