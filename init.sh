#! /bin/sh
set -eu;

echo $1;

# firebaseのプロジェクト作成
# firebase projects:create projectID;

# models作成
sh ./init-models.sh $1;

# app作成
sh ./init-app.sh $1;

# firebase作成
# git clone
# npm link 