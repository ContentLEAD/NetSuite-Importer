var fx = 'Brafton Newsitem Integration';
var errmsg = '';
var fx1 = 'createCustomRecord';
NewsitemIntegration();
function NewsitemIntegration()
{
	try
	{
		var apikey = nlapiGetContext().getSetting('SCRIPT', 'custscriptbraftonapikey2');
		var baseurl = nlapiGetContext().getSetting('SCRIPT', 'custscriptbraftonurl2');
        
        var data = baseurl;
        data += apikey+'/'+'news';
       	
//nlapiLogExecution('DEBUG', fx, 'headers : ' + data);
		// For header info   
        var a = new Array();
        a['Content-Type'] = 'text/html';
        a['POST'] = 'POST';
        a['Content-Length'] = data.length;    

		
		var response = nlapiRequestURL(data, null, null);
		var body = response.getBody();
		var responseXML = nlapiStringToXML(response.getBody());
	
		var rawfeeds = nlapiSelectNodes(responseXML, "//news");
		//nlapiLogExecution('DEBUG', fx, 'rawfeeds : '+rawfeeds.length);
		
		var newsListItem = nlapiSelectNodes(responseXML, "//newsListItem");
		nlapiLogExecution( 'DEBUG', fx, 'news_count: '+newsListItem.length);
		
		for(var i =0; (i < newsListItem.length) && (newsListItem); i++)
		{

			var newsitemvalue = nlapiSelectValue(newsListItem[i], "newsListItem");
			var newsid = nlapiSelectValue(newsListItem[i], "id");
			var isrecord = searchItem(newsid);
			//skip creating news if the new record already exist
			if(isrecord)
				continue;
			var publishDate = nlapiSelectValue(newsListItem[i], "publishDate");
			publishDate = changeDateFormat(publishDate);
			var lastModifiedDate = nlapiSelectValue(newsListItem[i], "lastModifiedDate");
			lastModifiedDate = changeDateFormat(lastModifiedDate);
			var headline = nlapiSelectValue(newsListItem[i], "headline");
			nlapiLogExecution( 'DEBUG', fx, 'get basic fields: success');
			
			//-----this is for getting response from the news----------------
			var newsresponse = nlapiRequestURL(data+'/' + newsid, null, null);
			var newsbody = newsresponse.getBody();
			var newsresponsexml = nlapiStringToXML(newsresponse.getBody());
			var newsItem = nlapiSelectNodes(newsresponsexml, "//newsItem");
			var state = nlapiSelectValue(newsItem[0], "state");
			var createdDate = nlapiSelectValue(newsItem[0], "createdDate");
			createdDate = changeDateFormat(createdDate);
			var extract = nlapiSelectValue(newsItem[0], "extract");
			var byline = nlapiSelectValue(newsItem[0], "byline");
			var text = nlapiSelectValue(newsItem[0], "text");
			nlapiLogExecution( 'DEBUG', fx, 'getnews: success');
		
			//------------ to get the url form the photos of the api-----------
			
			var picresponse = nlapiRequestURL(data+'/' + newsid+'/photos/', null, null);
			nlapiLogExecution( 'DEBUG', fx, 'get pic page: success: ' + picresponse);
		
			var picresponsexml = nlapiStringToXML(picresponse.getBody());
			//var instances = nlapiSelectNodes(picresponsexml, "//instances");
			var photo = nlapiSelectNodes(picresponsexml, "//photo");
			var caption = nlapiSelectValue(photo[0], "caption");
			
			var instance = nlapiSelectNodes(picresponsexml, "//instance");
			nlapiLogExecution( 'DEBUG', 'instance', 'instance');
			
			if(instance[0]){
				var url_L = nlapiSelectValue(instance[0], "url");
				nlapiLogExecution('DEBUG', fx, 'url_L : ' + url_L);
				var imageid_L = '';
				var ispicavailable_L = searchimage('image'+newsid+'_L.jpg');
				if(!ispicavailable_L)
				{
					imageid_L=createImgFile(url_L,"L",newsid);
				}
				else
				{
					imageid_L = ispicavailable_L;
				}
				nlapiLogExecution( 'DEBUG', fx, 'get large photo: success '+imageid_L);
			}
			
			if(instance[1]){
				var url_s = nlapiSelectValue(instance[1], "url");
				nlapiLogExecution('DEBUG', fx, 'url_s : ' + url_s);
				var imageid_s = '';
				var ispicavailable_s = searchimage('image'+newsid+'_s.jpg');
				if(!ispicavailable_s)
				{
					imageid_s = createImgFile(url_s,"s",newsid);
				}
				else
				{
					imageid_s = ispicavailable_s;
				}
				nlapiLogExecution( 'DEBUG', fx, 'get small photo: success '+imageid_s);
			}
			//------------------------- end of photos---------------------------
			
			//---------------------------- For Category --------------------------
			var categoryresponse = nlapiRequestURL(data+'/' + newsid+'/categories/', null, null);
			var categoryresponsexml = nlapiStringToXML(categoryresponse.getBody());
			var category = nlapiSelectNodes(categoryresponsexml, "//category");
			var category1 = nlapiSelectValue(category[0], "name");
			if(category[1]){
				var category2 = nlapiSelectValue(category[1], "name");
			}else{
				var category2 = nlapiSelectValue(category[0], "name");
			}
			//nlapiLogExecution('DEBUG', fx, 'category1 : ' + category1+' category2 '+category2);
			
			//---------------------------- End Category --------------------------
			//var isrecord = searchRecord(newsid);
			//var isrecord = searchItem(newsid);

			if(isrecord == false)
			{
				nlapiLogExecution('DEBUG', fx, 'news id: ' + newsid+'   already created : '+isrecord );
				createItem(newsid, publishDate, lastModifiedDate, headline, state, createdDate, extract, text, imageid_L, imageid_s, byline, category1, category2, caption);
			}
			
			
		}
		//update the custom record Brafton_news_list
		var _categories=nlapiGetContext().getSetting('SCRIPT', 'custscriptbraftoncategory')+"|Brafton ALL:0000001";
		var _cat=_categories.split("|");
		var allcat=new Array();
		for (var z=0;z<_cat.length;z++){
			var ListRecordId=searchListRecord(_cat[z].split(":")[1]);
			if(ListRecordId>0){
				var ListRecord=nlapiLoadRecord('customrecord_brafton_news_list', ListRecordId);
			}
			else{
				var ListRecord=nlapiCreateRecord('customrecord_brafton_news_list');
				ListRecord.setFieldValue('custrecord_b_category_id',_cat[z].split(":")[1]);
				ListRecord.setFieldValue('name',_cat[z].split(":")[0]);
			}
			allcat[z]=_cat[z].split(":")[1];
			if(z==_cat.length-1){
				ListRecord.setFieldValue('custrecord_html_list',createliList(allcat));
			}
			else
			{
				var _topublish=createliList(_cat[z].split(":")[1]);
				if(_topublish!="")
						ListRecord.setFieldValue('custrecord_html_list',_topublish);
			}
			var BListid = nlapiSubmitRecord(ListRecord, true, true);
			//nlapiLogExecution('DEBUG', 'update custom record', 'Updated Brafton news list id: ' + BListid);
		}
		
       
	}
	catch(e)
	{
		var err = '';
		if ( e instanceof nlobjError )
		{
			err = 'System error: ' + e.getCode() + '\n' + e.getDetails();
		}
		else
		{
			err = 'Unexpected error: ' + e.toString();
		}
		errmsg += '\n' + err;
		nlapiLogExecution( 'ERROR','ERROR'+ ' 999 Error', errmsg);
		return false;
	}//catch
}

