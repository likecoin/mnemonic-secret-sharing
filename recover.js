const bip39 = require('bip39');
const slip39 = require('slip39');
const {
  prompt,
  clearScreen,
  displayMnemonic,
  entropyToFirstCosmosAddress,
} = require('./utils');

async function main() {
  const isVerifyMode = process.argv[2] === '--verify'
  if (isVerifyMode) {
    console.log(`Now in verify mode, which won't display the mnemonic words.`);
  }

  const thresholdInput = await prompt('Input the share threshold: ');
  const threshold = Number.parseInt(thresholdInput, 10);
  if (!Number.isSafeInteger(threshold) || threshold <= 1) {
    throw new Error('Invalid input on threshold');
  }
  console.log(`Threshold = ${threshold}`);

  const shares = [];
  for (let i = 0; i < threshold; i += 1) {
    await clearScreen();
    const shareMnemonicInput = await prompt(`Input the mnemonic of share ${i + 1}:\n`);
    const share = shareMnemonicInput.trim();
    shares.push(share);
  }
  const recoveredEntropy = Buffer.from(slip39.recoverSecret(shares));
  if (isVerifyMode) {
    const cosmosAddress = entropyToFirstCosmosAddress(recoveredEntropy);
    console.log(`The first Cosmos address should be ${cosmosAddress}.`);
  } else {
    await displayMnemonic(bip39.entropyToMnemonic(recoveredEntropy), { splits: threshold });
  }
}

main();
