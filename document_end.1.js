/*
String.prototype.trim = function(){
	return this.replace(/[\\n\\r\\s]+/gi, "");
};
*/

function wrapProcessingInstruction(node){
	var s = document.createElement('span');
	s.setAttribute('class', 'processing-instruction');
	var p = node.parentNode;
	s.appendChild(node);
	p.appendChild(s, node);
}

function wrapTextNode(node){
	var s = document.createElement('span');
	s.setAttribute('class', 'content');
	var p = node.parentNode;
	s.appendChild(node);
	p.appendChild(s, node);
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
}

function wrap(node){
	if(node.nodeType == 1)
		wrapNonTextNode(node);
	else if(node.nodeType == 3)
		wrapTextNode(node);
}

function processNode(node){
	if(node.hasChildNodes())
		for(var i=0;i<node.childNodes.length;i++)
			processNode(node.childNodes[i]);

	wrap(node);
}


function isViewSource(targetDocument){
	//Only works for non-html documents
	return targetDocument.body != null;
}


if(!isViewSource(document)){
	console.log(window);
	
	//Attach CSS file
	var cssPath = chrome.extension.getURL('test.css');
	var pi = document.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="'+cssPath+'"');
	document.insertBefore(pi, document.firstChild);

	//Add XML Processing Instruction
	
	//Transform DOM Nodes
	var nodes = document.childNodes;
	for(var i=0;i<nodes.length;i++)
		if(nodes[i].nodeType == 1)
			processNode(nodes[i]);
}

