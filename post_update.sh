rm -r dist
npm i
npx prisma generate
npx prisma migrate dev --name dev
npm run build

printf "REM has been sucessfully updated.\nYou should configure .env, config.json, and add any new values from their default files.\nYou may also add it to PM2 or add run.sh to a systemd service."