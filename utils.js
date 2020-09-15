const readline = require('readline');
const crypto = require('crypto');
const bip39 = require('bip39');
const bip32 = require('bip32');
const secp256k1 = require('secp256k1');
const bech32 = require('bech32');

function prompt(text) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(text, (answer) => {
      rl.close();
      resolve(answer);
    })
  })
}

function clearScreen() {
  return new Promise((resolve) => {
    readline.cursorTo(process.stdout, 0, 0, () => {
      readline.clearScreenDown(process.stdout, resolve);
    });
  });
}

function getFirstCosmosAddressFromMnemonic(mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const masterKey = bip32.fromSeed(seed)
  const { privateKey } = masterKey.derivePath(`m/44'/118'/0'/0/0`)
  const publicKeyArr = secp256k1.publicKeyCreate(privateKey, true);
  const publicKey = Buffer.from(publicKeyArr);
  const sha256 = crypto.createHash('sha256');
  const ripemd = crypto.createHash('ripemd160');
  sha256.update(publicKey);
  ripemd.update(sha256.digest());
  const rawAddr = ripemd.digest();
  const cosmosAddress = bech32.encode('cosmos', bech32.toWords(rawAddr));
  return cosmosAddress;
}

function entropyToFirstCosmosAddress(entropy) {
  const mnemonic = bip39.entropyToMnemonic(entropy.toString('hex'));
  return getFirstCosmosAddressFromMnemonic(mnemonic);
}

async function displayMnemonic(mnemonic, { shareHolders, splits }) {
  const mnemonicWords = mnemonic.split(/\s+/g);
  await clearScreen();
  await prompt(
    'Now the program will display the master mnemonic one by one. ' + 
    'Please prepare the Ledger and input the mnemonic correspondingly.',
  );
  const n = shareHolders ? shareHolders.length : splits;
  for (let i = 0; i < n; i += 1) {
    await clearScreen();
    const shareHolderName = shareHolders ? shareHolders[i].name : '';
    const from = Math.ceil(mnemonicWords.length * i / n);
    const to = Math.ceil(mnemonicWords.length * (i + 1) / n);
    await prompt(`Share holder ${i} ${shareHolderName}, please press Enter to show the mnemonic from word ${from} to ${to - 1}.`);
    console.log(mnemonicWords.slice(from, to));
    await prompt(`Please input the above mnemonic words into the Ledger, then press Enter.`);
  }
  await clearScreen();
  const cosmosAddress = getFirstCosmosAddressFromMnemonic(mnemonic);
  console.log(
    'All mnemonic words entered. Please install Cosmos App on Ledger and verify the address.' + 
    `The first Cosmos address from this mnemonic should be ${cosmosAddress}.`,
  );
}

module.exports = {
  prompt,
  clearScreen,
  getFirstCosmosAddressFromMnemonic,
  entropyToFirstCosmosAddress,
  displayMnemonic,
};
