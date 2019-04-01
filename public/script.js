/* eslint-disable linebreak-style */
let LOAD_NUM = 4;
let watcher;

var pusher = new Pusher('02b7999f276f63cfba3d', {
	cluster: 'us2',
	encrypted: true
});

new Vue({
	el: "#app",
	data: {
		total: 0,
		products: [],
		cart: [],
		search: "dog",
		lastSearch: "",
		loading: false,
		results: [],
		pusherUpdate: false
	},
	mounted: function() {
		var vue = this;
		var channel = pusher.subscribe('cart');
		channel.bind('update', function(data) {
			vue.pusherUpdate = true;
			vue.cart = data;
			vue.total = 0;
			for (var i = 0; i < vue.cart.length; i++) {
				vue.total += vue.cart[i].price * vue.cart[i].qty;
			}
		})
	},
	watch: {
		cart: {
			handler: function(val) {
				if (!this.pusherUpdate) {
					this.$http.post('/cart_update', val);
				} else {
					this.pusherUpdate = false;
				}
				
			},
			deep: true
		}
	},
	methods: {
		addToCart: function(product) {
			// Update total with specific product price
			this.total += product.price;

			let found = false;
			// Craete for loop statement to check if cart has a more than 1 of the same products in it.
			// If so, then increase the quantity 
			for (var i = 0; i < this.cart.length; i++) {
				if (this.cart[i].id === product.id) {
					this.cart[i].qty++;
					found = true;
				}
			}

			if (!found) {
				// Simple array push method to add product to cart array
				this.cart.push({
					id: product.id,
					title: product.title,
					price: product.price,
					qty: 1
				});
			}
		},

		// Increment Function
		inc: function(item) {
			console.log("inc");
			item.qty++;
			this.total += item.price;
		},
		// Decrement Function
		dec: function(item) {
			console.log("dec");
			item.qty--;
			this.total -= item.price;
			if (item.qty <= 0) {
				// Set "i" to the item's position in the cart
				let i = this.cart.indexOf(item);
				// Cut 1 item at position "i"
				this.cart.splice(i, 1);
			}
		},

		onSubmit: function() {
			// Set empty array for products & results on sumbit
			this.products = [];
			this.results = [];
			this.loading = true;
			// Create variable of path and set it to query along with v-model of search input
			let path = "/search?q=".concat(this.search);
			// Utilize Vue Response for http call and pass in query and log response
			this.$http.get(path)
				.then(function(response) {
					// setTimeout(function() {
						this.results = response.body;
						// Set last search empty string to search term
						this.lastSearch = this.search;
						this.appendResults();
						this.loading = false;
					// }.bind(this), 2000);
				});
		},
		appendResults: function() {
			if(this.products.length < this.results.length) {
				let toAppend = this.results.slice(
					this.products.length,
					LOAD_NUM + this.products.length
				);
				this.products = this.products.concat(toAppend);
			}
		}
	},
	filters: {
		currency: function(price) {
			return "$".concat(price.toFixed(2));
		}
	},
	// Created hook - To call from initilization
	created: function() {
		// Call onSubmit function before page loads
		this.onSubmit();
	},
	// Updated lifecyle hook
	updated: function() {
		// Create variable for sensor based on bottom DIV
		let sensor = document.querySelector("#product-list-bottom");
		// Pass that variable into the ScrollMonitor sensor
		watcher = scrollMonitor.create(sensor);
		watcher.enterViewport(this.appendResults);
	},
	// beforeUpdate lifecycle hook
	beforeUpdate: function() {
		if (watcher) {
			watcher.destroy();
			watcher = null;
		}
	}
});


