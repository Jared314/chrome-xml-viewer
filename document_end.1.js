Node.prototype.appendChildren = function(children){
	for(var i=0;i<children.length;i++){
		this.appendChild(children[i]);
	}
};

NodeList.prototype.filter = function(callback){
	var result = new Array();
	for(var i=0;i<this.length;i++)
		if(callback(this[i]))result.push(this[i]);
	return result;
};

function wrapNode(node, tagName, className){
	var s = document.createElement(tagName);
	s.setAttribute('class', className);
	var p = node.parentNode;
	s.appendChild(node);
	if(p != null) p.appendChild(s);
	return s;
}

function wrapNonTextNode(node){
	if(node.hasChildNodes()){
		var s = document.createElement('span');
		s.setAttribute('class', 'tag start');
		s.appendChild(document.createTextNode(node.nodeName.toLowerCase()));
		node.insertBefore(s, node.firstChild);
		
		var e = document.createElement('span');
		e.setAttribute('class', 'tag end');
		e.appendChild(document.createTextNode(node.nodeName.toLowerCase()));
		node.appendChild(e);
	}else{
		var s = document.createElement('span');
		s.setAttribute('class', 'tag start single');
		s.appendChild(document.createTextNode(node.nodeName.toLowerCase()));
		node.appendChild(s);
	}
	
	return node;
}

function processNode(node){
	if(node.hasChildNodes())
		for(var i=0;i<node.childNodes.length;i++)
			processNode(node.childNodes[i]);

	// Wrap node
	if(node.nodeType == 1)
		return wrapNonTextNode(node);
	else if(node.nodeType == 3)
		return wrapNode(node, 'span', 'content');
}



function isViewSource(targetDocument){
	//Only works for non-html documents
	return targetDocument.body != null;
}

if(!isViewSource(document)){
	//Debug
	console.log(window);
	
	//Attach CSS file
	var cssPath = chrome.extension.getURL('xml.css');
	var pi = document.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="'+cssPath+'"');
	document.insertBefore(pi, document.firstChild);

	//Transform DOM Nodes
	var nodes = document.childNodes;
	for(var i=0;i<nodes.length;i++)
		if(nodes[i].nodeType == 1)
			processNode(nodes[i]);
	
	//Wrap Document
	var root = wrapNode(document.documentElement, 'div', 'document');
	
	//Add fake XML Processing Instruction
	var xmlStandaloneText = document.xmlStandalone ? 'yes' : 'no';
	var xmlTextNode = document.createTextNode('xml version="'+document.xmlVersion+'" encoding="'+document.xmlEncoding+'" standalone="'+xmlStandaloneText+'"');
	var x = wrapNode(xmlTextNode, 'span', 'processing-instruction');
	root.insertBefore(x, root.firstChild);
}

