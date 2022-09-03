
# Introduction to NFT

This project is my attempt to understand and learn about NFTs and web3 envirnment.
Through this project, I learned about several smart contracts, especially ERC-721.

Learned about how decentralized apps work, and how they can bring a revoltuion. In the present technolgies, 
the runtime of all blockchain related queries if significantly high which makes them slow for production level apps
To counter this, a workaround is storing relevant data in sql databases which I felt destroys the whole purpose of
decentralized internet. Search of better alternatives introduced me to [The Graph](https://thegraph.com/explorer/) subgraphs
which index blockchain points to increase the run time of future queries. 
## Installation

Dapp

```bash
cd dapp
yarn install
yarn run start
```

subgraph
```bash
cd subgraph
yarn install
yarn build
yarn deploy
```
    
## Features
This repository conatins two sub repositories.
- dapp
- subgraph

Dapp repository contain basic dapp app where user can provide smart contract address, query information from blockchain
and store it a postgres database

Subgraph repository contain application of The graph subgraph, where user can build and deploy
his own subgraph and use graphql schema to query the data


## 🚀 About Me
I'm final year undergraduate at IIT Kanpur. Web3 technolgy has been in news for long time now and I used this project to learn about them

I like solving problems faced in my daily life through my coding skills. Whether its 
- [Minlinks](https://github.com/yash03112000/minlink) - A platform to save and share links in today's world
- [Mafia](https://github.com/yash03112000/mafia) - A online version of popular game to play with friends when we can't play in person due to pandemic

I prefer framing the problem and start working to solve them
Vist my [IITK](https://home.iitk.ac.in/~yashag/) homepage to know more about my work

Feel free to contact me at yashag@iitk.ac.in to discuss more about my and your interest, especially about this platform.
