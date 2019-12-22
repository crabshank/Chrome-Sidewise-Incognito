function getUrl(tab){
	if(tab.pendingUrl!=null){
	return (tab.url=="")?tab.pendingUrl:tab.url;
	}else{
		
		if(tab.url!=null){
			return tab.url;
		}else{
			return tab; //if tab.url not there
		}
	
	}
}