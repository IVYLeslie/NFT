import React, { Component } from "react";
import AuctionContract from "../contracts/Auction.json";
import AuctionFactoryContract from "../contracts/AuctionFactory.json";
import NFTManageContract from "../contracts/NFTManage.json";
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import FloatingLabel from "react-bootstrap/esm/FloatingLabel";

class MarketPlace extends Component {
  constructor(props) {
      super(props)

      this.state = {
          currentAccount: '',
          auctions: [],
          //auctionContract: null,
          factoryContract: null,
          NFTContract: null,
          //auctionEventListeners: {},
          timestamp: null,
          fomatted_time: null
      };

      this.onClickCreateAuction = this.onClickCreateAuction.bind(this)
      this.getAllAuctions = this.getAllAuctions.bind(this)
      this.getAuction = this.getAuction.bind(this)
      this.cancelAuction = this.cancelAuction.bind(this)
      this.onClickBid = this.onClickBid.bind(this)

      this._inputDate = null
      this._inputTime = null
      this._inputTokenID = null
      this._inputBidAmount = null
  }

  componentDidMount = async () => {
    try {
      // Use web3 to get the user's accounts.
      const accounts = await this.props.web3.eth.getAccounts();

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
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ currentAccount: accounts[0], factoryContract: factoryInstance, NFTContract: manageInstance}, this.getAllAuctions);
      this.timeID = setInterval(() => this.getAllAuctions(), 1000);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  componentWillUnmount() {
    clearInterval(this.timeID);
  }

  getAllAuctions() {
    let contract = this.state.factoryContract;
    return new Promise((resolve, reject) => {
      return contract.methods.allAuctions().call().then(result => {
          return Promise.all( result.map(auctionAddr => this.getAuction(auctionAddr)) )
      }).then(auctions => {
        var timestamp = new Date().getTime();
        var formatted_time = new Date(timestamp).toString();
        // console.log(formatted_time);
        // console.log(timestamp);
          // let auctionEventListeners = Object.assign({}, this.state.auctionEventListeners)
          // const unloggedAuctions = auctions.filter(auction => this.state.auctionEventListeners[auction.address] === undefined)
          // for (let auction of unloggedAuctions) {
          //     auctionEventListeners[auction.address] = auction.contract.LogBid({ fromBlock: 0, toBlock: 'latest' })
          //     auctionEventListeners[auction.address].watch(this.onLogBid)
          // }

          this.setState({ auctions: auctions, formatted_time: formatted_time, timestamp: timestamp }, resolve)
      })
    })
  }

  getAuction = async (auctionAddr) => {
    const auction = new this.props.web3.eth.Contract(AuctionContract.abi, auctionAddr)
    const owner = auction.methods.owner().call()
    const token_ID = auction.methods.token_ID().call()
    const highest_bid = auction.methods.highest_bid().call()
    const highest_bidder = auction.methods.highest_bidder().call()
    const canceled = auction.methods.canceled().call()
    const end_time = auction.methods.end_time().call()
    const my_bid = auction.methods.LookUpBid().call({from:this.state.currentAccount})
    
    return Promise.all([ owner, token_ID, end_time, highest_bid, highest_bidder, canceled, my_bid ]).then(async vals => {
        const [ owner, token_ID, end_time, highest_bid, highest_bidder, canceled, my_bid ] = vals
        let ID = token_ID;
        let URI = null;
        await this.state.NFTContract.methods.LookUpURI(ID).call().then(res => {URI = res})
        //console.log(URI);
        return {
            contract: auction,
            address: auctionAddr,
            owner: owner,
            token_ID: token_ID,
            end_time: end_time.toString(),
            highest_bid: this.props.web3.utils.fromWei(highest_bid, 'ether').toString(),
            highest_bidder: highest_bidder,
            canceled: canceled,
            my_bid: this.props.web3.utils.fromWei(my_bid, 'ether'),
            URI: URI
        }
    })
  }

