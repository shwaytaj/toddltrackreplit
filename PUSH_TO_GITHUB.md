# Push Toddl to GitHub

Your GitHub account is connected, and I've found your repository: **shwaytaj/toddl**

## Steps to Push Your Code

Run these commands in the Replit Shell:

### 1. Get your GitHub access token
```bash
tsx scripts/push-to-github.ts
```
This will show your repositories and confirm the connection.

### 2. Configure git remote manually
Since Replit has git protections, you'll need to use the Shell directly:

```bash
# First, let me get the authenticated user info
git config user.name "shwaytaj"
git config user.email "your-email@example.com"  # Replace with your GitHub email
```

### 3. Add the GitHub remote
```bash
git remote add github https://github.com/shwaytaj/toddl.git
```

### 4. Push to GitHub
```bash
git push -u github main
```

If your branch is called something else (like `master`), use:
```bash
git push -u github master
```

## Alternative: Use GitHub's Personal Access Token

If the above doesn't work, you can create a Personal Access Token:

1. Go to: https://github.com/settings/tokens
2. Create a new token with `repo` permissions
3. Use it to push:

```bash
git remote add github https://YOUR_TOKEN@github.com/shwaytaj/toddl.git
git push -u github main
```

## Your Available Repositories

Based on your GitHub account, you have these repos available:
1. **toddl** - https://github.com/shwaytaj/toddl
2. **toddlclaude** - https://github.com/shwaytaj/toddlclaude
3. **TestRepo** - https://github.com/shwaytaj/TestRepo
4. **test** - https://github.com/shwaytaj/test

Choose whichever repository you'd like to use and update the commands above accordingly!
