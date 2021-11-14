import * as crypto from 'crypto';

class Transaction {
    constructor(
        public amount: number,
        public payer: string, //public key
        public payee: string //public key
    ) { }

    //serialize everything into strings to make cryptographic objects easier to work with
    toString() {
        return JSON.stringify(this);
    }
}

class Block {
    public nonce = Math.round(Math.random() * 999999999);

    //container for multiple transactions
    constructor(
        //compare hashes to see if two values are identical
        //this ensures that two blocks can be lineked together without being manipulated
        public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now()
    ) { }

    //getter function
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256'); //one way encryption
        hash.update(str).end();
        return hash.digest('hex');
    }

}

class Chain {
    public static instance = new Chain();

    chain: Block[];

    constructor() {
        //create coins
        this.chain = [new Block("null", new Transaction(21000000, 'genesis', 'satoshi'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    mine(nonce: number) {
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
                console.log(`Hash Cracked: ${solution}`);
                return solution;
            }
            solution += 1; //increment loop
        }

    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
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

class Wallet {
    public publicKey: string;
    public privateKey: string;

    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
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

//type in terminal: `npm run start`
