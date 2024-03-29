import { Fragment, ethers, AbiCoder } from 'ethers'
import { NftService } from '../nft/nft.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Service for interacting with the Web3 provider and smart contracts.
 */
/**
 * Service for interacting with Web3 and Ethereum smart contracts.
 */
@Injectable()
export class Web3Service {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor(
    private readonly nftService: NftService, 
    private readonly configService: ConfigService,
  ) {}

  /**
   * Set the Web3 provider endpoint.
   * @param endpoint The endpoint URL of the Web3 provider.
   */
  setProvider(endpoint: string): void {
    // Create a new provider
    this.provider = new ethers.JsonRpcProvider(endpoint);
    // Get the wallet from the private key
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * Get the contract instance from the contract address.
   * @param contractAddress The address of the contract.
   * @returns The contract instance.
   */
  getContractFromAddress(contractAddress: string, abi: any[]): ethers.Contract {
    return new ethers.Contract(contractAddress, abi, this.provider);
  }

  /**
   * Check if a given function is supported by the contract ABI.
   * @param abi The contract ABI.
   * @param functionName The name of the function to check.
   * @returns A boolean indicating whether the function is supported.
   */
  supportsFunction(abi: any[], functionName: string): boolean {
    return abi.some(item => item.name === functionName);
  }

  /**
   * Check if the given address is the owner of the NFT.
   * @param nftAddress The address of the NFT contract.
   * @param abi The contract ABI.
   * @param ownerAddress The address to check ownership against.
   * @param token_id The ID of the token.
   * @returns A promise that resolves to a boolean indicating ownership.
   */
  async isOwner(nftAddress: string, abi: any[], ownerAddress: string, token_id: number, ): Promise<boolean> {
    // Create a new contract instance
    const contract = new ethers.Contract(nftAddress, abi, this.provider);
    
    // Get the owner of the contract
    const owner = await contract.ownerOf(token_id);
    
    // Check if the owner address is the owner of the contract
    return owner.toLowerCase() === ownerAddress.toLowerCase();
  }

  /**
   * Get the metadata of the NFT.
   * @param nftAddress The address of the NFT contract.
   * @param abi The contract ABI.
   * @param tokenId The ID of the token.
   * @returns A promise that resolves to the metadata of the NFT.
   */
  async getNFTMetadata(nftAddress: string, abi: any[], tokenId: number): Promise<[string, string]> {

    // Create a new contract instance
    const contract = new ethers.Contract(nftAddress, abi, this.provider);
    
    // Get the token URI
    const tokenMetadata: string = await contract.tokenURI(tokenId);

    const parts = tokenMetadata.split("/");
    const tokenUri = parts.pop();
    const baseUri = parts.join("/");
    
    // Return the token URI
    return [baseUri, tokenUri];
  }

  /**
   * Get the base URI of the NFT contract.
   * @param nftAddress The address of the NFT contract.
   * @param abi The contract ABI.
   * @returns A promise that resolves to the base URI of the NFT contract.
   */
  async getNFTBaseURI(nftAddress: string, abi: any[]): Promise<string> {
      
    // Create a new contract instance
    const contract = new ethers.Contract(nftAddress, abi, this.provider);
    
    // Get the token URI
    const baseURI = await contract.getBaseURI();
    
    // Return the token URI
    return baseURI;
  }

  /**
   * Check if a token with the given ID is minted.
   * @param nftAddress The address of the NFT contract.
   * @param abi The contract ABI.
   * @param tokenId The ID of the token.
   * @returns A promise that resolves to a boolean indicating whether the token is minted.
   */
  async isMinted(nftAddress: string, abi: any[], tokenId: number): Promise<boolean> {
    // Create a contract instance
    const contract = new ethers.Contract(nftAddress, abi, this.provider);
    
    // Check if the token is minted
    const owner = await contract.ownerOf(tokenId);
    return owner.toLowerCase() !== ZERO_ADDRESS.toLowerCase();
  }

  /**
   * Mint a new NFT token.
   * @param nftAddress The address of the NFT contract.
   * @param abi The contract ABI.
   * @param ownerAddress The address of the token owner.
   * @param tokenId The ID of the token.
   * @returns A promise that resolves to the transaction hash of the minting operation.
   */
  async mintNFT(nftAddress: string, abi: any[], ownerAddress: string, tokenId: number): Promise<string> {
    // Get the contract address
    // Create a contract instance

    const contract = new ethers.Contract(nftAddress, abi, this.wallet);
    
    // Mint a new token
    const tx = await contract.mint(ownerAddress, tokenId);
    return tx.hash;
  }

  /**
   * Set the token URI of an NFT token.
   * @param nftAddress The address of the NFT contract.
   * @param abi The contract ABI.
   * @param tokenId The ID of the token.
   * @param tokenURI The URI of the token.
   * @returns A promise that resolves to the transaction hash of the setting operation.
   */
  async setTokenURI(nftAddress: string, abi: any[], tokenId: number, tokenURI: string): Promise<string> {
    const contract = new ethers.Contract(nftAddress, abi, this.wallet);
    
    // Set the token URI
    const tx = await contract.setTokenURI(tokenId, tokenURI);

    // Return the transaction hash
    return tx.hash;
  }

  /**
   * Set the base URI of the NFT contract.
   * @param nftAddress The address of the NFT contract.
   * @param abi The contract ABI.
   * @param baseURI The base URI of the NFT contract.
   * @returns A promise that resolves to the transaction hash of the setting operation.
   */
  async setBaseURI(nftAddress: string, abi: any[], baseURI: string): Promise<string> {
    const contract = new ethers.Contract(nftAddress, abi, this.wallet);
    
    // Set the base URI
    const tx = await contract.setBaseURI(baseURI);

    // Return the transaction hash
    return tx.hash;
  }

  /**
   * Get the current block number.
   * @returns A promise that resolves to the current block number.
   */
  async getBlockNumber(): Promise<number> {
    const blockNumber = await this.provider.getBlockNumber();
    return blockNumber;
  }

  /**
   * Get the bytecode of a contract at the given address.
   * @param address The address of the contract.
   * @returns A promise that resolves to the bytecode of the contract.
   */
  async getByteCode(address: string): Promise<string> {
    const bytecode = await this.provider.getCode(address);
    return bytecode;
  }

  /**
   * Deploy a contract from bytecode.
   * @param abi The contract ABI.
   * @param bytecode The bytecode of the contract.
   * @param constructorArgs The arguments for the constructor of the contract.
   * @returns A promise that resolves to the address of the deployed contract.
   */
  async deployFromByteCode(abi: any[], bytecode: string, constructorArgs: any[]): Promise<string> {
    const constructorFragment = abi.find((fragment) => fragment.type === "constructor");

    if (constructorFragment) {
      if (constructorArgs.length !== constructorFragment.inputs.length) {
        throw new Error("Invalid constructor arguments.");
      }
    }

    const factory = new ethers.ContractFactory(abi, bytecode, this.wallet);
    try {
      const contractDeployTransaction = await factory.getDeployTransaction(...constructorArgs);
      const gasEstimate = await this.provider.estimateGas(contractDeployTransaction);

      const contract = await factory.deploy(...constructorArgs, { gasLimit: gasEstimate });
      return contract.getAddress();
    }
    catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Call a function of a contract.
   * @param abi The contract ABI.
   * @param contractAddress The address of the contract.
   * @param functionName The name of the function to call.
   * @param args The arguments for the function.
   * @returns A promise that resolves to the result of the function call.
   */
  async callContractFunction(abi: any[], contractAddress: string, functionName: string, args: any[]): Promise<any> {
    const contract = new ethers.Contract(contractAddress, abi, this.wallet);

    // Find the function in the ABI
    const functionAbi = abi.find((item) => item.name === functionName);

    // Check if the function exists in the ABI
    if (!functionAbi) {
      throw new Error(`Function ${functionName} not found in the ABI.`);
    }

    // Check if the number of arguments matches the expected number of inputs in the ABI
    if (args.length !== functionAbi.inputs.length) {
      throw new Error(`Invalid number of arguments for function ${functionName}.`);
    }

    const result = await contract[functionName](...args);

    return result;
  }
}