#! /bin/sh
set -eu;

PROJECT_NAME=$1;
echo "PROJECT_NAME is" $PROJECT_NAME;

if [ ! -e $PROJECT_NAME ]; then
    mkdir $PROJECT_NAME;
fi;

cd $PROJECT_NAME;

echo "cloning firebase-template...";
git clone git@github.com:nontangent/firebase-template.git firebase && cd firebase;

echo "removing .git directory...";
rm -rf .git;

echo "changing package name...";
npx change-package-name @$1/firebase;
LINE=$(npx firebase projects:list | grep -n -m1 $1 | tr -d ' ');
ARR=(${LINE//│/ });

echo ${#ARR[@]};
if ${#ARR[@]}; then
    PROJECT_ID=(${ARR[2]});
    echo $PROJECT_ID;
else
    PROJECT_ID=0;
fi;

if [ $PROJECT_ID ]; then 
    echo "INFO: firebase project is already created!";
else
    SUFFIX=$(($RANDOM % 10000));
    PROJECT_ID=$(echo $PROJECT_NAME-$SUFFIX);
    echo "PROJECT_ID:" $PROJECT_ID;
    echo "creating firebase project...";
    npx firebase projects:create $PROJECT_ID --display-name $PROJECT_NAME;
fi;

echo "config firebase...";
npx firebase use $PROJECT_ID --alias default;

echo "creating repository...";
git init;

git add -A;
git commit -m 'initial commit';

if [ $1 != 'tmp' ]; then 
    gh repo create $1/firebase --private -y;
    git push -u origin master;
fi;