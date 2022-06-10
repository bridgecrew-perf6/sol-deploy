import solc from "solc";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import FormData from "form-data";
import axios from "axios";
import flatten from "truffle-flattener";

// async function flattens() {
//     const res = await flatten([path.resolve("./contracts/NFT.sol")], __dirname);
//     fs.writeFileSync("./NFT.sol", res);
//     console.log("flattened");
// }

// flattens();

const input = {
    language: "Solidity",
    sources: {
        "NFT.sol": {
            content: fs.readFileSync(path.resolve("./contracts/NFT.sol"), "utf-8"),
        },
    },
    settings: {
        optimizer: {
            enabled: true,
        },
        outputSelection: {
            "*": {
                "*": ["*"],
            },
        },
    },
};

function findImports(filepath: string) {
    return {
        contents: fs.readFileSync(path.join("node_modules", filepath), "utf-8"),
    };
}

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

const assembly = output.contracts["NFT.sol"].NFT.evm.assembly;

// const translation = translate.prettyPrintLegacyAssemblyJSON(assembly, input.sources["NFT.sol"]);
// fs.writeFileSync("./trans.json", translation);
// console.log(translation);

const abi = output.contracts["NFT.sol"].NFT.abi;
const bytecode = output.contracts["NFT.sol"].NFT.evm.bytecode.object;

const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
const signer = new ethers.Wallet("a589ade868c6d02880781bc72f58e757a7003131ac83311492fdfc3a18328058", provider);

const factory = new ethers.ContractFactory(abi, bytecode, signer);

async function deploy() {
    try {
        console.log("STARTED");

        const contract = await factory.deploy();
        console.log(contract.address);
        await contract.deployTransaction.wait();
        console.log("DEPLOYED");

        await verify({
            contractAddress: contract.address,
            contractName: "NFT",
            sourceCode: input,
        });
    } catch (err) {
        console.error(err);
    }
}

async function verify({ contractAddress, contractName, sourceCode }) {
    const compilerVersion = "v" + solc.version().split(".").splice(0, 4).join(".");
    const data = new FormData();
    data.append("apiKey", "MWNYZ485ZYTI2GTZT1EKDSTKHCIF836PUX");
    data.append("module", "contract");
    data.append("action", "verifysourcecode");
    data.append("sourceCode", sourceCode);
    data.append("contractaddress", contractAddress);
    data.append("codeformat", "solidity-standard-json-input");
    data.append("contractname", contractName);
    data.append("compilerversion", compilerVersion);
    data.append("optimizationUsed", 1);

    const res = await axios.post("https://api-testnet.bscscan.com/api", data, { headers: data.getHeaders() });
    console.log(res.data);
}

verify({
    contractAddress: "0xA2d4349742ae5ba6119910D2f2F434DC5CCE88A6",
    contractName: "NFT.sol:NFT",
    sourceCode: JSON.stringify(input),
});
// deploy();

// console.log(output.contracts["NFT.sol"].NFT.evm.bytecode.generatedSources);
