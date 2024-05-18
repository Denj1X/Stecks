import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";

import type { Staking } from "../typechain-types/contracts/Staking";
import type { Token } from "../typechain-types/contracts/Token";

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    staking: Staking;
	token: Token;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
}
