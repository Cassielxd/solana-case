import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProject } from "../target/types/my_project";
import { assert } from "chai";

describe("my-project", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.myProject as Program<MyProject>;
  const provider = anchor.AnchorProvider.env();

  const counter = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        counter: counter.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([counter])
      .rpc();

    console.log("Initialize transaction signature:", tx);

    const counterAccount = await program.account.counter.fetch(counter.publicKey);
    assert.ok(counterAccount.count.toNumber() === 0);
    assert.ok(counterAccount.authority.equals(provider.wallet.publicKey));
    console.log("Counter initialized with count:", counterAccount.count.toNumber());
  });

  it("Increments the counter", async () => {
    const tx = await program.methods
      .increment()
      .accounts({
        counter: counter.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Increment transaction signature:", tx);

    const counterAccount = await program.account.counter.fetch(counter.publicKey);
    assert.ok(counterAccount.count.toNumber() === 1);
    console.log("Counter after increment:", counterAccount.count.toNumber());
  });

  it("Increments the counter again", async () => {
    const tx = await program.methods
      .increment()
      .accounts({
        counter: counter.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Increment transaction signature:", tx);

    const counterAccount = await program.account.counter.fetch(counter.publicKey);
    assert.ok(counterAccount.count.toNumber() === 2);
    console.log("Counter after second increment:", counterAccount.count.toNumber());
  });

  it("Decrements the counter", async () => {
    const tx = await program.methods
      .decrement()
      .accounts({
        counter: counter.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Decrement transaction signature:", tx);

    const counterAccount = await program.account.counter.fetch(counter.publicKey);
    assert.ok(counterAccount.count.toNumber() === 1);
    console.log("Counter after decrement:", counterAccount.count.toNumber());
  });
});