  onClickCreateAuction() {
    const {currentAccount, factoryContract} = this.state;
    console.log(this._inputDate);
    console.log(this._inputTime);
    var end_time = Date.parse(this._inputDate + ' ' + this._inputTime);
    console.log(end_time);
    factoryContract.methods.createAuction(
        end_time,
        this._inputTokenID)
        .send({ from: currentAccount, gas: 3000000 }).then(_ => {this.getAllAuctions()})
    console.log(this._inputTokenID)
    this.state.NFTContract.methods.setOnSale(this._inputTokenID).send({from: currentAccount});
  }

  cancelAuction(auction) {
    auction.contract.methods.Cancel().send({ from: this.state.currentAccount }).then(_ => {
        this.getAllAuctions()
    })
    this.state.NFTContract.methods.setNotOnSale(auction.token_ID).send({from: this.state.currentAccount});
  }

  onClickBid(auction) {
    auction.contract.methods.Bid().send({from: this.state.currentAccount, 
      value: this.props.web3.utils.toWei((this._inputBidAmount - auction.my_bid).toString(), 'ether')}).then(_ => {
      this.getAllAuctions()});
  }

  render() {
    return (
      <div className="App">
        <div align="center" className="form-create-auction">
            <h1>CREATE AUCTION</h1>
            <div>
            <Row className="g-2">
              <Col></Col>
              <Col md>
                  <Form.Label>Choose end time:</Form.Label>
                  <FormControl size="sm" type="date" placeholder="END_DATE"
                    onChange = {e => {
                      this._inputDate = e.target.value
                    }}/>
                  <FormControl size="sm" type="time" placeholder="END_TIME"
                    onChange = {e => {
                      this._inputTime = e.target.value
                  }}/>
              </Col>
              <Col md>
                  <Form.Label>Input token ID:</Form.Label>
                  <FloatingLabel label="TOKEN ID">
                  <FormControl size="sm" type="number" placeholder="TOKEN ID"
                    onChange = {e => {
                      this._inputTokenID = e.target.value
                    }}/>
                  </FloatingLabel>
              </Col>
              <Col></Col>
            </Row>
            <br/><br/>
            <Button onClick={this.onClickCreateAuction}>CREATE</Button>
            </div>
        </div>
        <br/><br/><br/>
        <h1 align = "center">AUCTIONS</h1>
        <div align = "center">
            CURRENT TIME: {this.state.formatted_time}
        </div>
        <Table>
            <thead>
                <tr>
                    <td>Address</td>
                    <td>Token ID</td>
                    <td>URI</td>
                    <td>End Time</td>
                    <td>Highest Bid</td>
                    <td>Highest Bidder</td>
                    <td>Status</td>
                    <td>My Bid</td>
                    <td>Actions</td>
                </tr>
            </thead>
            <tbody>
            {this.state.auctions.map(auction => {
                //console.log(this.state.timestamp)
                let status = 'Running'
                if (auction.canceled) {
                    status = 'Canceled'
                } else if (this.state.timestamp > auction.end_time) {
                    status = 'Ended'
                }
                //console.log(auction.end_time)
                let date = new Date(parseInt(auction.end_time)).toString()
                return (
                    <tr key={auction.address}>
                      <td>{auction.address.substr(0, 6)}</td>
                      <td>{auction.token_ID}</td>
                      <td><a href={auction.URI}>{auction.URI}</a></td>
                      <td>{date}</td>
                      <td>{auction.highest_bid} ETH</td>
                      <td>{auction.highest_bidder.substr(0, 6)}</td>
                      <td>{status}</td>
                      <td>{auction.my_bid} ETH</td>
                      <td>
                          {auction.owner === this.state.currentAccount && (status === 'Running') &&
                              <Button onClick={() => this.cancelAuction(auction)}>CANCEL</Button>
                          }
                          {auction.owner != this.state.currentAccount && (status === 'Running') &&
                          <div>
                            <InputGroup className="mb-3" type="number"
                              onChange = {e => {
                                this._inputBidAmount = e.target.value
                              }}>
                              <FormControl
                                placeholder="BID AMOUNT"/>
                              <InputGroup.Text>ETH</InputGroup.Text>
                              <Button onClick={() => this.onClickBid(auction)}>BID</Button>
                            </InputGroup>
                          </div>
                          }
                      </td>
                  </tr>
                )
            })}
            </tbody>
          </Table>
      </div>
    );
  }
}

export default MarketPlace;
