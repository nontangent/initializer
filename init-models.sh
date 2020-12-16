#! /bin/sh
set -eu;

echo $1;

if [ ! -e $1 ]; then
    mkdir $1;
fi;
cd $1;
export APP_INITIALIZED_DIR=$(pwd);

# models作成
cd $APP_INITIALIZED_DIR;

echo "cloning models-template...";
git clone git@github.com:nontangent/models-template.git models && cd models;

echo "removing .git directory...";
rm -rf .git;

echo "changing package name...";
npx change-package-name @$1/models;

echo "creating npm link...";
npm link;

echo "creating repository...";
git init;

git add -A;
git commit -m 'initial commit';

if [ $1 != 'test' ]; then 
    gh repo create $1/models --private -y;
    git push -u origin master;
fi;