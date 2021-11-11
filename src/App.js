import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';
import idl from './idl.json';
import BN from 'bn.js';
const anchor = require('@project-serum/anchor');

// SystemProgram is a reference to the Solana runtime
const { SystemProgram } = web3;

// Get our programs id from the idl file
const programID = new PublicKey(idl.metadata.address);

const network = clusterApiUrl('devnet');

const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = 'WallyWilliams2';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TWITTER_BUILDSPACE = `https://twitter.com/_buildspace`;

const App = () => {
  
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [tipValue, setTipValue] = useState('');
  const [gifList, setGifList] = useState([]);
  const [baseAccount, setBaseAccount] = useState(null);
  const [baseAccountBump, setBaseAccountBump] = useState(null);

  const checkIfWalletIsConnected = async () => {
        
    try {
      const { solana } = window;
      
      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!")

          //solana.on('connect', callback(response))

          const response = await solana.connect( {onlyIfTrusted: true });
          console.log(
            'Connected with public key:',
            response.publicKey.toString()
          );

          setWalletAddress(response.publicKey.toString());
        
        } else {
        alert('Solana object not found! Get a Phantom wallet');
        }
      }
    } catch (error) {
      console.log(error)
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
      
    if (solana) {  
      const response = await solana.connect();
      console.log('Connected with public key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onInputChange = (e) => {
    const { value } = e.target;
    setInputValue(value);
  };

  const onTipChange = (e) => {
    const { value } = e.target;
    setTipValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment
    );
    return provider;
  }

  const createGifAccount = async () => {
    try{
      console.log(baseAccount)
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      console.log(baseAccountBump)
      await program.rpc.initialize(new BN(baseAccountBump), {
        accounts: {
          baseAccount: baseAccount,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
      });

      console.log("Created a new BaseAccount w/ address:", baseAccount.toString())
      await getGifList();
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const sendTip = async(event) => {
    console.log("Your tip is on its way!")
    const { value } = event.target
    
    const owner = new web3.PublicKey(value);
    const tip = new anchor.BN(tipValue * web3.LAMPORTS_PER_SOL)
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log(provider.wallet.publicKey.toString());
      const tx = await program.rpc.sendTip(tip, {
        accounts: {
          user: provider.wallet.publicKey,
          to: owner,
          systemProgram: SystemProgram.programId,
        },
      });

      console.log("Tip was processed with transaction signature", tx);
    } catch (error) {
      console.log("Error sending tip:", error)
    }
  }

  const voteGif = async (event) => {
    let { value } = event.target
    value = JSON.parse(value)
    for (let i=0; i<value.voters.length; i++) {
      let bn = new BN(value.voters[i]._bn, 16)
      let b = new PublicKey(bn)
      console.log(b.toString())
    }
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.updateItem(value.gifLink, {
        accounts: {
          baseAccount: baseAccount,
          user: provider.wallet.publicKey,
        },
      });

      await getGifList()
    } catch (error) {
      console.log("Error voting for GIF:", error)
    }
  }

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    } 
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount,
          user: provider.wallet.publicKey,
        },
      });

      await getGifList()
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };


  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization for Gif Program Account
          </button>
        </div>
      )
    } else {
      return (
        <div className="connected-container">
          <input 
            type="text" 
            placeholder="Enter gif link!" 
            value={inputValue}
            onChange={onInputChange}
          />
          <button className="cta-button submit-gif-button" onClick={sendGif}> 
            Submit 
          </button>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} alt='Seinfeld GIF'/>
                <div className="my-2">
                  <span className="body-text justify-content-center">{`Votes: ${item.votes}`}</span>
                </div>
                <div className='d-flex justify-content-center'>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Enter tip amount (in SOL)"
                      onChange={onTipChange}
                    />
          
                    <button 
                      className='justify-content-center cta-button submit-gif-button'
                      value={item.userAddress.toString()}
                      onClick={sendTip}
                    >
                      Tip
                    </button>
                    <button 
                      className='me-btn justify-content-center gradientBorder'
                      value={JSON.stringify(item)} 
                      onClick={voteGif}
                    >
                      Upvote
                    </button>
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        </div>
      )
    }
  };

  useEffect(() => {
    
    const getBaseAccount = async () => {
      let account, bump = null;
      [account, bump] = await web3.PublicKey.findProgramAddress(
        [Buffer.from("seinfeld")],
        programID
      );
      setBaseAccount(account);
      setBaseAccountBump(bump);
    };
    getBaseAccount();
    
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad); // this will remove the eventListener on demounting to clean up
  }, []); // remember this empty is a way to run this code when this component mounts for the first time
  
  const getGifList = async() => {
    try{
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount);

      setGifList(account.gifList)
    } catch(error) {
      console.log("Error in getGifs:", error)
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}> 
        <div className="header-container">
          <p className="header">Seinfeld GIF Portal</p>
          <p className="sub-text">
            Relive your favourite Seinfeld moments with this Seinfeld themed GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          
        </div>
        {walletAddress && renderConnectedContainer()}
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <span className="footer-text">
            {`Built by `}
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >
              {` @${TWITTER_HANDLE}`}
            </a>
              {` on `}
            <a
              className="footer-text"
              href={TWITTER_BUILDSPACE}
              target="_blank"
              rel="noreferrer"
            >
              _buildspace
            </a>
          </span>
          <a className="footer-text" href="https://solana.com/">Powered by Solana</a>
          <img className="twitter-logo" src="https://pbs.twimg.com/profile_images/1428863362079854592/PjbUigJo_400x400.jpg" />
        </div>
      </div>
    </div>
  );
};

export default App;
