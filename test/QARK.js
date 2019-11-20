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

    it('should sell 3 500 QARK from Exchange to IEO buyer', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.seller.ieo,
            to: acc.buyer.ieo,
            amount: '3500',
            total: '3500',
            locked: '0'
        }));
    });
    
    it('should sell 5 000 QARK from Exchange to privBuyer', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.seller.ieo,
            to: acc.buyer.priv,
            amount: '5000',
            total: '2005000',
            locked: '2000000'
        }));
    });
    
    it('should transfer 500 QARK from ieoBuyer to privBuyer', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.buyer.ieo,
            to: acc.buyer.priv,
            amount: '500',
            total: '2005500',
            locked: '2000000'
        }));
    });
    
    it('should let privBuyer transfer unlocked balance during public sale', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.buyer.priv,
            to: acc.buyer.ieo,
            amount: '4000',
            total: '7000',
            locked: '0'
        }));
    });
    
    it('should not let privBuyer transfer locked balance during public sale', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.buyer.priv,
            to: acc.buyer.ieo,
            amount: '1501', //1500 would be OK!
            expectError: 'Not enough unlocked tokens!'
        }));
    });
    
    
    it('should let ieo buyer to transfer during public sale', async () => {
        const instance = await QARK.deployed();
        assert(await utils.transferTest(instance, {
            from: acc.buyer.ieo,
            to: acc.random('someRecipient'),
            amount: '330', //1500 would be OK!
            total: '330',
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
    
    it('should transfer unlocked balance from private buyer to random buyer', async () => {
        const instance = await QARK.deployed();
        
        assert(await utils.transferTest(instance, {
            from: acc.buyer.priv,
            to: acc.random('privateSellerAndRateLow'),
            amount: '1500',
            total: '1500',
            locked: '0'
        }));
    });
    
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
    
});

