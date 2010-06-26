


String.prototype.isWhitespace = function(){
	//\u000a
	//\u0009
	//\u000b
	//\u000c
	//\u000d
	//\u0020
	//\u00a0
	//\u0085
	//\u1680
	//\u2007
	//\u2008
	//\u2009
	//\u200a
	//\u2028
	//\u2029
	//\u202f
	//\u205f
	//\u3000
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

String.prototype.toDOM = function(){
	return new DOMParser().parseFromString(this, "text/xml");
};

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

NodeList.prototype.filter = function(callback){
	var l = this.length;
	var result = [];
	for(var i=0;i<l;i++)
		if(callback(this.item(i)))
			result.push(this.item(i));
	return result;
};

NamedNodeMap.prototype.toNode = function(targetDocument, tagName, nameClassName, valueClassName, attributeClassName, groupClassName){
	var result = targetDocument.createElement(tagName);
	if(groupClassName) result.setAttribute('class', groupClassName);
	
	for(var i=0;i<this.length;i++){
		var r1 = targetDocument.createElement(tagName);
		if(attributeClassName) r1.setAttribute('class', attributeClassName);
		r1.appendChild(this[i].nodeName.toNode(targetDocument, tagName, nameClassName));
		r1.appendChild(this[i].nodeValue.toNode(targetDocument, tagName, valueClassName));
		result.appendChild(r1);
	}
	
	return result;
};

Document.prototype.insertHtmlHeadElement = function(){
	if(this.head) return this.head;
	var head = this.createElement('head');
	var html = this.getElementsByTagName("html")[0];
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

Document.prototype.isChromeViewSourcePage = function(){
	return this.body != null 
		&& this.getElementsByClassName("webkit-line-gutter-backdrop").length == 1
		&& this.getElementsByTagName("tbody").length == 1;
};

Document.prototype.isXmlFile = function(){
	return this.xmlVersion != null && this.getElementsByTagName("div").length < 1 && this.getElementsByTagName("table").length < 1;
};

Node.prototype.hasElementChildNodes = function(){
	if(!this.hasChildNodes()) return false;
	return this.childNodes.filter(function(el){ return el.nodeType == 1; }).length > 0;
};

Document.prototype.isPlainTextXmlFile = function(){
	return this.body 
		&& this.getElementsByTagName("pre").filter(
			function(el){ return el != null && !el.hasElementChildNodes() && (el.innerText.match(/^\s*<\?xml\s/mi) || "").length > 0; }
			).length > 0;
};

Document.prototype.getPlainTextXmlFileNode = function(){
	var nodes = this.getElementsByTagName("pre").filter(
		function(el){ return el != null && (el.innerText.match(/^\s*<\?xml\s/mi) || "").length > 0; }
		);
	return nodes;
};





//Event Handler
function foldingHandler(event){
	event.cancelBubble = true;
	if(event.target.parentNode.getAttribute('class') != 'xml-viewer-tag-start') return true;

	var hiddenCssClass = 'xml-viewer-hidden';
	var hiddenRegex = new RegExp('\\s?\\b' + hiddenCssClass + '\\b', 'i');
	var contentNode = event.target.parentNode.nextSibling;
	var c = contentNode.getAttribute('class');

	if(c.search(hiddenRegex) > -1) //Hidden
		c = c.replace(hiddenRegex, '');
	else
		c += ' ' + hiddenCssClass;

	contentNode.setAttribute('class', c);
}


//Node Rendering
function buildNodeWithAttributes(node, tagName, className, targetDocument){
	var result = targetDocument.createElement(tagName);
	result.setAttribute('class', className);
	
	result.appendChild(node.nodeName.toNode(targetDocument, 'span'));

	if(node.hasAttributes())
		result.appendChild(
			node.attributes.toNode(targetDocument, 'span', 'xml-viewer-attribute-name', 'xml-viewer-attribute-value', 'xml-viewer-attribute', 'xml-viewer-attribute-set')
			);

	return result;
}

function buildEndNode(node, tagName, className, targetDocument){
	return node.nodeName.toNode(targetDocument, tagName, className);
}


function buildElementNode(node, newChildren, targetDocument){

	var hasChildren = newChildren && newChildren.length > 0;
	var isTagInline = newChildren && newChildren.length == 1 
			&& newChildren[0].nodeType == Node.TEXT_NODE
			&& newChildren[0].nodeValue.length < 80;

	//Create new wrapper node
	var result = targetDocument.createElement('div');
	result.setAttribute('name',node.nodeName);
	result.setAttribute('class', isTagInline ? 'xml-viewer-tag xml-viewer-inline' : 'xml-viewer-tag');

	//Create tags
	var startTagStyle =  hasChildren ? 'xml-viewer-tag-start' : 'xml-viewer-tag-start xml-viewer-tag-end';
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
			if(!node.nodeValue.isWhitespace())
				result = (targetDocument != node.ownerDocument) ? targetDocument.importNode(node, false) : node.cloneNode(false);
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

//Transformation
function transformXmlDocument(sDoc, dDoc){

	//Transform DOM Nodes
	var newRoot = processNode(sDoc, dDoc);

	//Add fake XML Processing Instruction
	if(sDoc.xmlVersion){
		var xmlStandaloneText = sDoc.xmlStandalone ? 'yes' : 'no';
		var xmlEncodingText = sDoc.xmlEncoding ? sDoc.xmlEncoding : sDoc.inputEncoding;
		var xmlTextNode = 'xml version="'+sDoc.xmlVersion+'" encoding="'+xmlEncodingText+'" standalone="'+xmlStandaloneText+'" ';
		xmlTextNode = xmlTextNode.toNode(dDoc, 'div', 'xml-viewer-processing-instruction');
		newRoot.insertBefore(xmlTextNode, newRoot.firstChild);
	}

	return newRoot;
}




