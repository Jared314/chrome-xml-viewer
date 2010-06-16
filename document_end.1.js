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

function formatAttributes(node){
	var result = null;
	if(node.hasAttributes())
		for(var i=0;i<node.attributes.length;i++){
			node.attributes
		}
	
	return result;
}

function formatNode(node){
	var result = document.createTextNode(node.nodeName.toLowerCase());
	if(node.hasAttributes()){
		var attrs = formatAttributes(node);
		if(attrs) result.appendChild(attrs);
	}
	
	return result;
}

function formatEndNode(node){
	return document.createTextNode(node.nodeName.toLowerCase());
}

function wrapNonTextNode(node){
	if(node.hasChildNodes()){
		var s = document.createElement('span');
		s.setAttribute('class', 'tag start');
		s.appendChild(formatNode(node));
		node.insertBefore(s, node.firstChild);
		
		var e = document.createElement('span');
		e.setAttribute('class', 'tag end');
		e.appendChild(formatEndNode(node));
		node.appendChild(e);
	}else{
		var s = document.createElement('span');
		s.setAttribute('class', 'tag start single');
		s.appendChild(formatNode(node));
		node.appendChild(s);
	}
	
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
		return wrapNonTextNode(node);
	else if(node.nodeType == 3) //Text
		return wrapNode(node, 'span', 'content');
	else if(node.nodeType == 4) //CData
		return wrapNode(node, 'pre', 'cdata');
}



function isViewSource(targetDocument){
	//Only works for non-html documents
	return targetDocument.body != null;
}

if(!isViewSource(document)){
	
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
	var root = wrapNode(document.documentElement, 'div', 'document');
	
	//Add fake XML Processing Instruction
	var xmlStandaloneText = document.xmlStandalone ? 'yes' : 'no';
	var xmlTextNode = document.createTextNode('xml version="'+document.xmlVersion+'" encoding="'+document.xmlEncoding+'" standalone="'+xmlStandaloneText+'" ');
	var x = wrapNode(xmlTextNode, 'span', 'processing-instruction');
	root.insertBefore(x, root.firstChild);
	
}
/*
else{
	//Todo: add processing instructions to the view-source
	//		currently does not show correct xml version, encoding, and standalone value
	
	var tbody = document.getElementsByTagName("tbody")[0];
	if(tbody && tbody.hasChildNodes()){
	
		var row = document.createElement("TR");
		var td1 = document.createElement("TD");
		td1.setAttribute('class', 'webkit-line-number');
		row.appendChild(td1);
		
		var td2 = document.createElement("TD");
		td2.setAttribute('class', 'webkit-line-content');
		row.appendChild(td2);
		
		//Add fake XML Processing Instruction
		var xmlStandaloneText = document.xmlStandalone ? 'yes' : 'no';
		var xmlTextNode = document.createTextNode('<?xml version="'+document.xmlVersion+'" encoding="'+document.xmlEncoding+'" standalone="'+xmlStandaloneText+'" ?>');
		var x = wrapNode(xmlTextNode, 'SPAN', 'webkit-html-tag');
		td2.appendChild(x);
		
		tbody.insertBefore(row, tbody.firstChild);
	}

}
*/
