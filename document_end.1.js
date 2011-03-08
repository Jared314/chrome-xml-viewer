Document.prototype.isChromeViewSourcePage = function(){
	return this.body != null 
		&& this.getElementsByClassName("webkit-line-gutter-backdrop").length == 1
		&& this.getElementsByTagName("tbody").length == 1;
};

function expandWithParents(node, predicate){
	if(node.expand) node.expand();
	
	node = node.parentNode;
	while(node != null && !predicate(node))
		node = node.parentNode;
	
	if(node != null)
		expandWithParents(node, predicate);
}

function collapseWithChildren(node){
	var nodes = node.querySelectorAll("div[class~='xml-viewer-tag-collapsible']");
	for(var i=0;i<nodes.length;i++)
		nodes[i].parentNode.collapse();
}

if(!document.isChromeViewSourcePage()){
	chrome.extension.sendRequest({"name": "xmlviewer.getOptions"}, 
		function(response){
			var result = null;
			response.getURL = chrome.extension.getURL;
			if(response.enabled){
				result = etl.executeFirst(document, response);

				//TODO: Refactor this
				//Collapse/Expand level Event Handler
				document.addEventListener('keyup', function(e){ 
						console.log(e);
						var level = e.keyCode - 48;
						if(level < 1 || level > 9 || !e.shiftKey) return;

						var nodes = document.querySelectorAll("div[class~='xml-viewer-tag-collapsible']")
							.filter(function(item){ return item.parentNode && item.parentNode.depth && item.parentNode.depth == level; });

						var collapse = null;
						for(var i=0;i<nodes.length;i++){
							var node = nodes[i].parentNode;
							if(collapse == null)
								collapse = !node.isCollapsed();

							if(collapse)
								collapseWithChildren(node);
							else
								expandWithParents(
									node,
									function(item){return item.depth != null && item.depth < level;}
									);
						}
					
					} , false);
				//Collapse/Expand all Event Handler
				document.addEventListener('keyup', function(e){ 
						var level = e.keyCode - 48;
						if(level != 0 || !e.shiftKey) return;
					
						var nodes = document.querySelectorAll("div[class~='xml-viewer-tag-collapsible']");
							
						var collapse = null;
						for(var i=0;i<nodes.length;i++){
							var node = nodes[i].parentNode;
							if(collapse == null)
								collapse = !node.isCollapsed();

							if(collapse)
								node.collapse();
							else
								node.expand();
						}
					
					} , false);

			}else
				result = etl.extractors.executeFirst(document, response);				

			if(result !== false) chrome.extension.sendRequest({"name": "xmlviewer.showPageAction"}, function(response){});
		});
}
