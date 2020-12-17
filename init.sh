#! /bin/sh
set -eu;

echo $1;

# firebaseのプロジェクト作成
# firebase projects:create projectID;

# models作成
init-models.sh $1;

# app作成
init-app.sh $1;