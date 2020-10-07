const bip39 = require('bip39');
const slip39 = require('slip39');
const crypto = require('crypto');
const assert = require('assert');

const {
  prompt,
  clearScreen,
  entropyToFirstCosmosAddress,
  displayMnemonic,
  normalizeSlip39Mnemonic
} = require('./utils.js');

function entropyFromInput(mnemonicInput) {
  const mnemonicInputTrimmed = mnemonicInput.trim();
  if (mnemonicInputTrimmed === '') {
    console.log('Got empty mnemonic, generating one.');
    return crypto.randomBytes(32);
  } else {
    if (!bip39.validateMnemonic(mnemonicInputTrimmed)) {
      throw new Error('Invalid mnemonic');
    }
    console.log('Got mnemonic.');
    const entropyHex = bip39.mnemonicToEntropy(mnemonicInputTrimmed);
    const entropy = Buffer.from(entropyHex, 'hex');
    const cosmosAddress = entropyToFirstCosmosAddress(entropy);
    console.log(`The first Cosmos address from this mnemonic should be ${cosmosAddress}.`);
    return entropy;
  }
}

function combinations(arr, n) {
  switch (n) {
    case 0:
      return [];
    case 1:
      return arr.map((x) => [x]);
    default:
      return arr.flatMap((x, i) => combinations(arr.slice(i + 1), n - 1).map((subComb) => [x, ...subComb]));
  }
}

function checkRecover(shareHolders, entropy) {
  const expected = entropy.toString('hex').toUpperCase();
  for (const shareSubset of combinations(shareHolders, shareHolders[0].threshold)) {
    const shares = shareSubset.reduce((acc, shareHolder) => acc.concat(shareHolder.mnemonic), []);
    const recoveredSecret = slip39.recoverSecret(shares);
    assert(Buffer.from(recoveredSecret).toString('hex').toUpperCase() === expected);
  }
}

async function main() {
  const mnemonicInput = await prompt(
    'If you wish to use custom mnemonic instead of generating one, ' + 
    'please input and press enter, otherwise just leave it empty:\n',
  );
  await clearScreen();
  const entropy = entropyFromInput(mnemonicInput);

  const totalSharesInput = await prompt('Input the total number of shares: ');
  const totalShares = Number.parseInt(totalSharesInput, 10);
  if (!Number.isSafeInteger(totalShares) || totalShares <= 1) {
    throw new Error('Invalid input on total number of shares');
  }
  console.log(`Total number of shares = ${totalShares}`);

  const thresholdInput = await prompt('Input the share threshold: ');
  const threshold = Number.parseInt(thresholdInput, 10);
  if (!Number.isSafeInteger(threshold) || threshold <= 1 || threshold > totalShares) {
    throw new Error('Invalid input on threshold');
  }
  console.log(`Threshold = ${threshold}`);

  const shareHolders = [];
  for (let i = 0; i < totalShares; i += 1) {
    const nameInput = await prompt(`Input the name of share holder ${i + 1}: `);
    const name = nameInput.trim();
    shareHolders.push({ name, threshold, path: `r/0/${i}` });
  }

  await prompt('Press Enter to generate the shares, then copy them one by one.');

  const groups = [[threshold, totalShares]]; // 1-of-1 in level 1, threshold-of-totalShares in level 2
  const slip = slip39.fromArray(Array.from(entropy), { groups });
  for (let i = 0; i < totalShares; i += 1) {
    while (true) {
      await clearScreen();
      const shareHolder = shareHolders[i];
      await prompt(`Share holder ${i + 1}: ${shareHolder.name}, please press Enter and show the mnemonic of your share.`);
      console.log('================================================================================')
      const mnemonic = slip.fromPath(shareHolder.path).mnemonics;
      const mnemonicWords = mnemonic[0].split(/\s+/g);
      for (let i = 0; i < mnemonicWords.length; i += 8) {
        console.log(mnemonicWords.slice(i, i + 8).map((word) => word.padEnd(10)).join(''));
      }
      console.log('================================================================================')
      shareHolder.mnemonic = mnemonic;
      await prompt('Please write down the mnemonic words, then press Enter to begin verifying the written mnemonic words.');
      await clearScreen();
      const rawMnemonicInput = await prompt('Please input the mneomnic word you just copied, then press Enter:\n');
      try {
        const mnemonicInput = normalizeSlip39Mnemonic(rawMnemonicInput);
        if (mnemonicInput !== mnemonic[0]) {
          throw new Error('Mnemonic words not match');
        }
        await clearScreen();
        await prompt('Mnemonic words verified. Press Enter to move to next share holder.');
        break;
      } catch (err) {
        await prompt(`Error: ${err}, please try again.`);
      }
    }
  }

  await clearScreen();
  checkRecover(shareHolders, entropy);

  await displayMnemonic(bip39.entropyToMnemonic(entropy), { shareHolders });
}

main();