var fx1 = 'createCustomRecord';

function createImgFile(url,size,newsid){
	nlapiLogExecution('DEBUG', 'Start', 'createImgFile function');
	try{
		nlapiLogExecution('DEBUG', 'Start', 'function createImgFile');
		var file_ext="";
		var imageid="";
		if(size=="s"){
			file_ext="_s.jpg";
		}else{
			file_ext="_L.jpg";
		}
		nlapiLogExecution('DEBUG', 'Photo URL', url);
		var imageurlresponse = nlapiRequestURL(url, null, null);
		var body = imageurlresponse.getBody();
		var file = nlapiCreateFile('image'+newsid+file_ext,'JPGIMAGE',body);
		var folderId = 18825;
		file.setFolder(folderId);
		nlapiLogExecution('DEBUG', fx, 'Upload Folder : ' + folderId);
		imageid = nlapiSubmitFile(file);
		return imageid;
		nlapiLogExecution('DEBUG', fx, 'imageid : ' + imageid);
	}catch(e)
	{
		var err = '';
		if ( e instanceof nlobjError )
		{
			err = 'System error: ' + e.getCode() + '\n' + e.getDetails();
		}
		else
		{
			err = 'Unexpected error: ' + e.toString();
		}
		errmsg += '\n' + err;
		nlapiLogExecution( 'ERROR','ERROR'+ 'CreateImageFile Error', errmsg);
		return imageid;
	}//catch
}

