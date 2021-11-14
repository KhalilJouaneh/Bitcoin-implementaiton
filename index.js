"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
class Transaction {
    constructor(amount, payer, //public key
    payee //public key
    ) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    //serialize everything into strings to make cryptographic objects easier to work with
    toString() {
        return JSON.stringify(this);
    }
}
class Block {
    //container for multiple transactions
    constructor(
    //compare hashes to see if two values are identical
    //this ensures that two blocks can be lineked together without being manipulated
    prevHash, transaction, ts = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
        this.nonce = Math.round(Math.random() * 999999999);
    }
    //getter function
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256'); //one way encryption
        hash.update(str).end();
        return hash.digest('hex');
    }
}
class Chain {
    constructor() {
        //create coins
        this.chain = [new Block("null", new Transaction(100, 'genesis', 'satoshi'))];
    }
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    mine(nonce) {
        /*
        attempt to find a number that when added to the nonce will produce a hash that starts with four zeros (0000).
        The only to figure it out is by bruteforcing every possible digit
        */
        let solution = 1;
        console.log("Mining...");
        while (true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substr(0, 4) === '0000') {
                console.log(`Solved Pluto: ${solution}`);
                return solution;
            }
            solution += 1; //increment loop
        }
    }
    addBlock(transaction, senderPublicKey, signature) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
        const newBlock = new Block(this.lastBlock.hash, transaction);
        this.chain.push(newBlock);
    }
}
Chain.instance = new Chain();
class Wallet {
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    sendMoney(amount, payeePublicKey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey); //this allows us to verify the identity with the private key without exposing it
        //add block to blockchain
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
//Usage example
const satoshi = new Wallet();
const khalil = new Wallet();
const saif = new Wallet();
satoshi.sendMoney(50, khalil.publicKey);
khalil.sendMoney(25, saif.publicKey);
saif.sendMoney(10, satoshi.publicKey);
console.log(Chain.instance);
