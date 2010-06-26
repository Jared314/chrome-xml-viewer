
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
