import React, { Component } from "react";
import MarketPlace from "./components/MarketPlace";
import ClaimWithdraw from "./components/ClaimWithdraw";
import Collection from "./components/Collection";
import 'bootstrap/dist/css/bootstrap.min.css';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import getWeb3 from "./getWeb3";

class App extends Component {
  constructor(props){
    super(props)
    this.state = {web3: null}
  }
  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      
      this.setState({web3: web3});
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };
  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <Tabs id="App_tab" className="mb-3">
      <Tab eventKey="Marketplace" title="MARKETPLACE">
        <MarketPlace web3 = {this.state.web3}/>
      </Tab>
      <Tab eventKey="Claim_Withdraw" title="CLAIM AND WITHDRAW">
        <ClaimWithdraw web3 = {this.state.web3}/>
      </Tab>
      <Tab eventKey="Collection" title="COLLECTION">
        <Collection web3 = {this.state.web3}/>
      </Tab>
    </Tabs>
    );
  }
}

export default App;
