const express = require('express');
var Web3 = require('web3');
var abi = require('../abi/erc.json');
const { Pool, Client } = require('pg');
require('dotenv').config();
const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
});

// optional: allow environment to specify port
const port = process.env.PORT || 5000;

// create server instance
const app = express();

// Add headers before the routes are defined
app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, OPTIONS, PUT, PATCH, DELETE'
	);
	res.setHeader(
		'Access-Control-Allow-Headers',
		'X-Requested-With,content-type'
	);
	next();
});

// console.log(process.env.MUMBAI_WS);

const getEvents = (provider, contracts) => {
	const web3 = new Web3(provider);
	let options = {
		fromBlock: null,
		address: process.env.CONTRACT_ADDRESS,
		topics: [],
	};

	let subscription = web3.eth.subscribe('logs', options);

	subscription.on('data', (event) => {
		console.log('event');
		console.log(event);
		const address = event.address;
		const hash = event.transactionHash;
		const contract = new web3.eth.Contract(abi, address);
		contract
			.getPastEvents(
				'allEvents',
				{
					fromBlock: 0,
					toBlock: 'latest',
				},
				function (error, events) {
					// console.log(events);
				}
			)
			.then(async (events) => {
				// console.log(events);
				const eventsArray = events.filter((e) => e.transactionHash === hash);
				for (var i = 0; i < eventsArray.length; i++) {
					var curr = eventsArray[i];
					console.log(curr);
					if (curr.event === 'TokenPriceChanged') {
						console.log('Price Change');
						try {
							if (events.returnValues.isBuyBeingModified) {
								const text = `update collections.collection_master cm set token_buy_price = $1  where cm.contract_address = $2 returning *;`;
								const values = [curr.returnValues.value, address];
								console.log(curr.returnValues.value);
								const query = await pool.query(text, values);
								console.log(query.rows);
							} else {
								const text = `update collections.collection_master cm set token_sell_price = $1 where cm.contract_address = $2 returning *;`;
								const values = [curr.returnValues.value, address];
								console.log(curr.returnValues.value);
								const query = await pool.query(text, values);
								console.log(query.rows);
							}

							// res.json({ a: query.rows });
						} catch (err) {
							console.log(err.stack);
						}
					} else if (curr.event === 'TokensBought') {
						console.log('TokensBought');
						try {
							const insert_order_query = `insert into collections.collection_orders (
							user_address, value, token_amount, date_time, block_number ,collection_address ,order_type ) values (
							$1, 
							$2, 
							$3, 
							$4,
							$5,
							$6,
							$7);`;
							const insert_order_values = [
								curr.returnValues.customer,
								curr.returnValues.amount * curr.returnValues.tokenPrice,
								curr.returnValues.amount,
								Date.now(),
								curr.blockNumber,
								address,
								'BUY',
							];
							const insert_order = await pool.query(
								insert_order_query,
								insert_order_values
							);
							// console.log(insert_order);
						} catch (err) {
							console.log(err.stack);
						}
					} else if (curr.event === 'TokensSold') {
						console.log('TokensSold');
						try {
							// const currentquery =
							// 	'select * from collections.collection_master cm where cm.contract_address = $1;';
							// const currentvalues = [address];
							// const current = await pool.query(currentquery, currentvalues);
							// let curr_items = current.rows[0].items;
							// let new_items = curr_items - curr.returnValues.amount;
							// const text = `update collections.collection_master cm set items = $1  where cm.contract_address = $2 returning *;`;
							// const values = [new_items, address];
							// const query = await pool.query(text, values);
							// console.log(query.rows);
							const insert_order_query = `insert into collections.collection_orders (
							user_address, value, token_amount, date_time, block_number ,collection_address ,order_type ) values (
							'$1', 
							'$2', 
							'$3', 
							'$4',
							'$5,
							'$6,
							'$7';`;
							const insert_order_values = [
								curr.returnValues.customer,
								curr.returnValues.amount * curr.returnValues.tokenPrice,
								curr.returnValues.amount,
								Date.now(),
								curr.blockNumber,
								address,
								'SELL',
							];
							const insert_order = await pool.query(
								insert_order_query,
								insert_order_values
							);
							// console.log(insert_order.rows);
						} catch (err) {
							console.log(err.stack);
						}
					}
				}
			});
	});
	subscription.on('changed', (changed) => console.log(changed));
	subscription.on('error', (err) => {
		throw err;
	});
	subscription.on('connected', (nr) => {
		console.log('connected');
		console.log(web3.currentProvider.url);
		console.log(nr);
	});
};

const Loop = async () => {
	try {
		const query = 'select * from collections.collection_master;';
		// console.log(query);
		const data = await pool.query(query);
		// console.log(data.rows);
		let MUMBAI_CONTRACT_ADDRESS = data.rows.filter((e) => {
			if (e.collection_chain == 'MUMBAI') return e;
		});
		let ETH_CONTRACT_ADDRESS = data.rows.filter((e) => {
			if (e.collection_chain == 'RINKEBY') return e;
		});
		MUMBAI_CONTRACT_ADDRESS = MUMBAI_CONTRACT_ADDRESS.map(
			(e) => e['contract_address']
		);
		ETH_CONTRACT_ADDRESS = ETH_CONTRACT_ADDRESS.map(
			(e) => e['contract_address']
		);
		getEvents(process.env.ETH_WS, ETH_CONTRACT_ADDRESS);
		// getEvents(process.env.MUMBAI_WS, MMBAI_CONTRACT_ADDRESS);
	} catch (e) {
		console.log(e);
	}
};

// Route to get orders placed in the contract
app.get('/getOwners/:id', async (req, res) => {
	try {
		const address = req.params.id;
		const order_query =
			'select * from collections.collection_orders cm where cm.collection_address = $1;';
		const order_values = [address];
		const orders = await pool.query(order_query, order_values);

		res.json({
			orders: orders.rows,
		});
	} catch (e) {
		console.log(e);
	}
});

// Route to get orders placed by the user
app.get('/getOrders/:id', async (req, res) => {
	try {
		const address = req.params.id;
		const order_query =
			'select * from collections.collection_orders cm where cm.user_address = $1;';
		const order_values = [address];
		const orders = await pool.query(order_query, order_values);

		res.json({
			orders: orders.rows,
		});
	} catch (e) {
		console.log(e);
	}
});

// Trial Route
app.get('/a', async (req, res) => {
	try {
		const currentquery =
			'select * from collections.collection_master cm where cm.contract_address = $1;';
		const currentvalues = [CONTRACT_ADDRESS];
		const current = await pool.query(currentquery, currentvalues);
		console.log(current.rows[0]);
		let curr_items = current.rows[0].items;
		// res.json({ a: query.rows });
	} catch (err) {
		console.log(err.stack);
	}
});

// start the server
app.listen(port, () => console.log(`Listening on port ${port}`));

Loop();
