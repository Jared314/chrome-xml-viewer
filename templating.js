//
// templating
//
// template.tag = template.tag.toDomTemplate(document);
// templating.processTemplate(template.tag, {'name':'TAG','attributes':null,'value':document.createTextNode('testvalue')});
//
var templating = {};

(function(){

function calculateJSPath(node){
	if(node.nodeType == Node.DOCUMENT_FRAGMENT_NODE || node.nodeType == Node.DOCUMENT_NODE) 
		return '';
	var n = node;
	var c = '.firstChild'
	while((n = n.previousSibling) != null) c+='.nextSibling';
	
	return calculateJSPath(node.parentNode)+c;
};

function insertTextNodes(node, items, prefix, suffix){
	var d = node.ownerDocument;
	var next = node.nextSibling;
	var parent = node.parentNode;
	for(var i=0;i<items.length;i++)
		if(next)
			parent.insertBefore(d.createTextNode(prefix+items[i]+suffix), next);
		else
			parent.appendChild(d.createTextNode(prefix+items[i]+suffix));
}

function generateReplacementGetters(fragment){
	var result = {};
	
	var nodes = document.createNodeIterator(fragment, NodeFilter.SHOW_TEXT, 
		function(n){ return (n.nodeValue.search(/{[^}]*}/) > -1 )? NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP; }
		, false);

	var n, key, fn;
	while((n = nodes.nextNode()) != null){
		key = n.nodeValue.substr(1,n.nodeValue.length-2);

		//handle back to back keys
		//TODO: handle text nodes containing more than just keys
		if(key.indexOf('}') > -1){
			var keys = key.split('}{');	
			key = keys.shift();
			n.nodeValue = n.nodeValue.substr(0, key.length+2);
			insertTextNodes(n, keys, '{', '}');
		}
		

		fn = new Function('node', 'return node' + calculateJSPath(n) + ';');

		if(!result[key]) result[key] = fn;
		else if(result[key] instanceof Function) result[key] = [result[key], fn];
		else if(result[key] instanceof Array) result[key].push(fn);
    }
	
	return result;
}

//TODO: refactor out of String class
String.prototype.toDomTemplate = function(d){
	var fragment = d.createDocumentFragment();

	var base;
	if(d instanceof HTMLDocument){ //HTML
		var base = d.createElement('div');
		base.innerHTML = this;
		base = base.firstChild;
	}else{ //XML
		base = (new DOMParser()).parseFromString(this, "text/xml");
		base = d.importNode(base.firstChild, true);
	}

	fragment.appendChild(base);

	//pre-parse replacement points
	fragment.values = generateReplacementGetters(fragment);
	fragment.stringValue = this;
	
	return fragment;
};

function set(node, value){
	if(typeof value === "string")
		node.nodeValue = value;
	else if(value && value instanceof Node){
		if(value.ownerDocument != node.ownerDocument)
			value = node.ownerDocument.importNode(value);
		node.parentNode.replaceChild(value, node);
	}else if(value && value instanceof Array && value.length > 0){
		var ns = node.nextSibling;
		var useInsert = (ns == null);
		for(var i=0;i<value.length;i++)
			if(useInsert)
				node.parentNode.insertBefore(value[i], ns);
			else
				node.parentNode.appendChild(value[i]);
		node.parentNode.removeChild(node);
	}else if(value == null || (value.length && value.length < 1))
		node.parentNode.removeChild(node);
}

templating.processTemplate = function(fragment, values){
	if(typeof fragment === 'string') return this.processStringTemplate(fragment, values);
	if(!fragment.values) return false;
	
	var n = fragment.cloneNode(true);
	
	var value, fn;
	if(values)
		for(var item in values)
			if(fragment.values[item]){
				value = values[item];
				fn = fragment.values[item];
				if(fn instanceof Function) set(fn(n), value);
				else if(fn instanceof Array)
					for(var i=0,l=fn.length;i<l;i++)
						set(fn[i](n), value);
			}

	return n;
};

templating.processStringTemplate = function(fragment, values){
	var n = fragment;

	if(values)
		for(var item in values)
			n = n.replace(new RegExp('\\{'+item+'\\}', 'g'), (values[item]) ? values[item] : '');

	return n;
};

})();

