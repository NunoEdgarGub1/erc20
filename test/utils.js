const ethers = require('ethers');
const crypto = require('crypto');

module.exports = {
    
    acc: accounts => {
        const accMap =  {
            owner: accounts[0],
            management: accounts[1],
            reserve: accounts[2],
            centrum: accounts[3],
            rateUpdater: accounts[4],
            seller: {
                priv: accounts[5],
                ieo: accounts[6]
            },
            buyer: {
                priv: accounts[7],
                ieo: accounts[8],
                pub: accounts[9]
            },
            random: seed => {
                return (new ethers.Wallet(crypto.createHash('sha256').update(seed).digest('hex'))).address;
            }
        };
        console.log(accMap);
        return accMap;
    },
    
    bn: input => {
        return ethers.utils.bigNumberify(input);
    },
    
    eth: input => {
        return ethers.utils.parseEther(input).toString();
    },
    
    balance: async (instance, address) => {
        const result = {
            unlocked: await instance.balanceOf(address),
            locked: await instance.lockedBalanceOf(address)
        };
        result.total = result.unlocked.toString();
        result.locked = result.locked.toString();
        return result;
    },
    
    transferTest: async (instance, options) => {
        
        //IF WE NEED TO DELAY
        if(options.delay){
            await timeout(options.delay);
        }
        
        //MAKE THE TRANSFER FROM PRIVATE SELLER
        try{
            await instance.transfer(options.to, module.exports.eth(options.amount), { from: options.from });
        }catch(err){
            if(options.expectError && err.reason && options.expectError.trim() === err.reason.trim()){
                return true;
            }
            throw new Error(JSON.stringify({
                expectError: options.expectError ? options.expectError : 'None', 
                actualError: err.reason,
            }, null, 8));
        }
        
        options.total = options.total ? options.total : '0';
        options.locked = options.locked ? options.locked : '0';
        
        let balance = await module.exports.balance(instance, options.to);

        //BALANCE SHOULD EQUAL THE TRANSFERRED AMOUNT, NO LOCKS
        const result = balance.total === module.exports.eth(options.total) && balance.locked === module.exports.eth(options.locked);
        if(result !== true){
            throw new Error(JSON.stringify({
                realTotal: balance.total, 
                wantTotal: module.exports.eth(options.total), 
                realLockd: balance.locked, 
                wantLockd: module.exports.eth(options.locked)
            }, null, 8));
        }
        return result;
    }
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
