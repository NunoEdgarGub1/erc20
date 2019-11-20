const QARK = artifacts.require('QARK');
const utils = require('./utils');

contract('QARK', async accounts => {

    const acc = utils.acc(accounts);

    // INITIALIZATION

    it('should create contract with 333 333 000 QARK supply', async () => {
        const instance = await QARK.deployed();
        let balance = await instance.balanceOf(acc.owner);
        let totalSupply = await instance.totalSupply();
        assert.equal(totalSupply.toString(), utils.eth('333333000'));
        assert.equal(balance.toString(), '0');
    });

    it('should initialize privSeller with 133 333 200 QARK balance', async () => {
        const instance = await QARK.deployed();
        await instance.setRoleAddress(0, acc.seller.priv);
        let balance = await instance.balanceOf(acc.seller.priv);
        assert.equal(balance.toString(), utils.eth('133333200'));
    });

    it('should initialize exchange with 88 88 800 QARK balance', async () => {
        const instance = await QARK.deployed();
        await instance.setRoleAddress(1, acc.seller.ieo);
        let balance = await instance.balanceOf(acc.seller.ieo);
        assert.equal(balance.toString(), utils.eth('88888800'));
    });

    it('should initialize management with 44 44 400 QARK balance', async () => {
        const instance = await QARK.deployed();
        await instance.setRoleAddress(2, acc.management);
        let balance = await instance.balanceOf(acc.management);
        let frozen = await instance.frozenBalanceOf(acc.management);
        assert.equal(frozen.toString(), utils.eth('44444400'));
        assert.equal(balance.toString(), utils.eth('44444400'));
    });

    it('should initialize centrum with 44 44 400 QARK balance', async () => {
        const instance = await QARK.deployed();
        await instance.setRoleAddress(3, acc.centrum);
        let balance = await instance.balanceOf(acc.centrum);
        assert.equal(balance.toString(), utils.eth('44444400'));
    });

    it('should initialize reserve with 22 22 200 QARK balance', async () => {
        const instance = await QARK.deployed();
        await instance.setRoleAddress(4, acc.reserve);
        let balance = await instance.balanceOf(acc.reserve);
        let frozen = await instance.frozenBalanceOf(acc.reserve);
        assert.equal(frozen.toString(), utils.eth('22222200'));
        assert.equal(balance.toString(), utils.eth('22222200'));
    });
    
    it('should set rateUpdater with 0 QARK balance', async () => {
        const instance = await QARK.deployed();
        await instance.setRoleAddress(5, acc.rateUpdater);
        let balance = await instance.balanceOf(acc.rateUpdater);
        assert.equal(balance.toString(), utils.eth('0'));
    });
    
    it('should have mapped all roles to proper addresses', async () => {
        const instance = await QARK.deployed();
        const roleMap = {
            0: acc.seller.priv,
            1: acc.seller.ieo,
            2: acc.management,
            3: acc.centrum,
            4: acc.reserve
        }
        let roleAddr;
        for (var i = 0; i < Object.keys(roleMap).length; i++) {
            roleAddr = await instance.getRoleAddress(i);
            assert.equal(roleAddr.toString(), roleMap[i]);
        }
    });
    
    it('should not transfer from frozen mgmt', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.management,
            to: acc.random('frozenManagementToRandom'),
            amount: '1000',
            total: '0',
            unlocked: '0',
            expectError: 'Frozen balance can not be spent yet, insufficient tokens!'
        }));
    });
    
    it('should not transfer from frozen reserve', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.reserve,
            to: acc.random('frozenReserveToRandom'),
            amount: '1000',
            total: '0',
            unlocked: '0',
            expectError: 'Frozen balance can not be spent yet, insufficient tokens!'
        }));
    });
    
    it('should sell 1 000 QARK from centrum', async () => {
        const instance = await QARK.deployed();

        assert(await utils.transferTest(instance, {
            from: acc.centrum,
            to: acc.random('initialCentrumBuyer'),
            amount: '1000',
            total: '1000',
            locked: '0'
        }));
    });

    // PRIVATE SALE

    it('should set public sale period', async () => {
        const instance = await QARK.deployed();
        const pubSaleStart = 1574035200; //OFFICIAL START DATE
        const pubSaleEnd = pubSaleStart + 60 * 60 * 24 * 30 * 2;
        const restrictionEnd = pubSaleEnd + 60 * 60 * 24 * 30 * 6

        //FROM NOW UNTIL THE OFFICIAL CLOSE TIME
        await instance.setTiming(pubSaleStart, pubSaleEnd, restrictionEnd);

        assert.equal(await instance.pubSaleStart(), pubSaleStart);
        assert.equal(await instance.pubSaleEnd(), pubSaleEnd);
        assert.equal(await instance.restrictionEnd(), restrictionEnd);
    });
    
    it('should not change exchange address', async () => {
        const instance = await QARK.deployed();
        const expectedError = 'Exchange address MUST not be updated!';
        let actualError;
        try {
            await instance.setRoleAddress(1, acc.random('maliciousExchangeReset'));
        } catch (e) {
            if(e && e.reason){
                actualError = e.reason;
            }
        }
        let balance = await instance.balanceOf(acc.random('maliciousExchangeReset'));
        assert.equal(actualError, expectedError);
        assert.equal(balance.toString(), '0');
    });

    it('should sell 2 000 000 QARK as private sale', async () => {
        const instance = await QARK.deployed();

        assert(await utils.transferTest(instance, {
            from: acc.seller.priv,
            to: acc.buyer.priv,
            amount: '2000000',
            total: '2000000',
            locked: '2000000'
        }));
    });
    
    it('should sell 1 000 000 QARK as private sale', async () => {
        const instance = await QARK.deployed();

        assert(await utils.transferTest(instance, {
            from: acc.seller.priv,
            to: acc.random('dummyPrivateBuyerAddress'),
            amount: '1000000',
            total: '1000000',
            locked: '1000000'
        }));
    });

    // PUBLIC SALE

    it('should start public sale', async () => {
        const instance = await QARK.deployed();
        const pubSaleStart = Math.floor(+new Date() / 1000) - 60; //1574035200; //OFFICIAL START DATE
        const pubSaleEnd = pubSaleStart + 60 * 60 * 24 * 30 * 2;
        const restrictionEnd = pubSaleEnd + 60 * 60 * 24 * 30 * 6

        //FROM NOW UNTIL THE OFFICIAL CLOSE TIME
        await instance.setTiming(pubSaleStart, pubSaleEnd, restrictionEnd);

        assert.equal(await instance.pubSaleStart(), pubSaleStart);
        assert.equal(await instance.pubSaleEnd(), pubSaleEnd);
        assert.equal(await instance.restrictionEnd(), restrictionEnd);
    });

    it('should sell 88 800 QARK from Exchange to IEO buyer', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.seller.ieo,
            to: acc.buyer.ieo,
            amount: '88800',
            total: '88800',
            locked: '0'
        }));
    });
    
    it('should sell 800 000 QARK from Exchange to privBuyer', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.seller.ieo,
            to: acc.buyer.priv,
            amount: '800000',
            total: '2800000',
            locked: '2000000'
        }));
    });
    
    it('should not let privBuyer transfer locked balance during public sale', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.buyer.priv,
            to: acc.random('lockedTokenTransferDuringIEO'),
            amount: '1000000',
            expectError: 'Not enough unlocked tokens!'
        }));
    });
    
    it('should let privBuyer transfer unlocked balance during public sale', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.buyer.priv,
            to: acc.random('unlockedTokenTransferDuringIEO'),
            amount: '800000',
            total: '800000',
            locked: '0'
        }));
    });
    
    it('should not let privBuyer transfer locked balance during public sale', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.buyer.priv,
            to: acc.random('unlockedTokenTransferDuringIEO'),
            amount: '100000',
            total: '0',
            locked: '0',
            expectError: 'Not enough unlocked tokens!'
        }));
    });
    
    it('should transfer 50000 QARK from ieoBuyer to privBuyer', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.buyer.ieo,
            to: acc.buyer.priv,
            amount: '50000',
            total: '2050000',
            locked: '2000000'
        }));
    });
    
    it('should let ieo buyer to transfer during public sale', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.buyer.ieo,
            to: acc.random('someRecipient'),
            amount: '30000', //1500 would be OK!
            total: '30000',
            locked: '0'
        }));
    });
    
    it('should close public sale', async () => {
        const instance = await QARK.deployed();
        const pubSaleStart = (Math.floor(+ new Date() / 1000)) - (60 * 60 * 24); //1574035200; //OFFICIAL START DATE
        const pubSaleEnd = Math.floor(+ new Date() / 1000) - 60; 
        const restrictionEnd = pubSaleEnd + 60 * 60 * 24 * 30 * 6
        
        //FROM NOW UNTIL THE OFFICIAL CLOSE TIME
        await instance.setTiming(pubSaleStart, pubSaleEnd, restrictionEnd);
        
        assert.equal(await instance.pubSaleStart(), pubSaleStart);
        assert.equal(await instance.pubSaleEnd(), pubSaleEnd);
        assert.equal(await instance.restrictionEnd(), restrictionEnd);
    });
    
    it('should update QARK/USD conversion rate after public sale', async () => {
        const instance = await QARK.deployed();
        
        //35 Cents = 0,35 USD
        const targetRate = 35;
        
        await instance.setRate(targetRate, { from: acc.rateUpdater });
        assert.equal(await instance.conversionRate(), targetRate);
    });
    
    it('should not transfer locked balance from private buyer to random buyer', async () => {
        const instance = await QARK.deployed();
        
        assert(await utils.transferTest(instance, {
            from: acc.buyer.priv,
            to: acc.random('privateSellerAndRateLow'),
            amount: '50001',
            expectError: 'Private token trading halted because of low market prices!'
        }));
    });
    
    it('should transfer unlocked balance from private buyer to random buyer', async () => {
        const instance = await QARK.deployed();
        
        assert(await utils.transferTest(instance, {
            from: acc.buyer.priv,
            to: acc.random('privateSellerAndRateLow'),
            amount: '50000',
            total: '50000',
            locked: '0'
        }));
    });
    
    it('should let ieo buyer to transfer 3 800 QARK after public sale', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.buyer.ieo,
            to: acc.buyer.priv,
            amount: '3800',
            total: '2003800',
            locked: '2000000'
        }));
    });
    
    it('should update QARK/USD conversion rate after public sale', async () => {
        const instance = await QARK.deployed();
        const targetRate = 40;
        
        await instance.setRate(targetRate, { from: acc.rateUpdater });
        assert.equal(await instance.conversionRate(), targetRate);
    });
    
    it('should let privBuyer transfer full balance w/o restrictions', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.buyer.priv,
            to: acc.random('transferOutAllFromPrivBuyer'),
            amount: '2003800',
            total: '2003800',
            locked: '2000000'
        }));
    });
    
    it('should close restrictions period', async () => {
        const instance = await QARK.deployed();
        const pubSaleStart = (Math.floor(+ new Date() / 1000)) - (60 * 60 * 48); //1574035200; //OFFICIAL START DATE
        const pubSaleEnd = Math.floor(+ new Date() / 1000) - (60 * 60 * 24); 
        const restrictionEnd = pubSaleEnd + 1;
        
        await instance.setTiming(pubSaleStart, pubSaleEnd, restrictionEnd);
        
        assert.equal(await instance.pubSaleStart(), pubSaleStart);
        assert.equal(await instance.pubSaleEnd(), pubSaleEnd);
        assert.equal(await instance.restrictionEnd(), restrictionEnd);
    });
    
    /*
    it('should not transfer locked balance from private buyer to random buyer', async () => {
        const instance = await QARK.deployed();
        
        assert(await utils.transferTest(instance, {
            from: acc.buyer.priv,
            to: acc.random('privateSellerAndRateLow'),
            amount: '1', //not even a single token should be transferrable
            expectError: 'Private token trading halted because of low market prices!'
        }));
    });
    
    it('should transfer from IEO buyer to random buyer', async () => {
        const instance = await QARK.deployed();
        
        assert(await utils.transferTest(instance, {
            from: acc.buyer.ieo,
            to: acc.random('iWillBuyFromIeoAccount'),
            amount: '200',
            total: '200',
            unlocked: '200'
        }));
    });
    */
});

