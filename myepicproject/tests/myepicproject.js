const anchor = require('@project-serum/anchor');

const { SystemProgram } = anchor.web3;

const main = async () => {
  console.log("Starting tests...");

  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Myepicproject;

  const baseAccount = anchor.web3.Keypair.generate();

  const tx = await program.rpc.initialize({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  });

  console.log("Your transaction signature", tx);

  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('Gif count', account.totalGifs.toString())


  await program.rpc.addGif("https://media3.giphy.com/media/MuAz5ozYsaC7rkRUe2/200.webp?cid=ecf05e47787k6a125k4aya0f0hsuqvnmygqmlmz87unxtal3&rid=200.webp&ct=g", {
    accounts: {
      baseAccount: baseAccount.publicKey,
    }
  });

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('Gif count', account.totalGifs.toString())

  console.log('Gif list', account.gifList)
}

const runMain = async() => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();