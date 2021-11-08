//var Auction = artifacts.require("./Auction.sol");
var AuctionFactory = artifacts.require("./AuctionFactory.sol");
var NFTManage = artifacts.require("./NFTManage.sol");

module.exports = function(deployer) {
  //deployer.deploy(Auction);
  deployer.deploy(AuctionFactory);
  deployer.deploy(NFTManage);
};
