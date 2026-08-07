// ------------------------------------------------------------
// Web Crypto API based helper for Real End-to-End Encryption (E2EE)
// ------------------------------------------------------------

const DB_NAME = "chitchat-e2ee";
const STORE_NAME = "keys";

/**
 * Open (or create) IndexedDB for private key storage
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store private key in IndexedDB
 */
export async function storePrivateKey(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(key, "privateKey");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve stored private key from IndexedDB
 */
export async function getPrivateKey() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get("privateKey");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error("Error retrieving private key:", err);
    return null;
  }
}

/**
 * Generate an ECDH (P-256) key pair for Web Crypto
 */
export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );

  // Export public key as SPKI Base64
  const exportedPub = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedPub)));

  // Store private key in IndexedDB
  await storePrivateKey(keyPair.privateKey);

  return { publicKey: publicKeyBase64, privateKey: keyPair.privateKey };
}

/**
 * Import a peer's public key (Base64 -> CryptoKey)
 */
export async function importPeerPublicKey(base64) {
  const binaryDer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

/**
 * Derive shared AES-GCM symmetric key
 */
async function deriveAESKey(privateKey, peerPublicKey) {
  return crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: peerPublicKey,
    },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plain text for recipient
 */
export async function encryptMessage(plainText, peerPublicKeyBase64) {
  const peerPub = await importPeerPublicKey(peerPublicKeyBase64);
  const privateKey = await getPrivateKey();
  if (!privateKey) {
    throw new Error("Local private key missing. Please generate keys first.");
  }

  const aesKey = await deriveAESKey(privateKey, peerPub);

  const enc = new TextEncoder();
  const data = enc.encode(plainText);

  // Fresh 12-byte IV for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    data
  );

  const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  const nonce = btoa(String.fromCharCode(...iv));

  return { ciphertext, nonce };
}

/**
 * Decrypt message received from sender
 */
export async function decryptMessage(ciphertextBase64, nonceBase64, peerPublicKeyBase64) {
  try {
    const peerPub = await importPeerPublicKey(peerPublicKeyBase64);
    const privateKey = await getPrivateKey();
    if (!privateKey) {
      return "[Decryption Error: Private Key Missing]";
    }

    const aesKey = await deriveAESKey(privateKey, peerPub);

    const ciphertext = Uint8Array.from(atob(ciphertextBase64), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(nonceBase64), (c) => c.charCodeAt(0));

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error("Decryption failed:", err);
    return "[Decryption Failed: Shared key mismatch or corrupted payload]";
  }
}
