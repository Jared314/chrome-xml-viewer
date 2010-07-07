var etl = {
	"extractors":[]
	,"transformers":[]
	,"loaders":[]
	,"executeFirst":function(d){
		var data = this.extractors.executeFirst(d);
		if(data == null) return null;
		data = this.transformers.executeFirst(data, d);
		if(data == null) return null;		
		return this.loaders.executeFirst(data, d);
	}
};

Array.prototype.executeFirst = function(item, item2){
	var result = false;
	for(var i=0,l=this.length;i<l && result === false;i++)
		result = (item2) ? this[i](item,item2) : this[i](item);
	return (result === false)?null:result;
};




(function(){







//Node Rendering
function buildNodeWithAttributes(node, tagName, className, targetDocument){
	var result = targetDocument.createElement(tagName);
	result.setAttribute('class', className);
	
	var tag = node.nodeName.toNode(targetDocument, 'span');

	if(node.hasAttributes())
		tag.appendChild(
			node.attributes.toNode(targetDocument, 'span', 'xml-viewer-attribute-name', 'xml-viewer-attribute-value', 'xml-viewer-attribute', 'xml-viewer-attribute-set')
			);
	if(node.hasChildNodes()) 
		tag.appendChild(">".toNode(targetDocument,'span','xml-viewer-start-bracket'));
	result.appendChild(tag);
	return result;
}

function buildEndNode(node, tagName, className, targetDocument){
	var result = node.nodeName.toNode(targetDocument, tagName, className);
	result.insertBefore("<".toNode(targetDocument,'span','xml-viewer-end-bracket'), result.firstChild);
	return result;
}



//Event Handler
function foldingHandler(event){
	event.cancelBubble = true;	

	var t = event.target;
	while(!t.getAttribute('class') || t.getAttribute('class').search(/\bxml-viewer-tag-collapsible\b/i) < 0)
		t = t.parentNode;
	t = t.nextSibling;

	var hiddenCssClass = 'xml-viewer-hidden';
	var c = t.getAttribute('class');

	if(c.search(new RegExp('\\b' + hiddenCssClass + '\\b', 'i')) > -1) //Hidden
		c = c.removeWord(hiddenCssClass, ' ', 'gi');
	else
		c += ' ' + hiddenCssClass;

	t.setAttribute('class', c);
}

function buildElementNode(node, newChildren, targetDocument){

	var hasChildren = newChildren && newChildren.length > 0;
	var isTagInline = newChildren 
			&& newChildren.length == 1 
			&& newChildren[0] 
			&& newChildren[0].nodeType == Node.TEXT_NODE
			&& newChildren[0].nodeValue.indexOf('\n') < 0;

	//Create new wrapper node
	var result = targetDocument.createElement('div');
	result.setAttribute('name',node.nodeName);
	result.setAttribute('class', isTagInline ? 'xml-viewer-tag xml-viewer-inline' : 'xml-viewer-tag');

	//Create tags
	var startTagStyle = 'xml-viewer-tag-start';
	if(!hasChildren) startTagStyle += ' xml-viewer-tag-end';
	else if(!isTagInline) startTagStyle += ' xml-viewer-tag-collapsible';
	result.appendChild(buildNodeWithAttributes(node, 'div', startTagStyle, targetDocument));

	if(hasChildren){
		var contentEl = targetDocument.createElement('div');
		contentEl.setAttribute('class','xml-viewer-tag-content');

		newChildren.reParent(contentEl);

		//Attach nodes
		result.appendChild(contentEl);
		result.appendChild(buildEndNode(node, 'div', 'xml-viewer-tag-end', targetDocument));
	}

	// Attach folding handler
	if(!isTagInline)
		result.firstChild.firstChild.addEventListener("click", foldingHandler, false);
	
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
			result = node.nodeValue.toNode(targetDocument, 'pre', 'xml-viewer-cdata');
			break;
		case Node.PROCESSING_INSTRUCTION_NODE:
			result = (node.nodeName + " " + node.nodeValue).toNode(targetDocument, 'div', 'xml-viewer-processing-instruction');
			break;
		case Node.COMMENT_NODE:
			result = node.nodeValue.toNode(targetDocument, 'pre', 'xml-viewer-comment');
			break;
		case Node.DOCUMENT_NODE:
			result = targetDocument.createElement('div');
			result.setAttribute('class', 'xml-viewer-document');
			children.reParent(result);
			break;
	}
	
	return result;
}



var xmlTransformer = function(d, targetd){
	//Transform DOM Nodes
	var newRoot = processNode(d, targetd);

	//Add fake XML Processing Instruction
	var doc = (d.ownerDocument ? d.ownerDocument : d);
	if(doc.xmlVersion){
		var xmlStandaloneText = doc.xmlStandalone ? 'yes' : 'no';
		var xmlEncodingText = (doc.xmlEncoding ? doc.xmlEncoding : doc.inputEncoding);
		xmlEncodingText = (xmlEncodingText) ? ' encoding="' + xmlEncodingText : '';
		var xmlTextNode = 'xml version="'+doc.xmlVersion+xmlEncodingText+'" standalone="'+xmlStandaloneText+'" ';
		xmlTextNode = xmlTextNode.toNode(targetd, 'div', 'xml-viewer-processing-instruction');
		newRoot.insertBefore(xmlTextNode, newRoot.firstChild);
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

NamedNodeMap.prototype.toNode = function(targetDocument, tagName, nameClassName, valueClassName, attributeClassName, groupClassName){
	var result = targetDocument.createElement(tagName);
	if(groupClassName) result.setAttribute('class', groupClassName);
	
	for(var i=0;i<this.length;i++){
		var r1 = targetDocument.createElement(tagName);
		if(attributeClassName) r1.setAttribute('class', attributeClassName);
		r1.appendChild(targetDocument.createTextNode(" "));
		r1.appendChild(this[i].nodeName.toNode(targetDocument, tagName, nameClassName));
		r1.appendChild(targetDocument.createTextNode('="'));
		r1.appendChild(this[i].nodeValue.toNode(targetDocument, tagName, valueClassName));
		r1.appendChild(targetDocument.createTextNode('"'));		
		result.appendChild(r1);
	}
	
	return result;
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

})();






// XML File
(function(){

function isXml(elem){
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};


var xmlDomExtractor = function(d){
	if(d == null || !isXml(d)) return false;
	return d;
};

var xmlDomLoader = function(d, targetd){
	if(!isXml(targetd)) return false;

	//Attach CSS file
	//TODO remove chrome extension dependency
	var pi = targetd.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="' + chrome.extension.getURL('xml.css') + '"');
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








// XML-Look-Alike File
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

var htmlXmlFileDomLoader = function(d, targetd){
	
	var pre = targetd.querySelectorAll('body > pre');
	if(pre.length != 1) return false;
	
	//Load
	pre[0].parentNode.replaceChild(d, pre[0]);

	//Append CSS
	//TODO remove chrome extension dependency
	targetd.insertHtmlLinkElement(chrome.extension.getURL('xml.css'));

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
