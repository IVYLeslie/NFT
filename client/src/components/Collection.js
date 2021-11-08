import React, {Component} from "react";
import NFTManageContract from "../contracts/NFTManage.json";
import ipfs from "../ipfs";
import Form from "react-bootstrap/Form"
import InputGroup from "react-bootstrap/InputGroup"
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

class Collection extends Component{
    constructor(props) {
        super(props)
        this.state = {
            currentAccount: '',
            collection: [],
            NFTManageContract: null,
            ipfsHash: null,
            buffer: null
        }
        this._inputName = ""
    }

    caputureFile = (event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => this.convertToBuffer(reader)
    }

    convertToBuffer = async(reader) => {
        const buffer = await Buffer.from(reader.result);
        this.setState({buffer})
    }

    onClickMint = async (event) => {
        event.preventDefault()
        var hash
        await ipfs.add(this.state.buffer, (err, ipfsHash) => {
            console.log(err, ipfsHash)
            hash = ipfsHash[0].hash
            console.log(hash)
            this.mint(hash)
        })
        this.setState({ ipfsHash: hash})
    }

    componentDidMount = async() => {
        try {
            // Use web3 to get the user's accounts.
            const accounts = await this.props.web3.eth.getAccounts();
        
            // Get the contract instance.
            const networkId = await this.props.web3.eth.net.getId();
            const deployedNetwork = NFTManageContract.networks[networkId];
            const manageInstance = new this.props.web3.eth.Contract(
                NFTManageContract.abi,
                deployedNetwork.address
            );     
            // Set web3, accounts, and contract to the state, and then proceed with an
            // example of interacting with the contract's methods.
            this.setState({ currentAccount: accounts[0], NFTManageContract: manageInstance}, this.getAllNFTs);
        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    }

    getAllNFTs() {
        let contract = this.state.NFTManageContract
        return new Promise((resolve, reject) => {
            return contract.methods.allNFTs().call().then(result => {
                return Promise.all( result.map(NFTobj => this.getNFT(NFTobj)) )
            }).then(NFTs => {
                console.log(NFTs)
                NFTs = NFTs.filter(NFT => this.checkNFT(NFT) === true)
                this.setState({ collection: NFTs }, resolve)
            })
        })
    }

    getNFT(NFTobj){
        //console.log(NFTobj)
        return NFTobj
    }

    checkNFT(NFT) {
        if (NFT.owner === this.state.currentAccount)    return true;
        else    return false;
    }

    mint(ipfsHash) {
        let contract = this.state.NFTManageContract
        let uri = "https://ipfs.io/ipfs/" + ipfsHash
        console.log(uri)
        contract.methods.createToken(this.state.currentAccount, uri, this._inputName).send({from: this.state.currentAccount})
        this.getAllNFTs()
        //alert("Mint success!")
    }

    render() {
        return (
            <div className="Collection">
                <div align = "center" className = "Mint">
                    <h1>MINT NFT</h1>
                </div>
                <div align="center">
                    <Row>
                        <Col></Col>
                        <Col>
                            <Form.Label>Choose a file to mint:</Form.Label>
                            <Form.Control type="file" onChange={(e) => this.caputureFile(e)}/>
                        </Col>
                        <Col>
                            <Form.Label>Name your NFT:</Form.Label>
                            <Form.Control type="text" onChange={(e) => this._inputName = e.target.value}/>
                        </Col>
                        <Col></Col>
                    </Row>
                    <br/>
                    <Button onClick={(e) => this.onClickMint(e)}>MINT</Button>
                    <br/><br/><br/>
                </div>
                <h1 align = "center">COLLECTION</h1>
                <Table>
                    <thead>
                        <tr>
                            <td>TOKEN ID</td>
                            <td>NAME</td>
                            <td>URI</td>
                            <td>MINTER</td>
                            <td>PREVIOUS OWNER</td>
                        </tr>
                    </thead>
                    <tbody>
                    {this.state.collection.map(NFT => {
                        //console.log(NFT.token_ID)
                        return (
                            <tr key = {NFT.token_ID}>
                                <td>{NFT.token_ID}</td>
                                <td>{NFT.name}</td>
                                <td><a href={NFT.URI}>{NFT.URI}</a></td>
                                <td>{NFT.minter.substr(0,6)}</td>
                                <td>{NFT.previous_owner.substr(0,6)}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </Table>
            </div>
        )
    }
}

export default Collection;