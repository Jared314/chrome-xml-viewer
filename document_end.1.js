NodeList.prototype.filter = function(callback){
	var result = new Array();
	for(var i=0;i<this.length;i++)
		if(callback(this[i]))result.push(this[i]);
	return result;
};

NodeList.prototype.reParent = function(newParent){
	for(var i=0;i<this.length;i++)
		newParent.appendChild(this[i]);
}

Node.prototype.wrap = function(tagName, className){
	var s = this.ownerDocument.createElement(tagName);
	if(className) s.setAttribute('class', className);
	var p = this.parentNode;
	s.appendChild(this);
	if(p != null) p.appendChild(s);
	return s;
};

NamedNodeMap.prototype.toNode = function(tagName, nameClassName, valueClassName, attributeClassName, groupClassName){
	var result = document.createElement(tagName);
	if(groupClassName) result.setAttribute('class', groupClassName);
	
	for(var i=0;i<this.length;i++){
		var r1 = document.createElement(tagName);
		if(attributeClassName) r1.setAttribute('class', attributeClassName);
		r1.appendChild(this[i].nodeName.toNode(document, tagName, nameClassName));
		r1.appendChild(this[i].nodeValue.toNode(document, tagName, valueClassName));
		result.appendChild(r1);
	}
	
	return result;
};

String.prototype.toNode = function(targetDocument, tagName, className){
	var result = targetDocument.createTextNode(this);
	if(tagName) result = result.wrap(tagName, className);
	return result;
};

function formatAttributes(node){
	var result = null;

	if(node.hasAttributes())
		result = node.attributes.toNode('span', 'webkit-html-attribute-name', 'webkit-html-attribute-value', 'webkit-html-attribute', 'webkit-html-attribute-set');
	
	return result;
}

function buildNodeWithAttributes(node, tagName, className){
	var result = node.nodeName.toLowerCase();
	result = result.toNode(document,tagName, className);
	
	
	var attrs = formatAttributes(node);
	if(attrs) result.appendChild(attrs);

	return result;
}

function buildEndNode(node, tagName, className){
	return node.nodeName.toLowerCase().toNode(document, tagName, className);
}





function wrapElementNode(node){
	//Create New wrapper node
	var result = document.createElement('div');		
	result.setAttribute('name',node.nodeName);
	result.setAttribute('class', 'tag');	

	if(node.hasChildNodes()){
		//Move Children
		var contentEl = document.createElement('div');
		contentEl.setAttribute('class','tag-content');
		node.childNodes.reParent(contentEl);

		//Attach Nodes
		result.appendChild(buildNodeWithAttributes(node, 'div', 'tag-start'));
		result.appendChild(contentEl);
		result.appendChild(buildEndNode(node, 'div', 'tag-end'));
	}else{
	
		var s = buildNodeWithAttributes(node, 'div', 'tag-single');
		result.appendChild(s);
	}

	if(node.parentNode)
		node.parentNode.replaceChild(result, node);
	
	return result;
}

function buildProcessingInstructionNode(node){
	return node;
}

function processNode(node){

	if(node.hasChildNodes()){
		var validChildren = node.childNodes.filter(
			function(){ return true; }
			);
		for(var i=0;i<validChildren.length;i++)
			processNode(validChildren[i]);
	}

	// Wrap node
	if(node.nodeType == 1) //Element
		return wrapElementNode(node);
	else if(node.nodeType == 3) //Text
		return node.wrap('div', 'content');
	else if(node.nodeType == 4) //CData
		return node.wrap('pre', 'cdata');
	else if(node.nodeType == 7) //Processing Instruction
		return buildProcessingInstructionNode(node);
}



function isViewSource(targetDocument){
	//Only works for non-html documents
	return targetDocument.body != null;
}















if(!isViewSource(document)){
	console.log(window);
	
	//Transform DOM Nodes
	var nodes = document.childNodes;
	for(var i=0;i<nodes.length;i++)
		if(nodes[i].nodeType == 1)
			processNode(nodes[i]);
	
	//Attach CSS file
	var cssPath = chrome.extension.getURL('xml.css');
	var pi = document.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="'+cssPath+'"');
	document.insertBefore(pi, document.firstChild);

	//Wrap Document
	var root = document.documentElement.wrap('div', 'document');
	
	//Add fake XML Processing Instruction
	if(document.xmlVersion){
		var xmlStandaloneText = document.xmlStandalone ? 'yes' : 'no';
		var xmlEncodingText = document.xmlEncoding ? document.xmlEncoding : document.inputEncoding;
		var xmlTextNode = 'xml version="'+document.xmlVersion+'" encoding="'+xmlEncodingText+'" standalone="'+xmlStandaloneText+'" ';
		xmlTextNode = xmlTextNode.toNode(document,'div', 'processing-instruction');
		root.insertBefore(xmlTextNode, root.firstChild);
	}
}
