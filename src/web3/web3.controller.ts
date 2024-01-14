import {Body, Controller, Get, Header, Inject, Param, Post} from "@nestjs/common";
import { Web3Service } from "./web3.service";
import { NftService } from "src/nft/nft.service";
import { ChainType } from "src/filter/schemas/filter.schema";
import { Nft } from "src/nft/schemas/nft.schema";
import { ApiTags, ApiBody } from "@nestjs/swagger";

const INVALID_CHAIN_TYPE = {
    statusCode: 400,
    body: JSON.stringify({
        message: "Invalid chain type",
    })
}

const UNSUPPORTED_FUNCTION = {
    statusCode: 400,
    body: JSON.stringify({
        message: "Unsupported function",
    })
}

function successfullResult(result: any): any {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Successfull",
            result: result,
        })
    }
}

@Controller('web3')
@ApiTags('web3')
export class Web3Controller {

    constructor(
        @Inject('L1WebService') private readonly L1WebService: Web3Service,
        @Inject('L2WebService') private readonly L2WebService: Web3Service,
        private readonly nftService: NftService,
    ) {
    }

    getL1WebService(): Web3Service {
        return this.L1WebService;
    }

    getL2WebService(): Web3Service {
        return this.L2WebService;
    }

    @Post('callContract/:chainType/:nftAddress/:functionName')
    @ApiBody({type: Object})
    async callContract(
        @Param('chainType') chainType: string,
        @Param('nftAddress') nftAddress: string,
        @Param('functionName') functionName: string,
        @Body('args') args: any[],
    ): Promise<any> {
        const type = parseInt(chainType) as ChainType;
        const [abi, webService] = await this._getProviderData(type, nftAddress);

        if (abi) {
            const supported = webService.supportsFunction(abi, functionName);
            if (supported) {
                console.log(args);
                const isOwner = await webService.callContractFunction(abi, nftAddress, functionName, args);
                return successfullResult({owner: isOwner});
            } else {
                return UNSUPPORTED_FUNCTION;
            }
        } else {
            return INVALID_CHAIN_TYPE;
        }
    }

    async _getProviderData(chainType: ChainType, nftAddress: string): Promise<[any[], Web3Service]> {
        var contracts: Nft;
        var webService: Web3Service;
        switch (chainType) {
            case ChainType.L1:
                contracts = await this.nftService.findOneByL1Address(nftAddress);
                webService = this.L1WebService;
                break;
            case ChainType.L2:
                contracts = await this.nftService.findOneByL2Address(nftAddress);
                webService = this.L2WebService;
                break;
            default:
                return [null, null];
        }
        return [contracts.abi, webService];
    }
    
}