var etl = {
	"extractors":[]
	,"transformers":[]
	,"loaders":[]
	,"executeFirst":function(d, obj){
		obj = obj || {};
		var data = this.extractors.executeFirst(d, obj);
		if(data == null) return null;
		data = this.transformers.executeFirst(data, d, obj);
		if(data == null) return null;		
		return this.loaders.executeFirst(data, d, obj);
	}
};

Array.prototype.executeFirst = function(){
	var result = false;
	for(var i=0,l=this.length;i<l && result === false;i++)
		result = this[i].apply(this, arguments);

	return (result === false)?null:result;
};







//
// templating
//
// template.tag = template.tag.toHtmlTemplate(document);
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

})();






//
// xmlTransformer
//
(function(){

var template = {
	"standard":{
"tag" : '<div class="xml-viewer-tag">\
<div class="xml-viewer-tag-start xml-viewer-tag-collapsible"><span><span class="xml-viewer-tag-collapse-indicator">+ </span><span class="xml-viewer-start-bracket">&lt;</span>{name}{attributes}<span class="xml-viewer-start-bracket">&gt;</span></span></div>\
<div class="xml-viewer-tag-content">{value}</div>\
<div class="xml-viewer-tag-end"><span class="xml-viewer-tag-collapse-indicator">+ </span><span class="xml-viewer-end-bracket">&lt;/</span>{name}<span class="xml-viewer-end-bracket">&gt;</span></div>\
</div>',
"attribute":'<span class="xml-viewer-attribute"> <span class="xml-viewer-attribute-name">{name}</span>="<span class="xml-viewer-attribute-value">{value}</span>"</span>',
"attributes":'<span class="xml-viewer-attribute-set">{value}</span>',
"inlineTag":'<div class="xml-viewer-tag xml-viewer-inline"><div class="xml-viewer-tag-start"><span><span class="xml-viewer-tag-collapse-indicator">+ </span><span class="xml-viewer-start-bracket">&lt;</span>{name}{attributes}<span class="xml-viewer-start-bracket">&gt;</span></span></div><div class="xml-viewer-tag-content">{value}</div><div class="xml-viewer-tag-end"><span class="xml-viewer-end-bracket">&lt;/</span>{name}<span class="xml-viewer-end-bracket">&gt;</span></div></div>',
"singleTag":'<div class="xml-viewer-tag"><div class="xml-viewer-tag-start xml-viewer-tag-end"><span><span class="xml-viewer-tag-collapse-indicator">+ </span><span class="xml-viewer-start-bracket">&lt;</span>{name}{attributes}<span class="xml-viewer-start-bracket">/&gt;</span></span></div></div>',
"processingInstruction":'<div class="xml-viewer-processing-instruction">{name}{value}</div>',
"comment":'<pre class="xml-viewer-comment">{value}</pre>',
"cdata":'<pre class="xml-viewer-cdata">{value}</pre>',
"document":'<div class="xml-viewer-document">{value}</div>'
	},
	"reduced":{
"tag" : '<div class="xml-viewer-tag">\
<div class="xml-viewer-tag-start xml-viewer-tag-collapsible"><span><span class="xml-viewer-tag-collapse-indicator">+ </span>{name}{attributes}<span class="xml-viewer-start-bracket">&gt;</span></span></div>\
<div class="xml-viewer-tag-content">{value}</div>\
<div class="xml-viewer-tag-end"><span class="xml-viewer-tag-collapse-indicator">+ </span><span class="xml-viewer-end-bracket">&lt;</span>{name}</div>\
</div>',
"attribute":'<span class="xml-viewer-attribute"> <span class="xml-viewer-attribute-name">{name}</span>="<span class="xml-viewer-attribute-value">{value}</span>"</span>',
"attributes":'<span class="xml-viewer-attribute-set">{value}</span>',
"inlineTag":'<div class="xml-viewer-tag xml-viewer-inline"><div class="xml-viewer-tag-start"><span><span class="xml-viewer-tag-collapse-indicator">+ </span>{name}{attributes}<span class="xml-viewer-start-bracket">&gt;</span></span></div><div class="xml-viewer-tag-content">{value}</div><div class="xml-viewer-tag-end"><span class="xml-viewer-end-bracket">&lt;</span></div></div>',
"singleTag":'<div class="xml-viewer-tag"><div class="xml-viewer-tag-start xml-viewer-tag-end"><span><span class="xml-viewer-tag-collapse-indicator">+ </span>{name}{attributes}</span></div></div>',
"processingInstruction":'<div class="xml-viewer-processing-instruction">{name}{value}</div>',
"comment":'<pre class="xml-viewer-comment">{value}</pre>',
"cdata":'<pre class="xml-viewer-cdata">{value}</pre>',
"document":'<div class="xml-viewer-document">{value}</div>'
	}
};

//Event Handler
function foldingHandler(event){
	event.cancelBubble = true;	

	var t = event.target;
	while(!t.getAttribute('class') || t.getAttribute('class').search(/\bxml-viewer-tag-collapsible\b/i) < 0)
		t = t.parentNode;

	var indicator = t.firstChild.firstChild;
	var content = t.nextSibling;

	//Show collapse indicator
	var c = indicator.getAttribute('class');
	indicator.setAttribute('class', c.flip('xml-viewer-visible'));

	//Hide contents
	c = content.getAttribute('class');
	content.setAttribute('class', c.flip('xml-viewer-hidden'));
}

function buildElementNode(node, newChildren, targetDocument){

	var hasChildren = newChildren && newChildren.length > 0;
	var isTagInline = newChildren 
			&& newChildren.length == 1 
			&& newChildren[0] 
			&& newChildren[0].nodeType == Node.TEXT_NODE
			&& newChildren[0].nodeValue.indexOf('\n') < 0;

	var t = template.tag;
	if(isTagInline) t = template.inlineTag;
	else if(!hasChildren) t = template.singleTag;

	var data = {'name':node.nodeName, 'attributes': null};
	if(isTagInline)	data['value'] = node.firstChild;
	
	if(node.hasAttributes()){
		var attrs = [];
		for(var i=0,l=node.attributes.length;i<l;i++)
			attrs.push(templating.processTemplate(template.attribute, {'name':node.attributes[i].nodeName,'value':node.attributes[i].nodeValue}));

		data['attributes'] = templating.processTemplate(template.attributes, {'value':attrs});
	}


	var result = templating.processTemplate(t, data);

	if(hasChildren && t.values['value']){
		var contentEl = t.values['value'](result);
		var p = contentEl.parentNode;
		newChildren.reParent(p);
		p.removeChild(contentEl);		
	}

	return result;
}

function buildTextNode(targetDocument, node){
	var result;
	if(!node.nodeValue.isWhitespace()){
		result = (targetDocument != node.ownerDocument) ? targetDocument.importNode(node, false) : node.cloneNode(false);
		//Consume newlines and indentation
		if(result){
			result.nodeValue = result.nodeValue.replace(/(\r?\n)[\s\t]+/g,'$1');
			result.nodeValue = result.nodeValue.replace(/(^\r?\n)|(\r?\n$)/g, '');
		}
	}
	return result;
}

//Recursively transform the nodes in a tree
function processNode(node, targetDocument){
	var children = new Array();

	if(node.hasChildNodes()){
		var child = node.firstChild;
		while(child){
			children.push(processNode(child, targetDocument));
			child = child.nextSibling;
		}
	}

	var result;
	
	switch(node.nodeType){
		case Node.ELEMENT_NODE:
			result = buildElementNode(node, children, targetDocument);
			break;
		case Node.TEXT_NODE:
			result = buildTextNode(targetDocument, node);
			break;
		case Node.CDATA_SECTION_NODE:
			result = templating.processTemplate(template.cdata, {'value':node.nodeValue});
			break;
		case Node.PROCESSING_INSTRUCTION_NODE:
			result = templating.processTemplate(template.processingInstruction, {'name':node.nodeName,'value':' '+node.nodeValue});
			break;
		case Node.COMMENT_NODE:
			result = templating.processTemplate(template.comment, {'value':node.nodeValue});
			break;
		case Node.DOCUMENT_NODE:
			//TODO: refactor
			result = templating.processTemplate(template.document);
			var value = template.document.values['value'](result);
			var p = value.parentNode;
			children.reParent(p);
			p.removeChild(value);
			result = result.firstChild;
			break;
	}
	
	return result;
}



var xmlTransformer = function(d, targetd, obj){
	//Initialize templates
	template = template[(obj.templateName || 'standard')];
	for(var t in template)
		template[t] = template[t].toDomTemplate(targetd);

	//Transform DOM Nodes
	var newRoot = processNode(d, targetd);

	//Add fake XML Processing Instruction
	var doc = (d.ownerDocument ? d.ownerDocument : d);
	if(doc.xmlVersion){
		var xmlStandaloneText = doc.xmlStandalone ? 'yes' : 'no';
		var xmlEncodingText = (doc.xmlEncoding ? doc.xmlEncoding : doc.inputEncoding);
		xmlEncodingText = (xmlEncodingText) ? ' encoding="' + xmlEncodingText : '';
		var xmlTextNode = 'xml version="'+doc.xmlVersion+'"'+xmlEncodingText+'" standalone="'+xmlStandaloneText+'" ';
		xmlTextNode = xmlTextNode.toNode(targetd, 'div', 'xml-viewer-processing-instruction');
		newRoot.insertBefore(xmlTextNode, newRoot.firstChild);
	}

	// Attach folding handlers
	var nodes = newRoot.querySelectorAll("div[class~='xml-viewer-tag-collapsible'] > span");
	if(nodes && nodes.length > 0){
		for(var i=0,l=nodes.length;i<l;i++)
	 		nodes[i].addEventListener("click", foldingHandler, false);
	}

	return newRoot;
};

etl.transformers.push(xmlTransformer);


// Helpers
Array.prototype.reParent = function(newParent){
	for(var i=0;i<this.length;i++)
		if(this[i]){
			var el = this[i];
			if(newParent.ownerDocument != el.ownerDocument){
				el = newParent.ownerDocument.importNode(el, true);
			}
			newParent.appendChild(el);
		}
};

String.prototype.isWhitespace = function(){
	return this.replace(/[\u000a\u0009\u000b\u000c\u000d\u0020\u00a0\u0085\u1680\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000]+/g, '').length < 1;
};

String.prototype.toNode = function(targetDocument, tagName, className){
	var result = targetDocument.createTextNode(this);
	if(tagName){
		var s = targetDocument.createElement(tagName);
		if(className) s.setAttribute('class', className);
		s.appendChild(result);
		result = s;
	}
	return result;
};

String.prototype.removeWord = function(value, delimiter, options){
	if(!delimiter) delimiter = ' ';
	var r = new RegExp('('+delimiter+')?' + value + '('+delimiter+')?', (options)?options:'g');
	var m = this.match(r);
	return (m) ? this.replace(r, (m[1] && m[2])? delimiter : '') : this;
};

String.prototype.flip = function(value1, delimiter){
	if(!delimiter) delimiter = ' ';
	var result = this;
	if(result.search(new RegExp('\\b' + value1 + '\\b', 'i')) > -1)
		result = result.removeWord(value1, delimiter, 'gi');
	else
		result += ((result.length > 0)?delimiter:'') + value1;

	return result;
};

})();







