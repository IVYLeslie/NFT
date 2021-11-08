// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTManage is ERC721URIStorage{
    struct NFT{
        address owner;
        address minter;
        address previous_owner;
        uint256 token_ID;
        string name;
        bool onSale;
        string URI;
        uint transtime;
        //address[] pre_owners;
    }
    
    struct auction{
        uint starting_price;
        uint  auc_ID;
        address payable owner;
        uint end_time;
        uint256  token_ID;
        bool ended;
        address  highest_bidder;
        uint highest_bid;
        uint counter;//number of bidders
    }
    
    mapping (uint=>uint) connect;//NFT->auction
    auction[] public auctions;
    NFT[] public NFTs;
    uint public ID_counter;
    uint public ID_auc_counter;

    constructor() ERC721("NFTManage", "NFT"){}

    event TokenCreated(address owner, uint256 token_ID);
    event TokenTransfered(uint256 token_ID, address from, address to);
    event HighestBidChanged(address bidder, uint bid);
    event AuctionEnded(address winner, uint price);
    //event AuctionCanceled();
    
    
    
    function _AUCcreate( uint _starting_price, uint _end_time, uint256 _token_ID)public {
        require(!NFTs[_token_ID].onSale,"already on sale!");
        require(_end_time>0,"wrong end_time!");
        require(NFTs[_token_ID].owner==msg.sender,"only the owner can create auctions!");
        auction memory newauc = auction(_starting_price,ID_auc_counter,payable(msg.sender),_end_time + block.timestamp,_token_ID,false,msg.sender,0,0);
        auctions.push(newauc);
        connect[_token_ID]=ID_auc_counter;
        ID_auc_counter +=1;
        NFTs[_token_ID].onSale=true;
        
    }
    
    function _AUClefttime(uint _auc_ID)public view returns(uint) {
        require(block.timestamp  < auctions[_auc_ID].end_time && !auctions[_auc_ID].ended,"the auction is already closed!");
        return auctions[_auc_ID].end_time-block.timestamp;
    }
    
    function _AUCBid(uint _token_ID) public payable{
        uint _auc_ID=connect[_token_ID];
        require(msg.sender!=auctions[_auc_ID].owner,"the owner cannot bid!");
        require(block.timestamp  < auctions[_auc_ID].end_time && !auctions[_auc_ID].ended,"the auction is already closed!");
        require(msg.value>auctions[_auc_ID].highest_bid && msg.value>auctions[_auc_ID].starting_price,"try a higher bid");
        
        if (auctions[_auc_ID].highest_bid == 0){
            auctions[_auc_ID].highest_bid = msg.value;
            auctions[_auc_ID].highest_bidder = msg.sender;
            
        }
        else {
            //如果出现更高价格，退回之前的最高价
            AUCWithdraw( _auc_ID,auctions[_auc_ID].highest_bidder);
        
            auctions[_auc_ID].highest_bidder = msg.sender;
            auctions[_auc_ID].highest_bid = msg.value;
        }
        auctions[_auc_ID].counter++;
        emit HighestBidChanged(auctions[_auc_ID].highest_bidder, auctions[_auc_ID].highest_bid);
        
    }
    
    function AUCWithdraw(uint _auc_ID, address to) public returns (bool){
        uint amount = auctions[_auc_ID].highest_bid;
        if (amount > 0){
            //auctions[_auc_ID].funds_of_bidder[to] = 0;
            if (!payable(to).send(amount)){
                auctions[_auc_ID].highest_bid= amount;
                return false;
            }
        }
        else {
            return false;
        }
        return true;
    }
    
    function _AUCtionEnd(uint _auc_ID) public payable {//在这里完成交付，需要手动切换到createauction的账户那里
        require(block.timestamp  >= auctions[_auc_ID].end_time && !auctions[_auc_ID].ended,"the auction is still open!");
        require(auctions[_auc_ID].owner==msg.sender,"only the owner can end auctions!");
        auctions[_auc_ID].ended = true;
        emit AuctionEnded(auctions[_auc_ID].highest_bidder, auctions[_auc_ID].highest_bid);
        
        auctions[_auc_ID].owner.transfer(auctions[_auc_ID].highest_bid);//change the value ex.ETH
        approve(auctions[_auc_ID].highest_bidder,auctions[_auc_ID].token_ID);
        uint _token_ID=auctions[_auc_ID].token_ID;
        NFTs[_token_ID].onSale = false;
        //_NFTtransfer(auctions[_auc_ID].token_ID, auctions[_auc_ID].owner, auctions[_auc_ID].highest_bidder);
       
    }
    
    function _NFTclaim(uint _token_ID)public {
        
        uint tmp = connect[_token_ID];
        require(msg.sender==auctions[tmp].highest_bidder,"you are not the highest_bidder!");
        _NFTtransfer(auctions[tmp].token_ID, auctions[tmp].owner, auctions[tmp].highest_bidder);
        //uint time=NFTs[_token_ID].transtime;
        //NFTs[_token_ID].pre_owners[time]=auctions[tmp].highest_bidder;
        
        NFTs[_token_ID].transtime++;
    }
    
    
    
    function _NFTcreate(address owner, string memory uri, string memory name) public{
        require(msg.sender == owner,"only could create NFT for yourself!");
        _safeMint(owner, ID_counter);
        _setTokenURI(ID_counter, uri);
        // address[] memory p;
        // p[0]=owner;
        NFT memory newNFT = NFT(owner, owner, owner, ID_counter, name, false, uri,1);
        NFTs.push(newNFT);
        ID_counter += 1;
        
        emit TokenCreated(owner, ID_counter);
    }
 
    function _NFTtransfer(uint256 _token_ID, address from, address to) public{
        require(_token_ID<ID_counter,"the wrong number!");
        address tmp = NFTs[_token_ID].owner;
        safeTransferFrom(from, to, _token_ID);
        NFTs[_token_ID].previous_owner = tmp;
        NFTs[_token_ID].owner = to;
        NFTs[_token_ID].onSale = false;
        emit TokenTransfered(_token_ID, from, to);
    }

    // function _setNFTOnSale(uint256 _token_ID, bool status) public{
    //     require(_token_ID<ID_counter,"the wrong number!");
    //     if (msg.sender != NFTs[_token_ID].owner) revert();
    //     if(status==true)
    //     NFTs[_token_ID].onSale = true;
    //     else if(status==false)
    //     NFTs[_token_ID].onSale = false;
    // }

    function _allNFTs() public view returns(NFT[] memory){
        return NFTs;
    }
    
    
    
    function _allauctions() public view returns(auction[] memory){
        return auctions;
    }
    
    function _showNFTonsale()public view returns(NFT[] memory){
        NFT[] memory NFTonsale;
        uint j=0;
        for(uint i=0;i<NFTs.length;i++){
            if(NFTs[i].onSale==true){
                NFTonsale[j++]=NFTs[i];
            }
        }
        return NFTonsale;
    }
    
    // function _showopenAUC()public view returns(auction[] memory){
    //     auction[] memory openauc;
    //     uint j=0;
    //     for(uint i=0;i<auctions.length;i++){
    //         if(auctions[i].ended==false){
    //             openauc[j++]=auctions[i];
    //         }
    //     }
    //     return openauc;
    // }
    
    function _showAUCstatus(uint _token_ID)public view returns(auction memory){
        return auctions[connect[_token_ID]];
    }

    // function _NFT_ifo(uint256 token_ID) public view returns(string memory,bool){
    //     return (NFTs[token_ID].URI,NFTs[token_ID].onSale);
    // }
}