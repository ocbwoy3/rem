rm -r dist
npm i

npm run build
node dist/src/setup.js
clear

npx prisma generate
trap "prisma generate" EXIT
npx prisma migrate dev --name dev
trap "prisma migrate dev --name dev" EXIT
npm run build

clear

printf "REM has been sucessfully installed!\n"
printf "Please configure the .env and config.json files and add any missing/new values from their example counterparts, otherwise REM will not work!\n"
printf "You may also add this to PM2 or to a systemd service, or run it directly with the run.sh file provided.\n"
printf "Have fun!\n"