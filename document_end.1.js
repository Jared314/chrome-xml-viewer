

String.prototype.toDOM = function(){
	return new DOMParser().parseFromString(this, "text/xml");
};

function buildNodeWithAttributes(node, tagName, className, targetDocument){
	var result = node.nodeName.toNode(targetDocument, tagName, className);

	if(node.hasAttributes())
		result.appendChild(
			node.attributes.toNode('span', 'webkit-html-attribute-name', 'webkit-html-attribute-value', 'webkit-html-attribute', 'webkit-html-attribute-set')
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
	result.setAttribute('class', 'tag');

	if(node.hasChildNodes()){
		var contentEl = targetDocument.createElement('div');
		contentEl.setAttribute('class','tag-content');

		if(newChildren
			&& newChildren.length > 0
			&& newChildren.filter(function(el){ return (el && el.getAttribute('class') == 'content-inline');}).length > 0){
			contentEl.setAttribute('class', 'tag-content-inline');
			isTagInline = true;
		}
		
		newChildren.reParent(contentEl);

		//Attach Nodes
		result.appendChild(buildNodeWithAttributes(node, 'div', 'tag-start', targetDocument));
		result.appendChild(contentEl);
		result.appendChild(buildEndNode(node, 'div', 'tag-end', targetDocument));
	}else{
		var s = buildNodeWithAttributes(node, 'div', 'tag-single', targetDocument);
		result.appendChild(s);
	}
	
	if(isTagInline) 
		result.setAttribute('class', 'tag-inline');
	else{ // Attach collapse handler
		result.firstChild.addEventListener("click", expandCollapseHandler, false);
	}
	if(node.parentNode)
		node.parentNode.replaceChild(result, node);
	
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
				result = node.nodeValue.toNode(targetDocument,'div', 'content');
				if(node.nodeValue.length < 80)result.setAttribute('class', 'content-inline');
			}
			break;
		case 4: //CData
			result = node.nodeValue.toNode(targetDocument, 'pre', 'cdata');
			break;
		case 7: //Processing Instruction
			result = (node.nodeName + " " + node.nodeValue).toNode(targetDocument, 'div', 'processing-instruction');
			break;
		case 8: //Comment
			result = node.nodeValue.toNode(targetDocument, 'pre', 'webkit-html-comment');
			break; 
	}

	
	return result;
}



function isViewSource(targetDocument){
	return targetDocument.body != null 
		&& targetDocument.getElementsByClassName("webkit-line-gutter-backdrop").length == 1
		&& targetDocument.getElementsByTagName("tbody").length == 1;
}


function isXmlFile(targetDocument){
	return targetDocument.xmlVersion;
}

function isXmlLikeFile(targetDocument){
	return targetDocument.body.childNodes.length == 1
		&& targetDocument.body.firstChild.nodeName == "PRE"
		&& targetDocument.body.firstChild.innerText
		&& (targetDocument.body.firstChild.innerText.match(/^\s*<\?xml\s/mi) || "").length > 0;
}




//Event Handler
function expandCollapseHandler(event){
	event.cancelBubble = true;
	if(event.target.getAttribute('class') != 'tag-start') return true;

	if(!event.target.collapsedNodes)
		event.target.collapsedNodes = document.createElement('div');
	
	if(event.target.collapsedNodes.hasChildNodes())
		event.target.collapsedNodes.childNodes.reParent(event.target.nextSibling);
	else
		event.target.nextSibling.childNodes.reParent(event.target.collapsedNodes);
}






//Files with xml mimetype or xml extension 
function transformFullXmlDocument(){
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
		var result = processNode(nodes[i], document);
		if(result) newRoot.appendChild(result);
	}
	
	
	//Attach CSS file
	var cssPath = chrome.extension.getURL('xml.css');
	var pi = document.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="'+cssPath+'"');
	document.insertBefore(pi, document.firstChild);

	//Attach the new tree
	document.appendChild(newRoot);
}




function getHead(targetDocument){
	if(targetDocument.head) return targetDocument.head;
	return targetDocument.createElement('head');
}


//Text files in "raw" view but have the xml header
function transformXmlLikeDocument(){
	var d = document.body.firstChild.innerText.toDOM();

	var newRoot = document.createElement('div');
	newRoot.setAttribute('class', 'document');

	//Add fake XML Processing Instruction
	if(d.xmlVersion){
		var xmlStandaloneText = d.xmlStandalone ? 'yes' : 'no';
		var xmlEncodingText = d.xmlEncoding ? d.xmlEncoding : d.inputEncoding;
		var xmlTextNode = 'xml version="'+d.xmlVersion+'" encoding="'+xmlEncodingText+'" standalone="'+xmlStandaloneText+'" ';
		xmlTextNode = xmlTextNode.toNode(document, 'div', 'processing-instruction');
		newRoot.appendChild(xmlTextNode);
	}


	//Transform DOM Nodes
	var nodes = d.childNodes;
	for(var i=0;i<nodes.length;i++){
		var result = processNode(nodes[i], d);
		if(result){
			result = document.importNode(result, true);
			newRoot.appendChild(result);
		}
	}

	
	//Attach CSS file
	var cssPath = chrome.extension.getURL('xml.css');
	var head = getHead(document);
	var link = document.createElement('link');
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = cssPath;
	head.appendChild(link);
	var html = document.getElementsByTagName("html")[0];
	html.insertBefore(head, html.firstChild);

	//Attach the new tree
	document.body.replaceChild(newRoot, document.body.firstChild);
}

//Todo: Xml files transfered as html








if( !isViewSource(document)){
	if(isXmlFile(document))
		transformFullXmlDocument();
	else if(isXmlLikeFile(document))
		transformXmlLikeDocument();
}
