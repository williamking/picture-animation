function trunkify(fn) {
	return function() {
		let args = [], ctx = this;
		for (let i = 0; i < arguments.length; ++i) {
			args.push(arguments[i]);
		}

		return function(done) {
			var called;

			args.push(function() {
				if (called) return;
				called = true;
				done.apply(null, arguments);
			});

			try {
				fn.apply(ctx, args);
			} catch(err) {
				done(err);
			}
		}
	}
}

let PictureAnimator = function(url, id, width, height) {
	this.url = url;
	this.id = id;
	this.rows = 1;
	this.cols = 1;
	this.width = width;
	this.height = height;
	this.image = new Image();
	this.init();
}

PictureAnimator.prototype.init = function() {
	this.image.src = this.url;
	this.image.onload = (function() {
        this.createDom();
        this.srcWidth = this.image.width;
        this.srcHeight = this.image.height;
    }).bind(this);
    this.resize(this.width, this.height);
}

PictureAnimator.prototype.resize = function(width, height) {
	this.image.width = width;
	this.image.height = height;
}

PictureAnimator.prototype.createDom = function() {
	if (this.dom) {
		return new Error("The dom element has been created");
	}
	console.log("create");
	this.dom = document.createElement("div");
	this.dom.className = "picture-animation-wrapper";
	this.dom.style.width = this.width + 'px';
    this.dom.style.height = this.height + 'px';
	this.dom.appendChild(this.image);
	this.appendTo(this.id);
}

PictureAnimator.prototype.appendTo = function(id) {
	var parent = document.getElementById(id);
	if (parent && this.dom) {
		parent.appendChild(this.dom);
	}
}

PictureAnimator.prototype.divide = function(rows, cols) {
	this.rows = rows;
	this.cols = cols;

	this.dom.removeChild(this.image);

	this.blocks = [];

	for (let i = 0; i < rows; ++i) {
		let row = document.createElement('div');
		this.blocks[i] = [];
		for (let j = 0; j < cols; ++j) {
			let item = document.createElement('div');
			this.setBlockStyle(item, this.width / this.cols, this.height / this.rows, i, j);
			this.dom.appendChild(item);
			this.blocks[i].push(item);
		}
	}
}

PictureAnimator.prototype.setBlockStyle = function(item, width, height, i, j) {
	let itemWidth = width
	    itemHeight = height;

	item.className = 'picture-animation-item';
	item.style.backgroundImage = 'url(' + this.url + ')';
	item.style.backgroundSize = this.width + 'px ' + this.height + 'px';
	item.style.backgroundPosition = -itemWidth * i + 'px '
			+ (-itemHeight) * j + 'px';
	item.style.top = itemHeight * j + 'px';
	item.style.left = itemWidth * i + 'px';
	item.style.width = itemWidth + 'px';
	item.style.height = itemHeight + 'px';
}

PictureAnimator.prototype.rotateBlock = function(item) {
	item.classList.add('animating');
};

PictureAnimator.prototype.getItem = function(x, y) {
	return this.blocks[y][x];
}

PictureAnimator.prototype.rotate = function(mode) {
	let modes = ['random', 'sequence'];
	if (! mode in modes) return new Error("Mode error");
	let x = 0, y = 0, pro = null;
	if (mode == 'random') {
		let list = {};
		list.length = this.rows * this.cols;
		this.randomList = Array.from(list);
		this.randomList = this.randomList.map(function(value, index) {
			return index;
		});

		console.log(this.randomList);

		this.randomList.sort(function() {return Math.random() > 0.5;});

		console.log(this.randomList);

		for (let i = 0; i < this.cols * this.rows; ++i) {
			if (pro == null) {
				pro = new Promise((function(i, j) {
					return (function(resolve, reject) {
						let item = this.getItem(j, i);
						this.rotateBlock(item);
						setTimeout(resolve, 200);
					}).bind(this);
				}).call(this, Math.floor(this.randomList[i] / this.cols), this.randomList[i] % this.cols));
			} else {
				pro = pro.then((function(i, j) {
					return (function(value) {
						return new Promise((function(i, j) {
							return (function(resolve, reject) {
							    let item = this.getItem(j, i);
							    this.rotateBlock(item);
							    setTimeout(resolve, 200);
							}).bind(this);
						}).call(this, i, j));
					}).bind(this);
				}).call(this, Math.floor(this.randomList[i] / this.cols), this.randomList[i] % this.cols));
			}
        }
	}

	if (mode == 'sequence') {
		for (let i = 0; i < this.rows; ++i) {
			for (let j = 0; j < this.cols; ++j) {
				if (pro == null) {
					pro = new Promise((function(i, j) {
						return (function(resolve, reject) {
							let item = this.getItem(j, i);
							this.rotateBlock(item);
							console.log("one");
							setTimeout(resolve, 200);
						}).bind(this);
					}).call(this, i, j));
				} else {
					pro = pro.then((function(i, j) {
						return (function(value) {
							return new Promise((function(i, j) {
								return (function(resolve, reject) {
								    let item = this.getItem(j, i);
								    this.rotateBlock(item);
								    setTimeout(resolve, 200);
								}).bind(this);
							}).call(this, i, j));
						}).bind(this);
					}).call(this, i, j));
				}
			}
		}
		pro.then(this.reset.bind(this));
	}
}

PictureAnimator.prototype.reset = function() {
	for (let i = 0; i < this.rows; ++i) {
		for (let j = 0; j < this.cols; ++j) {
			let item = this.getItem(j, i);
			item.classList.remove('animating');
		}
	}
}

let animator = new PictureAnimator('test.jpg', 'sample', 600, 400);

setTimeout(function() {
	animator.divide(5, 5);
}, 500);

// setTimeout(function() {
// 	animator.rotate('random');
// }, 2000);

document.getElementById('random-animate').addEventListener('click', function() {
	animator.rotate('random');
});

document.getElementById('seq-animate').addEventListener('click', function() {
	animator.rotate('sequence');
});