function createItem(newsid, publishDate, lastModifiedDate, headline, state, createdDate, extract, text, imageid_L, imageid_s, byline, category1, category2, caption){
	try
	{
		//create categories array base on custom field from the script deployment record
		var _categories = nlapiGetContext().getSetting('SCRIPT', 'custscriptbraftoncategory');
		_categories+="";

                //nlapiLogExecution('DEBUG', fx1, 'categories : '+_categories);
		var catArray=new Array();
		var _cat=_categories.split("|");
		for (var j=0;j<_cat.length;j++){
			catArray[_cat[j].split(":")[0]]=_cat[j].split(":")[1];
		}
		
		if (_categories.indexOf(category1+":")>=0){
		 category1=catArray[category1];
		}else{
			category1=catArray['other'];
		}
		
		if (_categories.indexOf(category2+":")>=0){
			category2=catArray[category2];
		}else{
			category2=catArray['other'];
		}
		
		var itemtemplate = nlapiGetContext().getSetting('SCRIPT', 'custscriptitemtemplate');
		
		
		var customrecord = nlapiCreateRecord('serviceitem');
		customrecord.setFieldValue('itemid',newsid);
		customrecord.setFieldValue('displayname',newsid);
		customrecord.setFieldValue('urlcomponent',headline);
		customrecord.setFieldValue('featureddescription',headline);
		customrecord.setFieldValue('pagetitle',headline);
		customrecord.setFieldValue('storedescription',extract);
		customrecord.setFieldValue('storedisplayname',publishDate);
		/*
		var f_cpar=text.indexOf("</p>");
		var f_br=text.indexOf("<br");
		var author="";
		if(f_br<f_cpar && f_br>0){ 
			author=text.slice(text.indexOf("<p>")+3,f_br);
		}
		else{
			author=text.slice(text.indexOf("<p>")+3,f_cpar);
		}
		if (author.indexOf("By ")!=-1){
			customrecord.setFieldValue('custitem_news_author',author);
		}
		*/
		customrecord.setFieldValue('custitem_news_author',byline);
		customrecord.setFieldValue('custitem_img_cap',caption);
		customrecord.setFieldValue('storedetaileddescription',text);
		customrecord.setFieldValue('storedisplaythumbnail',imageid_s);
		customrecord.setFieldValue('isonline','T');
		customrecord.setFieldValue('storedisplayimage',imageid_L);
		customrecord.setFieldValue('storeitemtemplate',itemtemplate);
		customrecord.setFieldValue('istaxable','F');
		customrecord.setFieldValue('incomeaccount',114);
		customrecord.setFieldValue('expenseaccount',265);


		customrecord.selectLineItem('price', 1); 
		customrecord.setCurrentLineItemMatrixValue('price', 'price', 1, '0');
		customrecord.commitLineItem('price');

		//customrecord.selectNewLineItem('sitecategory'); 
		//customrecord.setCurrentLineItemValue('sitecategory', 'site', 1);
		//customrecord.setCurrentLineItemValue('sitecategory', 'category','Accessories');
		//customrecord.commitLineItem('sitecategory');
		customrecord.setLineItemValue('sitecategory', 'category', 1, category1);
		if(category1!=category2)
			customrecord.setLineItemValue('sitecategory', 'category', 2, category2);
		
		var customid = nlapiSubmitRecord(customrecord, true,true);
	}
	catch(e)
	{
		var err = '';
		if ( e instanceof nlobjError )
		{
			err = 'System error: ' + e.getCode() + '\n' + e.getDetails();
		}
		else
		{
			err = 'Unexpected error: ' + e.toString();
		}
		errmsg += '\n' + err;
		nlapiLogExecution( 'ERROR','ERROR'+ 'CreateItem Error', errmsg);
		
	}//catch

}

