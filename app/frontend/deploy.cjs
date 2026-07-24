const fs = require('fs');
const path = require('path');
const http = require('https');

const DIST_DIR = path.join(__dirname, 'dist');

// MIME type mapping helper
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.json': return 'application/json; charset=utf-8';
    default: return 'application/octet-stream';
  }
}

// Recursively get all files in a directory
function getFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, baseDir));
    } else {
      const relPath = path.relative(baseDir, filePath).replace(/\\/g, '/');
      results.push({
        fullPath: filePath,
        relPath: relPath,
        size: stat.size,
        contentType: getContentType(filePath)
      });
    }
  });
  return results;
}

// Promise wrapper for https request
function request(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: headers
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : {});
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', err => reject(err));
    if (body) {
      req.write(typeof body === 'string' ? body : body.toString());
    }
    req.end();
  });
}

// Upload file helper using PUT request
function uploadFile(url, filePath, contentType) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const fileStream = fs.createReadStream(filePath);
    const stat = fs.statSync(filePath);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size
      }
    };

    const req = http.request(options, res => {
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', err => reject(err));
    fileStream.pipe(req);
  });
}

function getApiKey() {
  if (process.env.HERENOW_API_KEY) {
    return process.env.HERENOW_API_KEY.trim();
  }
  const os = require('os');
  const credPath = path.join(os.homedir(), '.herenow', 'credentials');
  if (fs.existsSync(credPath)) {
    try {
      return fs.readFileSync(credPath, 'utf8').trim();
    } catch (e) {
      // ignore
    }
  }
  return null;
}

const SITE_SLUG = 'present-steeple-34y7';
const CLAIM_TOKEN = '29b82ca181cd30fc167da8f2e6a3d8e2ebe245129190ba72dd086c1991f47f85';

async function deploy() {
  console.log('Gathering files from dist folder...');
  const files = getFiles(DIST_DIR);
  console.log(`Found ${files.length} files.`);

  const manifestFiles = files.map(f => ({
    path: f.relPath,
    size: f.size,
    contentType: f.contentType
  }));

  console.log('1. Updating site via here.now API...');
  const apiKey = getApiKey();
  const headers = {
    'Content-Type': 'application/json',
    'X-HereNow-Client': 'cursor/direct-api'
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    console.log('Using API Key for authenticated deployment.');
  } else {
    console.log('No API Key found, deploying using claim token.');
  }

  const payload = {
    files: manifestFiles,
    displayName: 'Stalk Market Swing Trading Workspace',
    displayDescription: 'AI-assisted swing trading workspace',
    spaMode: true
  };
  if (!apiKey) {
    payload.claimToken = CLAIM_TOKEN;
  }

  const createPayload = JSON.stringify(payload);

  const createRes = await request(
    `https://here.now/api/v1/publish/${SITE_SLUG}`,
    'PUT',
    headers,
    createPayload
  );

  console.log(`Site updated: ${createRes.siteUrl}`);
  console.log(`Slug: ${createRes.slug}`);
  if (createRes.claimUrl) {
    console.log(`Claim URL: ${createRes.claimUrl}`);
  }

  console.log('2. Uploading files...');
  const uploads = createRes.upload.uploads;
  for (const upload of uploads) {
    const localFile = files.find(f => f.relPath === upload.path);
    if (!localFile) {
      console.warn(`Local file not found for path: ${upload.path}`);
      continue;
    }
    console.log(`Uploading ${upload.path} (${localFile.size} bytes)...`);
    await uploadFile(upload.url, localFile.fullPath, upload.headers['Content-Type']);
  }
  console.log('All files uploaded successfully.');

  console.log('3. Finalizing deployment...');
  const finalizePayload = JSON.stringify({
    versionId: createRes.upload.versionId
  });

  const finalizeHeaders = {
    'Content-Type': 'application/json'
  };
  if (apiKey) {
    finalizeHeaders['Authorization'] = `Bearer ${apiKey}`;
  }

  const finalizeRes = await request(
    createRes.upload.finalizeUrl,
    'POST',
    finalizeHeaders,
    finalizePayload
  );

  console.log('\n--- DEPLOYMENT SUCCESSFUL ---');
  console.log(`Live Website URL: ${finalizeRes.siteUrl}`);
  if (createRes.claimUrl) {
    console.log(`Claim Link (Save this to claim ownership!): ${createRes.claimUrl}\n`);
  }
}

deploy().catch(err => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
