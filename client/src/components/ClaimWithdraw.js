import React, { Component } from "react";
import AuctionContract from "../contracts/Auction.json";
import AuctionFactoryContract from "../contracts/AuctionFactory.json";
import NFTManageContract from "../contracts/NFTManage.json";
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class ClaimWithdraw extends Component{
    constructor(props){
        super(props)
        this.state = {
            currentAccount: '',
            auctions: [],
            factoryContract: null,
            NFTManageContract: null,
            timestamp: null
        }
        this.onClickWithdraw = this.onClickWithdraw.bind(this)
        this.getAllAuctions = this.getAllAuctions.bind(this)
        this.getAuction = this.getAuction.bind(this)
        this.onClickClaim = this.onClickClaim.bind(this)
    }

    componentDidMount = async () => {
        try {
            //Get network provider and web3 instance.
            const accounts = await this.props.web3.eth.getAccounts()

            // Get the contract instance.
            const networkId = await this.props.web3.eth.net.getId();
            const deployedNetwork_factory = AuctionFactoryContract.networks[networkId];
            const factoryInstance = new this.props.web3.eth.Contract(
                AuctionFactoryContract.abi,
                deployedNetwork_factory.address
            );

            const deployedNetwork_NFT = NFTManageContract.networks[networkId];
            const manageInstance = new this.props.web3.eth.Contract(
                NFTManageContract.abi,
                deployedNetwork_NFT.address
            );

            this.setState({currentAccount: accounts[0], factoryContract: factoryInstance, NFTManageContract: manageInstance}, this.getAllAuctions)
            this.timeID = setInterval(() => this.getAllAuctions(), 1000); 
        }catch (error){
            //Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    }

    componentWillUnmount() {
        clearInterval(this.timeID);
    }

    //Please notice that this function only gets those auctions ended or canceled
    getAllAuctions(){
        let contract = this.state.factoryContract;
        return new Promise((resolve, reject) => {
            return contract.methods.allAuctions().call().then(result => {
                return Promise.all(result.map(auctionAddr => this.getAuction(auctionAddr)))
            }).then(auctions => {
                var timestamp = new Date().getTime();
                //console.log(auctions)
                auctions = auctions.filter(auction => this.checkAuction(auction) === true)
                //console.log(auctions)
                this.setState({auctions: auctions, timestamp: timestamp}, resolve)
            })
        })
    }

    getAuction(auctionAddr) {
        const auction = new this.props.web3.eth.Contract(AuctionContract.abi, auctionAddr)
        const owner = auction.methods.owner().call()
        const token_ID = auction.methods.token_ID().call()
        const canceled = auction.methods.canceled().call()
        const end_time = auction.methods.end_time().call()
        const highest_bidder = auction.methods.highest_bidder().call()
        const withdraw_amount = auction.methods.LookUpFund().call({from:this.state.currentAccount})

        return Promise.all([ token_ID, owner, highest_bidder, end_time, canceled, withdraw_amount ]).then(async vals => {
            const [ token_ID, owner, highest_bidder, end_time, canceled, withdraw_amount ] = vals
            let ID = token_ID;
            let claimed = null;
            await this.state.NFTManageContract.methods.LookUpStatus(ID).call().then(res => {claimed = !res})
            return {
                contract: auction,
                owner: owner,
                address: auctionAddr,
                token_ID: token_ID,
                end_time: end_time,
                canceled: canceled,
                highest_bidder: highest_bidder,
                withdraw_amount: this.props.web3.utils.fromWei(withdraw_amount, 'ether'), 
                claimed: claimed
            }
        })
    }

    checkAuction (auction){
        //console.log(this.state.timestamp > auction.end_time)
        //console.log(auction.withdraw_amount)
        let status = 'Running'
        if (auction.canceled) {
            status = 'Canceled'
        } else if (this.state.timestamp > auction.end_time) {
            status = 'Ended'
        }

        if (status == "Canceled" && this.state.currentAccount !== auction.owner && auction.withdraw_amount > 0){
            return true
        } else if (status === "Ended" && auction.highest_bidder === this.state.currentAccount && auction.claimed === false){
            return true
        } else if (status === "Ended" && auction.owner === this.state.currentAccount && auction.withdraw_amount > 0){
            return true
        } else if (status === "Ended" && this.state.currentAccount !== auction.owner && this.state.currentAccount !== auction.highest_bidder
                    && auction.withdraw_amount > 0){
                        return true;
                    } 
        else{
            return false
        }
    }

    onClickWithdraw(auction) {
        let result = auction.contract.methods.Withdraw().send({from: this.state.currentAccount}).then(
            () => {this.getAllAuctions()}
        )
        if (result === false){
            alert("Fail to withdraw!")
        }
    }

    onClickReceive(auction) {
        auction.contract.methods.AuctionEnd().send({from: this.state.currentAccount}).then(
            () => {this.getAllAuctions()}
        )
        this.state.NFTManageContract.methods.approve(auction.highest_bidder, auction.token_ID).send({from: this.state.currentAccount});
    }

    onClickClaim(auction) {
        try {
            let manageContract = this.state.NFTManageContract
            manageContract.methods.transferToken(auction.token_ID, auction.owner, auction.highest_bidder).send({from: this.state.currentAccount}).then(
                () => {this.getAllAuctions()}
            )
        }catch (error){
            alert("Claim failed!")
        }
    }

    render() {
        return(
        <div align="center" className = "App">
            <h1>CLAIM AND WITHDRAW</h1>

            <Table>
                <thead>
                    <tr>
                        <td>Address</td>
                        <td>Token ID</td>
                        <td>Status</td>
                        <td>Highest bidder</td>
                        <td>Withdraw Amount</td>
                        <td>Actions</td>
                    </tr>
                </thead>
                <tbody>
                {this.state.auctions.map(auction => {
                    let status = 'Running'
                    if (auction.canceled){
                        status = 'Canceled'
                    }else if (this.state.timestamp > auction.end_time){
                        status = 'Ended'
                    }
                    return (
                        <tr key = {auction.address}>
                            <td>{auction.address.substr(0, 6)}</td>
                            <td>{auction.token_ID}</td>
                            <td>{status}</td>
                            <td>{auction.highest_bidder.substr(0, 6)}</td>
                            <td>{auction.withdraw_amount} ETH</td>
                            <td>
                                {auction.highest_bidder !== this.state.currentAccount && 
                                 auction.owner !== this.state.currentAccount &&
                                                            (status === 'Ended' || status === 'Canceled') &&
                                    <Button onClick={() => this.onClickWithdraw(auction)}>WITHDRAW</Button>
                                }
                                {auction.highest_bidder === this.state.currentAccount && (status === 'Canceled') &&
                                    <Button onClick={() => this.onClickWithdraw(auction)}>WITHDRAW</Button>
                                }
                                {auction.highest_bidder === this.state.currentAccount && (status === 'Ended') &&
                                    <Button onClick={() => this.onClickClaim(auction)}>CLAIM</Button>
                                }
                                {auction.owner === this.state.currentAccount && (status === 'Ended') &&
                                    <Button onClick={() => this.onClickReceive(auction)}>RECEIVE</Button>}
                            </td>
                        </tr>
                    )
                })}
                </tbody>
            </Table>
        </div>
        )
    }
}

export default ClaimWithdraw;