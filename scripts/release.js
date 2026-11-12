import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import https from 'https';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const version = 'v' + pkg.version;

let token = process.env.GITHUB_TOKEN;
if (!token && existsSync('./.token')) {
  token = readFileSync('./.token', 'utf8').trim();
}

if (!token) {
  console.error('Error: GITHUB_TOKEN environment variable or ./.token file is required.');
  process.exit(1);
}

// Get commit messages since last tag
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

const releaseBody = `### Vision Glass Dashboard ${version}

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
      uploadAsset(data.id);
    } else if (res.statusCode === 422) {
      console.log(`Release ${version} already exists. Fetching release ID...`);
      getExistingReleaseId((id) => uploadAsset(id));
    } else {
      console.error(`Error (${res.statusCode}):`, body);
    }
  });
});

function getExistingReleaseId(callback) {
  https.get({
    hostname: 'api.github.com',
    path: `/repos/adromir/${pkg.name}/releases/tags/${version}`,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node-Release-Tool'
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.id) callback(data.id);
      } catch (e) {
        console.error('Failed to parse existing release:', e);
      }
    });
  });
}

function uploadAsset(releaseId) {
  const assetPath = './dist/vision-glass-dashboard.js';
  const assetData = readFileSync(assetPath);
  const assetName = 'vision-glass-dashboard.js';

  console.log(`Uploading ${assetName} (${assetData.length} bytes) to release ${version}...`);

  const uploadReq = https.request({
    hostname: 'uploads.github.com',
    path: `/repos/adromir/${pkg.name}/releases/${releaseId}/assets?name=${assetName}`,
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node-Release-Tool',
      'Content-Type': 'application/javascript',
      'Content-Length': assetData.length
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`✓ Asset ${assetName} uploaded successfully!`);
      } else {
        console.log(`Asset upload notice (${res.statusCode}): asset may already exist or was updated.`);
      }
    });
  });

  uploadReq.on('error', (err) => console.error('Upload failed:', err));
  uploadReq.write(assetData);
  uploadReq.end();
}

req.on('error', (err) => console.error('Request failed:', err));
req.write(payload);
req.end();
