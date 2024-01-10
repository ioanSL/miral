import { Controller, Get, Param } from '@nestjs/common';
import { NftService } from './nft/nft.service';
import { Web3Controller } from './web3/web3.controller';
import { Web3Service } from './web3/web3.service';

/**
 * Controller for handling login requests.
 */
@Controller('login')
export class AppController {
  private readonly L1WebService: Web3Service;
  private readonly L2WebService: Web3Service;

  constructor(
    private readonly web3Controller: Web3Controller,
    private readonly nftService: NftService,
  ) {
    this.L1WebService = this.web3Controller.getL1WebService();
    this.L2WebService = this.web3Controller.getL2WebService();
  }

  /**
   * Handles the login request.
   * @param owner_address - The address of the owner.
   * @param nft_address - The address of the NFT.
   * @param token_id - The ID of the token.
   * @returns A Promise that resolves to the login response.
   */
  @Get(':owner_address/:nft_address/:token_id')
  async login(
    @Param('owner_address') owner_address: string, 
    @Param('nft_address') nft_address: string,
    @Param('token_id') token_id: number,
  ): Promise<any> {

    const isOwner = this.L1WebService.isOwner(nft_address, owner_address, token_id);

    if (isOwner) {
      // TODO: Read nft metadata
      const metadata = await this.L1WebService.getNFTMetadata(nft_address, token_id);
      // console.log(metadata);
      const [baseUri, tokenUri] = metadata.split("/");

      const isDeployed = await this.nftService.findOne(nft_address);
      
      if (isDeployed) {
        // Mint new token
        console.log("Minting new token");
        await this.L2WebService.mintNFT(nft_address, owner_address, token_id);
        await this.L2WebService.setTokenURI(nft_address, token_id, tokenUri);
      } else {
        // Deploy new contract
        console.log("Deploying new contract");
        const newContractAddress = await this.L2WebService.deploy(nft_address, baseUri);
        // Mint new token
        console.log("Minting new token");
        await this.L2WebService.mintNFT(newContractAddress, owner_address, token_id);
        await this.L2WebService.setTokenURI(newContractAddress, token_id, tokenUri);
      }
      return {
        "addr": owner_address,
        "owns": nft_address,
        "token": token_id,
      };
    } else {
      return {"error": "Not the owner of the NFT"};
    }
  }
}