// add bind method
if (!Function.prototype.bind) {
	Function.prototype.bind = function(thisObj) { 
		var fn = this;
		var args = Array.prototype.slice.call(arguments, 1); 
		return function() { 
			return fn.apply(thisObj, args.concat(Array.prototype.slice.call(arguments))); 
		}
	}
};

//This is the version from MDC, used in Firefox/SpiderMonkey. In other cases such as IE, it'll add .indexOf() in the case it's missing...basically IE8 or below at this point.
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(elt /*, from*/) {
		var len = this.length >>> 0;

		var from = Number(arguments[1]) || 0;
		from = (from < 0) ? Math.ceil(from) : Math.floor(from);
		if (from < 0)
			from += len;

		for (; from < len; from++) {
			if (from in this && this[from] === elt)
				return from;
		}
		return -1;
	};
}


/**
* Treeview widget for better browsing in ul/li elements - no need any other frameworks to handle.
* writen by Lukas Franek - www.chleba.org
* @params
* @rootElm {DOMElement} contain all ul/li elements witch we want handle
* @opened {array} array of indexes li items with another sub - ul elements
* @dict {object} object of switchers words example { hide : 'Hide All', open : 'Open All' }
*/
function Treeview(rootElm, opened, dict){
	this.dict = dict || { hide : 'Hide All', open : 'Open All' };
	this.dom = {};
	this.canBeOpen = [];
	this.openedElm = opened || [];
	this.dom.rootElm = document.getElementById(rootElm);
	this.dom.uls = this.dom.rootElm.getElementsByTagName('ul');
	// all items
	this.dom.lis = this.dom.rootElm.getElementsByTagName('li');
	this._buildTree();
	this._localStorage();
	this._hideAll();
	this._openStorage();
};

// test localStorage and add some data
Treeview.prototype._localStorage = function(){
	try {
		if('localStorage' in window && window['localStorage'] !== null){
			this.storage = window.localStorage;
			
			// expiration of localStorage data about opened ul elements default set on 1 hour
			if('TreeExpireTime' in this.storage){
				if(this.storage.TreeExpireTime < new Date().getTime()){
					this.storage.clear();
					this.storage.TreeExpireTime = new Date().getTime()+((60*1000)*60);
				}
			} else {
				this.storage.setItem('TreeExpireTime', new Date().getTime()+((60*1000)*60) );
			}
			this.openedElm = 'OPENED_ELM' in this.storage ? JSON.parse(this.storage.OPENED_ELM) : this.openedElm;
		}
	} catch (e) {
		throw new Error('Browser dont support WebStorage');
		//return false;
	}
};

// add default cancel event
Treeview.prototype._cancelDef = function(e){
	var e = e || window.event;
	if(e.preventDefault) {
		e.preventDefault();
	} else {
		e.returnValue = false;
	}
};

// open elements from localStorage data
Treeview.prototype._openStorage = function(){
	for(var i=0;i<this.openedElm.length;i++){
		var index = this.openedElm[i];
		this._open(this.canBeOpen[index]);		
	}
};

// add opener to items if they have another subsection
Treeview.prototype._buildTree = function(){
	var span, ul;

	this.dom.switchers = {};
	this.dom.switchers.root = document.createElement('div');
	this.dom.switchers.root.className = 'TreeSwitchers';
	this.dom.switchers.open = document.createElement('a');
	this.dom.switchers.open.href = '#';
	this.dom.switchers.open.innerHTML = this.dict.open;
	this.dom.switchers.open.className = 'TreeOpen';
	this.dom.switchers.hide = document.createElement('a');
	this.dom.switchers.hide.href = '#';
	this.dom.switchers.hide.innerHTML = this.dict.hide;
	this.dom.switchers.hide.className = 'TreeHide';

	this.dom.switchers.root.appendChild(this.dom.switchers.open);
	this.dom.switchers.root.appendChild(this.dom.switchers.hide);

	this.dom.rootElm.insertBefore(this.dom.switchers.root, this.dom.rootElm.firstChild);

	this.addListener(this.dom.switchers.open, 'click', this.openAll.bind(this));
	this.addListener(this.dom.switchers.hide, 'click', this.hideAll.bind(this));

	ul = this.dom.rootElm.getElementsByTagName('ul')[0];
	this.addListener(ul, 'click', this.openerClick.bind(this));

	for(var i=0; i<this.dom.lis.length; i++){
		if(this.dom.lis[i].getElementsByTagName('ul').length > 0){

			// add item witch can be open
			this.canBeOpen.push(this.dom.lis[i]);

			// definition of opener element
			span = document.createElement('span');
			span.className = 'opener';
			//span.innerHTML = '+';
			span.style.cursor = 'pointer';

			this.dom.lis[i].insertBefore(span, this.dom.lis[i].firstChild);
		}
	}
};

// hide all subcategories
Treeview.prototype._hideAll = function(){
	for(var i=0; i<this.canBeOpen.length;i++){
		var oe = this.canBeOpen[i];
		var ul = oe.getElementsByTagName('ul')[0];
		ul.style.display = 'none';
		oe.className = 'close';
	}
};

// hide all items
Treeview.prototype.hideAll = function(){
	for(var i=0;i<this.canBeOpen.length;i++){
		this._hide(this.canBeOpen[i]);
	}
};

// open all items
Treeview.prototype.openAll = function(){
	for(var i=0;i<this.canBeOpen.length;i++){
		this._open(this.canBeOpen[i]);
	}
};

// finder of items witch can be open from click event target element
Treeview.prototype._parentFinder = function(e){
	var elm = e.target || e.srcElement;
	if(elm.tagName == 'LI'){
		return elm;
	} else {
		while(elm.tagName != 'LI'){
			elm = elm.parentNode;
		}
		return elm;
	}
};

// handling and delegating click event on tree
Treeview.prototype.openerClick = function(e){
	var e = e || window.event;
	var elm = this._parentFinder(e);

	var elmIndex = this.canBeOpen.indexOf(elm);
	if(elmIndex > -1){
		if(elm.className == 'open'){
			this._hide(elm);
		} else if(elm.className == 'close') {
			this._open(elm);
		}
	}
};

// save opened items to localstorage
Treeview.prototype._localStorageSave = function(){
	this.storage.OPENED_ELM = JSON.stringify(this.openedElm);
};

// hide item method
Treeview.prototype._hide = function(elm){
	var elmIndex = this.canBeOpen.indexOf(elm);
	if(this.openedElm.indexOf(elmIndex) > -1){
		this.openedElm.splice(this.openedElm.indexOf(elmIndex), 1);
	}
	this._localStorageSave();

	var ul = elm.getElementsByTagName('ul')[0];
	ul.style.display = 'none';
	elm.className = 'close';
};

// open item method
Treeview.prototype._open = function(elm){
	var elmIndex = this.canBeOpen.indexOf(elm);

	if(this.openedElm.indexOf(elmIndex) < 0){
		this.openedElm.push(elmIndex);
	}
	this._localStorageSave();

	var ul = elm.getElementsByTagName('ul')[0];
	ul.style.display = 'block';
	elm.className = 'open';
};

// add event listener method fixing cross browser compatibility 
Treeview.prototype.addListener = function(elm, type, action){
	if(document.addEventListener){
		elm.addEventListener(type, action);
	} else if(document.attachEvent){
		elm.attachEvent('on'+type, action);
	} else {
		throw new Error("This browser can not handle events");
	}
};