const bip39 = require('bip39');
const slip39 = require('slip39');
const {
  prompt,
  clearScreen,
  displayMnemonic,
  displayMnemonicAddresses,
  normalizeSlip39Mnemonic,
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
    while (true) {
      await clearScreen();
      const shareMnemonicRawInput = await prompt(`Input the mnemonic of share ${i + 1}:\n`);
      try {
        const shareMnemonicInput = normalizeSlip39Mnemonic(shareMnemonicRawInput);
        const share = shareMnemonicInput.trim();
        shares.push(share);
        break;
      } catch (err) {
        await prompt(`Error: ${err}, please try again.`);
      }
    }
  }
  await clearScreen();
  const recoveredEntropy = Buffer.from(slip39.recoverSecret(shares));
  const mnemonic = bip39.entropyToMnemonic(recoveredEntropy);
  if (isVerifyMode) {
    console.log('All mnemonic words entered. Please install Cosmos App on Ledger and verify the address.');
    await displayMnemonicAddresses(mnemonic);
  } else {
    await displayMnemonic(mnemonic, { splits: threshold });
  }
}

main();
