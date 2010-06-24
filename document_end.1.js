
//Event Handler
function expandCollapseHandler(event){
	event.cancelBubble = true;
	if(event.target.getAttribute('class') != 'xml-viewer-tag-start') return true;

	if(!event.target.collapsedNodes)
		event.target.collapsedNodes = event.target.ownerDocument.createElement('div');
	
	if(event.target.collapsedNodes.hasChildNodes())
		event.target.collapsedNodes.childNodes.reParent(event.target.nextSibling);
	else
		event.target.nextSibling.childNodes.reParent(event.target.collapsedNodes);
}


//Node Rendering

function buildNodeWithAttributes(node, tagName, className, targetDocument){
	var result = node.nodeName.toNode(targetDocument, tagName, className);

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
	var isTagInline = false;

	//Create New wrapper node
	var result = targetDocument.createElement('div');
	result.setAttribute('name',node.nodeName);
	result.setAttribute('class', 'xml-viewer-tag');

	if(node.hasChildNodes()){
		var contentEl = targetDocument.createElement('div');
		contentEl.setAttribute('class','xml-viewer-tag-content');

		if(newChildren
			&& newChildren.length > 0
			&& newChildren.filter(function(el){ return (el && el.getAttribute('class') == 'xml-viewer-content-inline');}).length > 0){
			contentEl.setAttribute('class', 'xml-viewer-tag-content-inline');
			isTagInline = true;
		}
		
		newChildren.reParent(contentEl);

		//Attach Nodes
		result.appendChild(buildNodeWithAttributes(node, 'div', 'xml-viewer-tag-start', targetDocument));
		result.appendChild(contentEl);
		result.appendChild(buildEndNode(node, 'div', 'xml-viewer-tag-end', targetDocument));
	}else{
		var s = buildNodeWithAttributes(node, 'div', 'xml-viewer-tag-single', targetDocument);
		result.appendChild(s);
	}
	
	if(isTagInline){ 
		result.setAttribute('class', 'xml-viewer-tag-inline');
	}else{ // Attach collapse handler
		result.firstChild.addEventListener("click", expandCollapseHandler, false);
	}
	
	return result;
}


function processNode(node, targetDocument){
	var children = new Array();
	
	for(var i=0;i<node.childNodes.length;i++)
		children.push(processNode(node.childNodes[i], targetDocument));

	var result;
	
	switch(node.nodeType){
		case 1: //Element
			result = buildElementNode(node, children, targetDocument);
			break;
		case 3: //Text
			if(!node.nodeValue.isWhitespace()){
				result = node.nodeValue.toNode(targetDocument,'div', 'xml-viewer-content');
				if(node.nodeValue.length < 80) result.setAttribute('class', 'xml-viewer-content-inline');
			}
			break;
		case 4: //CData
			result = node.nodeValue.toNode(targetDocument, 'pre', 'xml-viewer-cdata');
			break;
		case 7: //Processing Instruction
			result = (node.nodeName + " " + node.nodeValue).toNode(targetDocument, 'div', 'xml-viewer-processing-instruction');
			break;
		case 8: //Comment
			result = node.nodeValue.toNode(targetDocument, 'pre', 'xml-viewer-comment');
			break; 
	}

	return result;
}

//Transformation
function transformXmlDocument(sDoc, dDoc){
	//Create New Root
	var newRoot = dDoc.createElement('div');
	newRoot.setAttribute('class', 'xml-viewer-document');

	//Add fake XML Processing Instruction
	if(sDoc.xmlVersion){
		var xmlStandaloneText = sDoc.xmlStandalone ? 'yes' : 'no';
		var xmlEncodingText = sDoc.xmlEncoding ? sDoc.xmlEncoding : sDoc.inputEncoding;
		var xmlTextNode = 'xml version="'+sDoc.xmlVersion+'" encoding="'+xmlEncodingText+'" standalone="'+xmlStandaloneText+'" ';
		xmlTextNode = xmlTextNode.toNode(dDoc, 'div', 'xml-viewer-processing-instruction');
		newRoot.appendChild(xmlTextNode);
	}

	//Transform DOM Nodes
	var nodes = sDoc.childNodes;
	for(var i=0;i<nodes.length;i++){
		var result = processNode(nodes[i], dDoc);
		if(result){
			newRoot.appendChild(result);
		}
	}

	return newRoot;
}









if( !document.isChromeViewSourcePage()){
	if(document.isXmlFile())
	{
		//Transform
		var d = transformXmlDocument(document, document);

		//Attach CSS file
		var pi = document.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="' + chrome.extension.getURL('xml.css') + '"');
		document.insertBefore(pi, document.firstChild);

		//Attach the new tree
		if(document.documentElement)
			document.replaceChild(d, document.documentElement);
		else
			document.appendChild(d);
	}
	else if(document.isPlainTextXmlFile())
	{
		var nodes = document.getPlainTextXmlFileNode();
		//Transform
		for(var i=0;i<nodes.length;i++){
			var node = nodes[i];
			var d = node.innerText.toDOM();
			d = transformXmlDocument(d, document);

			//Attach the new tree
			node.parentNode.replaceChild(d, node);
		}

		//Attach CSS file
		document.insertHtmlLinkElement(chrome.extension.getURL('xml.css'));
	}
	
	//Todo: Xml files transfered as html
}
