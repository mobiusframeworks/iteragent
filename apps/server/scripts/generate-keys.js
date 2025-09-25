#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate RSA key pair for JWT signing
 */
function generateKeys() {
  console.log('🔑 Generating RSA key pair for JWT signing...');

  // Ensure keys directory exists
  const keysDir = path.join(__dirname, '../keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  // Generate RSA key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Write keys to files
  const privateKeyPath = path.join(keysDir, 'private.pem');
  const publicKeyPath = path.join(keysDir, 'public.pem');

  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);

  // Set secure permissions
  try {
    fs.chmodSync(privateKeyPath, 0o600); // Read/write for owner only
    fs.chmodSync(publicKeyPath, 0o644);  // Read for all, write for owner
  } catch (err) {
    console.warn('⚠️  Could not set file permissions:', err.message);
  }

  console.log('✅ RSA key pair generated successfully!');
  console.log(`   Private key: ${privateKeyPath}`);
  console.log(`   Public key:  ${publicKeyPath}`);
  console.log('');
  console.log('🔒 Private key permissions set to 600 (owner read/write only)');
  console.log('📖 Public key permissions set to 644 (readable by all)');
  console.log('');
  console.log('⚠️  IMPORTANT: Keep the private key secure and never commit it to version control!');
  console.log('   Add keys/ to your .gitignore file.');
}

// Generate key rotation helper
function generateKeyRotationInfo() {
  const rotationInfo = {
    keyRotation: {
      note: "For key rotation, generate new keys and update JWT_PRIVATE_KEY_PATH",
      steps: [
        "1. Generate new key pair: npm run generate-keys",
        "2. Update JWT_PRIVATE_KEY_PATH to new private key",
        "3. Keep old public key available for existing token verification",
        "4. Update client packages with new public key",
        "5. Gradually phase out old tokens over 30 days"
      ],
      multipleKids: {
        note: "To support multiple key IDs (kid) in JWT header:",
        implementation: "Add 'kid' to JWT header and maintain key map in server"
      }
    }
  };

  const infoPath = path.join(__dirname, '../keys/rotation-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(rotationInfo, null, 2));
  console.log(`📋 Key rotation info saved to: ${infoPath}`);
}

if (require.main === module) {
  generateKeys();
  generateKeyRotationInfo();
}