function searchItem(newsid)
{
	var filters=[];
	filters[0]= new nlobjSearchFilter('isinactive',null,'is','F');
	filters[1]= new nlobjSearchFilter('itemid',null,'is',newsid);
	var searchresults = nlapiSearchRecord('serviceitem', null, filters, null);
	if(searchresults)
	{
		return true;
	}
	else
	{
		return false;
	}
}

function searchimage(picname)
{
	var filters=[];
	//filters[0]= new nlobjSearchFilter('isinactive',null,'is','F');
	filters[0]= new nlobjSearchFilter('name',null,'is',picname);
	var searchresults = nlapiSearchRecord('file', null, filters, null);
	if(searchresults)
	{
		for(var k=0; k<searchresults.length; k++)
		{
			
			var searchresult = searchresults[ k ];
			var entityid = searchresult.getId();
			return entityid;
		}
	}
	else
	{
		return null;
	}
}

function changeDateFormat(date)
{
	date = date.substring(0,10);
	var splitteddate = date.split('-')
	var months=["","January","February","March","April","May","June","July","August","September","October","November","December"];
	var year  = splitteddate[0];
	var month =months[ parseInt(splitteddate[1],10)];
	var day = parseInt(splitteddate[2],10);
	var init="th";
	if (day==1 || day ==21 || day==31){
		init="st";
	}
	if (day==2 || day ==22 ){
		init="nd";
	}
	if (day==3 || day ==23){
		init="rd";
	}
	return month+' '+day+'<span class="daysuf">'+init+'</span> '+year;
	
}

function searchListRecord(cat_id)
{
	var filters=[];
	filters[0]= new nlobjSearchFilter('custrecord_b_category_id',null,'is',cat_id);
	var searchresults = nlapiSearchRecord('customrecord_brafton_news_list', null, filters, null);
	if(searchresults)
	{
		return searchresults[0].id;
	}
	else
	{
		return -1;
	}
}

function createliList(cat_ids)
{
	var li_string="";	
	var filters=[];
	//filters[0]= new nlobjSearchFilter('isinactive',null,'is','F');
	filters[0]= new nlobjSearchFilter('category',null, 'anyof', cat_ids);
	var html = nlapiGetContext().getSetting('SCRIPT', 'custscript_list_html_template');
	var searchresults = nlapiSearchRecord('item', 'customsearch349', filters, null);
	html=html.replace(/&lt;/g,"<");
	html=html.replace(/&gt;/g,">");
	if(searchresults){
		for(var n=0;n<searchresults.length && n<5;n++){
			var temp=html;
			temp=temp.replace(/{B1}/g,searchresults[n].getText('storedisplaythumbnail'));
			temp=temp.replace(/{B2}/g,searchresults[n].getValue('featureddescription'));
			temp=temp.replace(/{B3}/g,searchresults[n].getValue('storedisplayname'));
			temp=temp.replace(/{B4}/g,searchresults[n].getValue('custitem_news_author'));
			temp=temp.replace(/{B5}/g,searchresults[n].getValue('storedescription'));
			temp=temp.replace(/{B0}/g,searchresults[n].getValue('urlcomponent'));
			li_string+=temp;
		}
	}
//nlapiLogExecution( 'DEBUG','Create_list', li_string.length);
	return li_string;

}