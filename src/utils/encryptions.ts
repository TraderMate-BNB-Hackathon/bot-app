import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';
import {
  ClientSecretCredential,
  DefaultAzureCredential,
} from '@azure/identity';
import dotenv from 'dotenv';

dotenv.config();

// Your Azure Key Vault URL
const vaultUrl = 'https://bot-trade.vault.azure.net/';

// Initialize KeyClient with Azure Identity credentials
const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID!,
  process.env.AZURE_CLIENT_ID!,
  process.env.AZURE_CLIENT_SECRET!
);

const keyClient = new KeyClient(vaultUrl, credential);

// Decryption algorithm (RSA-OAEP, RSA-OAEP-256, RSA1_5)
const algorithm = 'RSA-OAEP';

export async function encryptPrivateKey(address: string, privateKey: string) {
  try {
    // Get the encryption key from Azure Key Vault
    const key = await keyClient.createKey(address, 'RSA');
    const cryptographyClient = new CryptographyClient(
      key.id as string,
      credential
    );

    // Encrypt the private key using the encryption key
    const encryptedPrivateKey = await cryptographyClient.encrypt({
      algorithm,
      plaintext: Buffer.from(privateKey),
    });

    // Return the encrypted private key
    return btoa(
      String.fromCharCode.apply(null, Array.from(encryptedPrivateKey.result))
    );
  } catch (error: any) {
    console.log('Error encrypting private key:', error.message);
    throw error;
  }
}

export async function decryptPrivateKey(
  address: string,
  encryptedPrivateKey: string
) {
  try {
    // Get the decryption key from Azure Key Vault
    const key = await keyClient.getKey(address);

    const cryptographyClient = new CryptographyClient(
      key.id as string,
      credential
    );

    // Decrypt the encrypted private key using the decryption key
    const decryptedPrivateKey = await cryptographyClient.decrypt({
      algorithm,
      ciphertext: new Uint8Array(
        Array.from(atob(encryptedPrivateKey), (c) => c.charCodeAt(0))
      ),
    });

    // Return the decrypted private key
    return decryptedPrivateKey.result.toString();
  } catch (error) {
    console.error('Error decrypting private key:', error);
    throw error;
  }
}

// export async function testEncryption() {
//   const encryptedKey = await encryptPrivateKey('testkey');
//   const decryptedKey = await decryptPrivateKey(encryptedKey);
//   console.log(encryptedKey, decryptedKey);
// }
