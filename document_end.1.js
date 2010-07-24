Document.prototype.isChromeViewSourcePage = function(){
	return this.body != null 
		&& this.getElementsByClassName("webkit-line-gutter-backdrop").length == 1
		&& this.getElementsByTagName("tbody").length == 1;
};

if(!document.isChromeViewSourcePage()){
	chrome.extension.sendRequest({"name": "xmlviewer.getOptions"}, function(response){
		var result = etl.executeFirst(document, response);
		});
}
