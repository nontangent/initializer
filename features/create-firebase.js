const { cwd } = require('process');
const fs = require('fs');
const { join } = require('path');

const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);

const FIREBASE_TEMPLATE_GIT = 'git@github.com:nontangent/firebase-template.git'
const git = require('simple-git');
const firebaseTools = require('firebase-tools');
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN
});

async function createFirebase(projectName, options) {
  const BASE_DIR = cwd();
  const PROJECT_DIR = join(BASE_DIR, projectName);
  const FIREBASE_DIR = join(PROJECT_DIR, 'firebase');

  console.debug('FIREBASE_DIR:', FIREBASE_DIR);

  // プロジェクトディレクトリが存在しない場合、ディレクトリを作成
  if (!fs.existsSync(PROJECT_DIR)) fs.mkdirSync(projectName);

  // すでにfirebaseディレクトリが存在していないかチェック
  if (fs.existsSync(FIREBASE_DIR)) {
    if (options.force) {
      fs.rmdirSync(FIREBASE_DIR, {recursive: true});
    } else {
      throw Error('tmp/firebase directory already exists.');
    }
  }

  // Firebase TemplateをClone
  await git().clone(FIREBASE_TEMPLATE_GIT, FIREBASE_DIR);

  // cloneした先のディレクトリに移動
  process.chdir(FIREBASE_DIR);

  // gitの削除
  fs.rmdirSync(join(FIREBASE_DIR, '.git'), {recursive: true});

  // Firebaseのプロジェクトを取得(存在しない場合は作成)
  const project = await getOrCreateFirebaseProject(projectName);

  // TODO: Firebase初期化
  await useFirebaseProject(project.projectId);

  // GitHubにOrganizationが存在しているかチェック
  if (!(await doesOrganizationExists(projectName)))
    throw Error('You must create organization!');

  // GithubにRepositoryが存在しているかチェック
  const repo = await getOrCreateRepository(projectName, 'firebase');

  // GitHubにpush
  await git().init().addRemote('origin', repo.sshUrl);
  await git().add('.');
  await git().commit('initial commit');
  await git().push(['-u', 'origin', 'master']);
}

async function useFirebaseProject(projectId) {
  try {
    await exec(`npx firebase use ${projectId} --alias default`);
  } catch (error) {
    if (error.stderr !== 'command.alias is not a function\n') {
      console.error(error.stderr);
      process.exit();
    }
  }
}

async function getOrCreateFirebaseProject(projectName) {
  return getFirebaseProject(projectName) || createFirebaseProject(projectName)
}

async function createFirebaseProject(projectName) {
  const projectId = `${projectName}-${generateRandomId(4)}`;
  return await firebaseTools.projects.create(projectId, {displayName: projectName});
}

async function getFirebaseProject(projectName) {
  const projects = await firebaseTools.projects.list();
  return projects.find((project) => project.displayName === projectName) || null;
}

async function doesOrganizationExists(projectName) {
  let res = await octokit.request('GET /user/orgs');
  const orgNames = res.data.map((org) => org.login);
  return orgNames.includes(projectName) ;
}

async function getOrCreateRepository(projectName, name) {
  return await getRepository(projectName, name) 
    || await createRepository(projectName, name);
}

async function getRepository(projectName, name) {
  const params = {org: projectName};
  const res = await octokit.request('GET /orgs/{org}/repos', params);
  const repositories = res.data.map((data) => convertDataToRepository(data));
  return repositories.find(repo => repo['name'] === name) || null; 
}

async function createRepository(projectName, name) {
  const params = { org: projectName, name: name };
  const res = await octokit.request('POST /orgs/{org}/repos', params);
  return convertDataToRepository(res.data);
}

function convertDataToRepository(data) {
  return {
    name: data['name'],
    fullName: data['full_name'],
    sshUrl: data['ssh_url']
  };
}

function generateRandomId(n) {
  var CODE_TABLE = '0123456789';
  var r = "";
  for (var i = 0, k = CODE_TABLE.length; i < n; i++){
    r += CODE_TABLE.charAt(Math.floor(k * Math.random()));
  }
  return r;
}

exports.createFirebase = createFirebase;