import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import https from 'https';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const manifestPath = './custom_components/vision_glass/manifest.json';
if (!existsSync(manifestPath)) {
  console.error(`Error: ${manifestPath} not found!`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const version = 'v' + pkg.version;

if (manifest.version !== pkg.version) {
  console.warn(`Warning: manifest.json version (${manifest.version}) differs from package.json (${pkg.version}).`);
}

let token = process.env.GITHUB_TOKEN;
if (!token && existsSync('./.token')) {
  token = readFileSync('./.token', 'utf8').trim();
}

if (!token) {
  console.error('Error: GITHUB_TOKEN environment variable or ./.token file is required.');
  process.exit(1);
}

let changelog = '';
try {
  const tags = execSync('git tag --sort=-creatordate', { encoding: 'utf8' }).trim().split('\n');
  const prevTag = tags.find(t => t && t !== version);
  if (prevTag) {
    changelog = execSync(`git log ${prevTag}..HEAD --oneline`, { encoding: 'utf8' }).trim();
  } else {
    changelog = execSync('git log -n 10 --oneline', { encoding: 'utf8' }).trim();
  }
} catch (e) {
  changelog = `Release ${version}`;
}

const releaseBody = `### Vision Glass Integration ${version}

#### Changes in this release:
${changelog.split('\n').map(l => `- ${l}`).join('\n')}
`;

console.log(`Creating GitHub Release ${version} for ${pkg.name}...`);

const payload = JSON.stringify({
  tag_name: version,
  name: version,
  body: releaseBody,
  draft: false,
  prerelease: false
});

const req = https.request({
  hostname: 'api.github.com',
  path: `/repos/adromir/${pkg.name}/releases`,
  method: 'POST',
  headers: {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Node-Release-Tool',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const data = JSON.parse(body);
      console.log(`✓ Release ${version} created successfully: ${data.html_url}`);
    } else if (res.statusCode === 422) {
      console.log(`Release ${version} already exists.`);
    } else {
      console.error(`Error (${res.statusCode}):`, body);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Request failed:', err);
  process.exit(1);
});
req.write(payload);
req.end();
