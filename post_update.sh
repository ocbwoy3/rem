npm i
npx prisma generate
npx prisma migrate dev --name dev
npm run build

print "REM has been sucessfully configured.\nYou may now add it to PM2 or add run.sh to a service."