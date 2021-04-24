# Usage

`node index.js`

Generate or input a mnemonic, then split the mnemonic to n shares, such that k shares can recover the mnemonic.

`node recover.js [--recover / --verify]`

Recover the mnemonic from the k shares. For recovering the mnemonic, please use `--recover`; if just for verification, use `--verify` to only show the addresses of the recovered mnemonic but not the actual mnemonic itself.
