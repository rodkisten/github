import * as core from '@actions/core';
import { createAppAuth } from '@octokit/auth-app';
import { request } from '@octokit/request';

type PermissionLevel = 'read' | 'write' | 'admin';

function parseRepositories(raw: string): string[] | undefined {
  if (!raw.trim()) return undefined;
  return raw
    .split(/[\n,]+/)
    .map((repo) => repo.trim())
    .filter(Boolean);
}

async function runMain(): Promise<void> {
  const appId = core.getInput('app-id', { required: true });
  const privateKey = core.getInput('private-key', { required: true });
  const owner = core.getInput('owner', { required: true });
  const repositoriesInput = core.getInput('repositories');
  const permissionContents = core.getInput('permission-contents') as PermissionLevel;
  const permissionPullRequests = core.getInput('permission-pull-requests') as PermissionLevel;

  const repositories = parseRepositories(repositoriesInput);

  // 1. Autentica como o GitHub App para descobrir o ID da instalação
  const auth = createAppAuth({
    appId,
    privateKey,
  });

  const appAuthentication = await auth({ type: 'app' });

  // 2. Busca o installation_id correspondente ao owner (usuário ou organização)
  let installationId: number;
  try {
    const { data } = await request('GET /users/{username}/installation', {
      username: owner,
      headers: {
        authorization: `bearer ${appAuthentication.token}`,
      },
    });
    installationId = data.id;
  } catch (err) {
    throw new Error(
      `Não foi possível encontrar uma instalação do GitHub App para o owner "${owner}". Verifique se o App está instalado nele.`
    );
  }

  // 3. Gera o token de instalação com o escopo de repositórios e permissões
  const permissions: Record<string, PermissionLevel> = {};
  if (permissionContents) permissions.contents = permissionContents;
  if (permissionPullRequests) permissions.pull_requests = permissionPullRequests;

  const installationAuthentication = await auth({
    type: 'installation',
    installationId,
    repositoryNames: repositories,
    permissions,
  });

  const token = installationAuthentication.token;

  // 4. Mascara o token nos logs, salva no state (para o post) e exporta como output
  core.setSecret(token);
  core.saveState('token', token);
  core.setOutput('token', token);

  core.info(`Token gerado com sucesso para "${owner}" (Installation ID: ${installationId}).`);
}

async function runPost(): Promise<void> {
  const token = core.getState('token');

  if (!token) {
    core.info('Nenhum token encontrado no state para revogar.');
    return;
  }

  try {
    await request('DELETE /installation/token', {
      headers: {
        authorization: `token ${token}`,
      },
    });
    core.info('Token de instalação revogado com sucesso.');
  } catch (error) {
    // Apenas avisa no post para não falhar o job inteiro caso o token já tenha expirado
    core.warning(`Falha ao revogar o token: ${(error as Error).message}`);
  }
}

async function run(): Promise<void> {
  try {
    const isPost = Boolean(core.getState('isPost'));

    if (!isPost) {
      // Marca que a próxima execução deste mesmo arquivo será a fase "post"
      core.saveState('isPost', 'true');
      await runMain();
    } else {
      await runPost();
    }
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();
