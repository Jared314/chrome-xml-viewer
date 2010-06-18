

function buildNodeWithAttributes(node, tagName, className){
	var result = node.nodeName.toNode(document,tagName, className);

	if(node.hasAttributes())
		result.appendChild(
			node.attributes.toNode('span', 'webkit-html-attribute-name', 'webkit-html-attribute-value', 'webkit-html-attribute', 'webkit-html-attribute-set')
			);

	return result;
}

function buildEndNode(node, tagName, className){
	return node.nodeName.toNode(document, tagName, className);
}


function buildElementNode(node, newChildren){
	var isTagInline = false;

	//Create New wrapper node
	var result = document.createElement('div');
	result.setAttribute('name',node.nodeName);
	result.setAttribute('class', 'tag');

	if(node.hasChildNodes()){
		var contentEl = document.createElement('div');
		contentEl.setAttribute('class','tag-content');

		if(newChildren
			&& newChildren.length > 0
			&& newChildren.filter(function(el){ return (el && el.getAttribute('class') == 'content-inline');}).length > 0){
			contentEl.setAttribute('class', 'tag-content-inline');
			isTagInline = true;
		}
		
		newChildren.reParent(contentEl);

		//Attach Nodes
		result.appendChild(buildNodeWithAttributes(node, 'div', 'tag-start'));
		result.appendChild(contentEl);
		result.appendChild(buildEndNode(node, 'div', 'tag-end'));
	}else{
		var s = buildNodeWithAttributes(node, 'div', 'tag-single');
		result.appendChild(s);
	}
	
	if(isTagInline) result.setAttribute('class', 'tag-inline');
	
	if(node.parentNode)
		node.parentNode.replaceChild(result, node);

	return result;
}


function processNode(node){
	var children = new Array();
	
	for(var i=0;i<node.childNodes.length;i++)
		children.push(processNode(node.childNodes[i]));

	var result;

	if(node.nodeType == 1) //Element
		result = buildElementNode(node, children);
	else if(node.nodeType == 3){ //Text
		if(!node.nodeValue.isWhitespace()){
			result = node.nodeValue.toNode(document,'div', 'content');
			if(node.nodeValue.length < 80)result.setAttribute('class', 'content-inline');
		}
	}else if(node.nodeType == 4) //CData
		result = node.nodeValue.toNode(document, 'pre', 'cdata');
	else if(node.nodeType == 7) //Processing Instruction
		result = (node.nodeName + " " + node.nodeValue).toNode(document, 'div', 'processing-instruction');
	else if(node.nodeType == 8){ //Comment
		result = node.nodeValue.toNode(document, 'pre', 'webkit-html-comment');
	}
	return result;
}



function isViewSource(targetDocument){
	//Only works for non-html documents
	return targetDocument.body != null;
}















if(!isViewSource(document)){
	console.log(window);

	var newRoot = document.createElement('div');
	newRoot.setAttribute('class', 'document');

	//Add fake XML Processing Instruction
	if(document.xmlVersion){
		var xmlStandaloneText = document.xmlStandalone ? 'yes' : 'no';
		var xmlEncodingText = document.xmlEncoding ? document.xmlEncoding : document.inputEncoding;
		var xmlTextNode = 'xml version="'+document.xmlVersion+'" encoding="'+xmlEncodingText+'" standalone="'+xmlStandaloneText+'" ';
		xmlTextNode = xmlTextNode.toNode(document,'div', 'processing-instruction');
		newRoot.appendChild(xmlTextNode);
	}
	
	//Transform DOM Nodes
	var nodes = document.childNodes;
	for(var i=0;i<nodes.length;i++){
		var result = processNode(nodes[i]);
		if(result) newRoot.appendChild(result);
	}
	
	
	//Attach CSS file
	var cssPath = chrome.extension.getURL('xml.css');
	var pi = document.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="'+cssPath+'"');
	document.insertBefore(pi, document.firstChild);

	//Attach the new tree
	document.appendChild(newRoot);
	
	//
}
