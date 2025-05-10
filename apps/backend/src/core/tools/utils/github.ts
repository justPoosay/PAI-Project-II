import { Octokit } from 'octokit';

export async function getRepositoryTree(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch?: string
) {
  try {
    if (!branch) {
      const { data: repoData } = await octokit.rest.repos.get({
        owner,
        repo
      });

      branch = repoData.default_branch;
    }

    const {
      data: { tree: treeData }
    } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: 'true'
    });

    const pathMap = new Map<string, { name: string; type: string; children: string[] }>();

    pathMap.set('', { name: `${owner}/${repo}`, type: 'directory', children: [] });

    const sortedItems = [...treeData].sort((a, b) => a.path!.localeCompare(b.path!));

    for (const item of sortedItems) {
      const parts = item.path!.split('/');
      let parentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const currentPart = parts[i];
        const currentPath = parentPath ? `${parentPath}/${currentPart}` : currentPart;
        const isLastPart = i === parts.length - 1;

        if (!pathMap.get(parentPath)?.children.includes(currentPath!)) {
          pathMap.get(parentPath)?.children.push(currentPath!);
        }

        if (!pathMap.has(currentPath!)) {
          pathMap.set(currentPath!, {
            name: currentPart!,
            type: isLastPart ? (item.type === 'tree' ? 'directory' : 'file') : 'directory',
            children: []
          });
        }

        parentPath = currentPath!;
      }
    }

    function buildTreeString(path: string, prefix: string = '', isLast: boolean = true) {
      const node = pathMap.get(path)!;
      let result = '';

      if (node.name) {
        const current_prefix = isLast ? '└── ' : '├── ';
        const name = node.type === 'directory' ? node.name + '/' : node.name;
        result += prefix + current_prefix + name + '\n';
      }

      if (node.type === 'directory') {
        const new_prefix = prefix + (isLast ? '    ' : '│   ');

        const children = node.children.sort((a, b) => {
          const nodeA = pathMap.get(a)!;
          const nodeB = pathMap.get(b)!;
          if (nodeA.type !== nodeB.type) {
            return nodeA.type === 'directory' ? -1 : 1;
          }
          return nodeA.name.localeCompare(nodeB.name);
        });

        children.forEach((childPath, index) => {
          result += buildTreeString(childPath, new_prefix, index === children.length - 1);
        });
      }

      return result;
    }

    return buildTreeString('');
  } catch (e) {
    if (e instanceof Error) {
      return e.message;
    }
    return 'Unknown error';
  }
}

export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<string> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });
    if (!Array.isArray(data)) {
      if (data.type === 'file') {
        return Buffer.from(data.content, data.encoding as BufferEncoding).toString();
      }
      if (data.type === 'submodule') {
        return 'Submodule: ' + data.submodule_git_url;
      }
      if (data.type === 'symlink') {
        return 'Symlink: ' + data.target;
      }
    } else {
      return 'Directory contents: \n' + data.map(v => v.path).join('\n');
    }
    return 'Unknown type';
  } catch (e) {
    if (e instanceof Error) {
      return e.message;
    }
    return 'Unknown error';
  }
}
