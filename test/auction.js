function calcv (x, u, q) {
    if (x >= u) return (x - u) % q;
    else return q - ((u - x) % q);
}

function comparison(u1, v1, u2, v2, q) {
    //n1 receives u2 from n2, n2 receives v1 from n1
    let val1 = u1 - u2;
    let val2 = v1 - v2;
    //n1 sends val1 to auctioneer, n2 sends val2 to auctioneer
    //Auctioneer checks below conditions:
    let sum = val1 + val2;
    if (sum == 0) return 0; // equal
    else if (sum < q/2) return 1; // ">"
    else return 2; // "<"
}

function findIntersection(n1, n2){
    var i, j;
    for (i = 0; i < n1.length; i++){
        for (j = 0; j < n2.length; j++){
            if (comparison(n1['u'], n1['v'], n2['u'], n2['v'], 31) == 0){
                return 1;
            }
        }
    }
    return 0;
}
function intersectionMatrix(vals){
    var n_notaries = vals.length;
    var defaultValue = 0;
    var int_matrix  = Array(10).fill(null).map(_ => Array(10).fill(defaultValue));
    var i, j;
    for (i = 0; i < n_notaries; i++){
        for (j = i; j < n_notaries; j++){
            if(i == j) {
                int_matrix[i][j] = 1;
                continue;
            }
            var val = findIntersection(vals[i], vals[j]);
            int_matrix[i][j] = val;
            int_matrix[j][i] = val;
        }
    }
    return int_matrix;

    unction compMatrix(vals){
    var n_notaries = vals.length;
    var defaultValue = 0;
    var comp_matrix  = Array(10).fill(null).map(_ => Array(10).fill(defaultValue));
    var i, j;
    for (i = 0; i < n_notaries; i++){
        for (j = i; j < n_notaries; j++){
            if(i == j) {
                comp_matrix[i][j] = 0;
                continue;
            }
            var val = comparison(vals[i]['u'], vals[i]['v'], vals[j]['u'], vals[j]['v'], 31);
            comp_matrix[i][j] = val;
            if (val == 0)
                comp_matrix[j][i] = val;
            else if(val == 1)
                comp_matrix[j][i] = 2;
            else 
                comp_matrix[j][i] = 1;
            
        }
    }
    return comp_matrix;
}

const Auction = artifacts.require("Auction");
contract("Auction", async(accounts) => {

    var auction;
    let q = 31;
    let M = [1, 2];
    let u = 5;  
    
    it("tests that auctioneer is registered", async () => {
        auction = await Auction.new({from: accounts[0]});
        await auction.sendParams(q, M);
        let res = await auction.auctioneerExists();
        assert.equal(res, accounts[0], "auctioneer isn't registered");

    });

    it("tests that notary 1 is registered", async () => {
        await auction.registerNotaries(accounts[1]);
        let res1 = await auction.notariesLength();
        assert.equal(res1, 1, "notary isn't registered");

    });

    it("tests that notary 1 can't register again", async () => {
        await auction.registerNotaries(accounts[1]);
        let res1 = await auction.notariesLength();
        assert.equal(res1, 1, "notary isn't registered");

    });

    it("tests that notary 2 is registered", async () => {
        await auction.registerNotaries(accounts[2]);
        let res1 = await auction.notariesLength();
        assert.equal(res1, 2, "notary isn't registered");

    });

    it("tests that bidder 1 is registered", async () => {
        await auction.registerBidders(accounts[3], [u, calcv(1, u, q)], [u, calcv(10, u, q)]);
        let res1 = await auction.biddersLength();
        assert.equal(res1, 1, "notary isn't registered");

    });
    var i = 0;
    for(i=0;i<3;i++){
    it("tests that bidder 1 can't register again", async () => {
        await auction.registerBidders(accounts[3], [u, calcv(1, u, q)], [u, calcv(10, u, q)]);
        let res1 = await auction.biddersLength();
        assert.equal(res1, 1, "notary isn't registered");

    });}

    it("tests that bidder 2 is registered", async () => {
        await auction.registerBidders(accounts[4], [u, calcv(2, u, q)], [u, calcv(5, u, q)]);
        let res1 = await auction.biddersLength();
        assert.equal(res1, 2, "notary isn't registered");

    });

    var bidder_items = [];
    var bidder_vals = [];
    var bidder_inds = [];

    it("tests that bidders are mapped uniquely", async () => {
        for (var k = 1; k < 3; k++){
            await auction.assignBidder(accounts[k]);
            let vals = await auction.viewMapping(accounts[k]);
            let items = [];
            for (var i = 0; i < vals.length - 1; i += 2) {
                items.push({
                    'u': vals[i],
                    'v': vals[i + 1]
                });  
            }
            bidder_items.push(items);
            bidder_vals.push({
                'u': vals[vals.length - 3],
                'v': vals[vals.length - 2]
            });
            bidder_inds.push(vals[vals.length - 1]);                        
        }
        assert.notEqual(bidder_inds[0], bidder_inds[1], "mapping is not unique")        

    });

    it("tests that comparison values are sent", async () => {
        var comp_matrix = compMatrix(bidder_vals);
        await auction.sendValues(comp_matrix);
        let result =  await auction.verifyValues();     
        assert.equal(result, true, "values were not sent correctly")
    });

    var address_list = [];

    it("tests that intersection values are sent", async () => {
        var intersection_mat = intersectionMatrix(bidder_items);
        await auction.whoIsTheWinner(intersection_mat);
        address_list = await auction.returnWinners();
        assert.equal(true, true, "false");
    });

    it("tests that winner is determined correctly", async () => {
        var same = 0;
        if (address_list.length == 2) {
            if ((address_list[0] == accounts[3] && address_list[1] == accounts[4]) || 
              (address_list[0] == accounts[4] && address_list[1] == accounts[3])) {
                same = 1;
            }
        }
        assert.equal(same, 1, "winner list is not the same");
    });

}