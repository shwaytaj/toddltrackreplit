import { getUncachableGitHubClient } from '../server/github-client.js';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

async function pushToGitHub() {
  try {
    console.log('🔄 Connecting to GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Connected as: ${user.login}`);
    
    // Get list of repositories
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 20,
    });
    
    console.log('\n📦 Your recent repositories:');
    repos.forEach((repo, idx) => {
      console.log(`${idx + 1}. ${repo.name} - ${repo.description || 'No description'}`);
    });
    
    // For now, let's ask the user to specify which repo
    console.log('\n⚠️  Please specify the repository name you want to push to.');
    console.log('Usage: GITHUB_REPO="owner/repo-name" npm run push-github');
    
    const repoName = process.env.GITHUB_REPO;
    
    if (!repoName) {
      console.log('\n❌ No repository specified. Please set GITHUB_REPO environment variable.');
      console.log('Example: GITHUB_REPO="your-username/toddl" npm run push-github');
      process.exit(1);
    }
    
    const [owner, repo] = repoName.split('/');
    
    if (!owner || !repo) {
      console.log('❌ Invalid repository format. Use: owner/repo-name');
      process.exit(1);
    }
    
    // Check if repo exists
    try {
      const { data: repoData } = await octokit.repos.get({ owner, repo });
      console.log(`\n✅ Found repository: ${repoData.html_url}`);
      
      // Configure git remote
      console.log('\n🔧 Configuring git remote...');
      const accessToken = await getAccessToken();
      const remoteUrl = `https://x-access-token:${accessToken}@github.com/${owner}/${repo}.git`;
      
      try {
        execSync('git remote remove github 2>/dev/null', { stdio: 'ignore' });
      } catch {}
      
      execSync(`git remote add github ${remoteUrl}`);
      console.log('✅ Git remote configured');
      
      // Check current branch
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
      console.log(`\n📍 Current branch: ${currentBranch}`);
      
      // Push to GitHub
      console.log('\n🚀 Pushing to GitHub...');
      execSync(`git push -u github ${currentBranch}`, { stdio: 'inherit' });
      
      console.log('\n✅ Successfully pushed to GitHub!');
      console.log(`🌐 View at: ${repoData.html_url}`);
      
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`\n❌ Repository "${repoName}" not found.`);
        console.log('Would you like me to create it? (This would require additional implementation)');
      } else {
        throw error;
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function getAccessToken() {
  let connectionSettings: any;
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  return connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
}

pushToGitHub();
