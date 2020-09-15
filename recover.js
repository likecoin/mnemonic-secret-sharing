const bip39 = require('bip39');
const slip39 = require('slip39');
const { prompt, clearScreen, displayMnemonic } = require('./utils');

async function main() {
  const thresholdInput = await prompt('Input the share threshold: ');
  const threshold = Number.parseInt(thresholdInput, 10);
  if (!Number.isSafeInteger(threshold) || threshold <= 1) {
    throw new Error('Invalid input on threshold');
  }
  console.log(`Threshold = ${threshold}`);

  const shares = [];
  for (let i = 0; i < threshold; i += 1) {
    await clearScreen();
    const shareMnemonicInput = await prompt(`Input the mnemonic of share ${i}:\n`);
    const share = shareMnemonicInput.trim();
    shares.push(share);
  }
  const recoveredEntropy = Buffer.from(slip39.recoverSecret(shares));
  await displayMnemonic(bip39.entropyToMnemonic(recoveredEntropy), { splits: threshold });
}

main();
