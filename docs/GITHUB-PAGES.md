# Host on GitHub Pages

This app is static and can live alongside your other projects at `https://YOUR-USERNAME.github.io/sodium-tracker/`. Paths, installation metadata and offline caching support a repository subfolder. The workflow is already in `.github/workflows/pages.yml`.

1. On GitHub, create a new repository named `sodium-tracker`. Choose Public for GitHub Free; private source repositories require a qualifying plan for Pages. Leave the README, license and .gitignore boxes unchecked so the new repository is empty.
2. In this project's Terminal, run the following, replacing YOUR-USERNAME with your GitHub username:

   ```sh
   cd "/Users/rohitbhatia/Documents/ChatGPT/Sodium Tracker"
   git add .gitignore .github README.md docs index.html package.json public scripts src tests
   git commit -m "Build nutrition tracker PWA"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/sodium-tracker.git
   git push -u origin main
   ```

   If `origin` already exists, inspect `git remote -v` and use the intended repository; do not replace another project's remote blindly. Use your usual GitHub authentication or GitHub Desktop to publish this folder. Do not upload personal backup JSON files.
3. In the repository, open **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**. You do not need to create another workflow or select a `docs` publishing folder.
4. Open **Actions → Deploy Meal Tracker → Run workflow → main → Run workflow**. This handles the initial push possibly occurring before Pages was enabled.
5. Wait for the workflow to succeed. It tests, builds, and publishes only `dist/`. Open the live URL shown under **Settings → Pages**; it normally ends in `/sodium-tracker/`. An existing account-level custom domain can change this URL, so use the one GitHub shows.
6. Keep **Enforce HTTPS** enabled in Pages settings. Open the live URL on your phone. In Safari, Share → Add to Home Screen; in Android Chrome, Install app / Add to Home screen.

Future changes deploy automatically when pushed to `main`. Installed copies can pick up a new version via the app's Settings → Refresh data → Update app.

The app website is publicly accessible in this standard setup. Food logs remain in each visitor's browser and are not committed or sent to GitHub. Your localhost log will not automatically appear at the hosted address: export it in Settings, then import it at the hosted URL. Keep backup files private. There is no cross-device or family data sync.

Sources: [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

## Avoid missing icons

Use **GitHub Actions** as the Pages source. Publishing the source repository root directly leaves `manifest.webmanifest`, `icons/` and `sw.js` under `public/`, while the page expects them beside `index.html`. That causes 404 responses and letter icons on phones. The included workflow publishes the complete `dist/` artifact, and the build validates every install icon.