//
// xml
//
(function(){

function isXml(elem){
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
	return documentElement ? (documentElement.nodeName.toUpperCase() !== "HTML") : false;
};


var xmlDomExtractor = function(d){
	if(d == null || !isXml(d)) return false;
	return d;
};

var xmlDomLoader = function(d, targetd, obj){
	if(!isXml(targetd)) return false;
	
	var templateName = obj.templateName || 'standard';
	var colorSchemeName = obj.colorSchemeName || 'standard';
	
	//Attach CSS file
	//TODO remove chrome extension dependency
	var pi = targetd.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="' + chrome.extension.getURL('xml.'+templateName+'.'+colorSchemeName+'.css') + '"');
	targetd.insertBefore(pi, targetd.firstChild);

	//Attach the new tree
	if(document.documentElement)
		targetd.replaceChild(d, targetd.documentElement);
	else
		targetd.appendChild(d);

	return true;
};

etl.extractors.push(xmlDomExtractor);
etl.loaders.push(xmlDomLoader);
})();








//
// genericXml
//
(function(){

var xmlFormatDomExtractor = function(d){
	if(d == null) return false;
	var r = XRegExp('(^\\s*<\\?xml[^\\n]+)|(^\\s*<(\\S+).+</\\3>\\s*$)','si');
	var pre = d.querySelectorAll('body > pre');
	var isXml = pre.length == 1 && pre[0].childElementCount == 0 && r.test(pre[0].innerText);
	if(!isXml) return false;
	
	pre = pre[0].innerText.toDOM();
	return (pre)?pre:false;
};

var htmlXmlFileDomLoader = function(d, targetd, obj){
	
	var pre = targetd.querySelectorAll('body > pre');
	if(pre.length != 1) return false;
	
	//Load
	pre[0].parentNode.replaceChild(d, pre[0]);

	var templateName = obj.templateName || 'standard';
	var colorSchemeName = obj.colorSchemeName || 'standard';
	//Append CSS
	//TODO remove chrome extension dependency
	targetd.insertHtmlLinkElement(chrome.extension.getURL('xml.'+templateName+'.'+colorSchemeName+'.css'));

	return true;
};

etl.extractors.push(xmlFormatDomExtractor);
etl.loaders.push(htmlXmlFileDomLoader);


//Helpers
String.prototype.toDOM = function(){
	var value = this.replace(/^\s+/,'');
	var parser = new DOMParser();
	var result = parser.parseFromString(value, "text/xml");
	
	if(result.getElementsByTagName('parsererror').length > 0)
		return null;
	return result;
};

Document.prototype.insertHtmlHeadElement = function(){
	if(this.head) return this.head;
	var head = this.createElement('head');
	var html = this.querySelector('html');
	if(!html){
		html = this.createElement('html');
		this.appendChild(html);
	}
	html.insertBefore(head, html.firstChild);
	return head;
}

Document.prototype.insertHtmlLinkElement = function(path){
	var link = this.createElement('link');
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = path;
	var head = (this.head || this.insertHtmlHeadElement());
	head.appendChild(link);
	return link;
};

})();
