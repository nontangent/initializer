#! /bin/sh
set -eu;

if [ ! -e $1 ]; then
    mkdir $1;
fi;

cd $1;
export APP_INITIALIZED_DIR=$(pwd);

# models作成
cd $APP_INITIALIZED_DIR;

ng new $1 --routing --style scss;
mv $1 app;
cd app;
export NG_CLI_ANALYTICS="false";
ng analytics off;
ng add @angular/pwa;
ng add @angular/material --defaults;
ng add @angular/fire;
ng add angular-atomic-schematics --defaults;

npx change-package-name @$1/app;
npm link @$1/models;

echo "creating repository...";
git init;

git add -A;
git commit -m 'initial commit';

if [ $1 != 'test' ]; then 
    gh repo create $1/app --private -y;
    git push -u origin master;
fi;