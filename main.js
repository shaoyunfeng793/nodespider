const request = require('superagent')
require('superagent-charset')(request)
const cheerio = require('cheerio')
const download = require('download')
const mkdirp = require('mkdirp')
const async = require('async')

var linkArr = [],
	domain = 'https://www.tupianzj.com',
	saveImgPath = './img/';

let config = {};
	config.num = 3;

request('GET', `https://www.tupianzj.com/meinv/xiezhen/list_179_${config.num}.html`) 
  .end(function(err, res){
    if (!err) {

    	let $ = cheerio.load(res.text);

    	let links = $('.list_con_box_ul li>a');

    	for (let i = 0; i < links.length; i++) {
    		linkArr.push(domain + $(links[i]).attr('href'))
    	}
    	
   		async.mapLimit(linkArr,1,async function(url) {

    		let { text } = await request(url).charset('gbk'),
    			$ = cheerio.load(text),
    		  	$pages = $('.pages li>a'),
    		 	page_num = $pages.first().text().replace(/\D/g,''),
				item_link = $pages.eq(-2).attr('href'),
				itemLinkArr = [],
				itemDomain = url.replace(/\d+\.html/,''),
				dirname = saveImgPath + $('.list_con>h1').text();
			//创建目录
    		mkdirp(dirname);
    		for (let i = 1; i <= page_num; i++) {

    			let sign = i === 1 ? '' : '_'+i;
    			let link = itemDomain + item_link.replace(/_\d+/,sign);
    			itemLinkArr.push(link);
    		}

    		return {itemLinkArr,dirname};
    		
		},(err, results) => {

    		if (err) throw err

    		let allLinkArr = [],
    			index = 0,
    			count = 0,
    			indexManager = {};
     		for (let i = 0; i < results.length; i++) {
     			index += results[i].itemLinkArr.length;
    			allLinkArr = allLinkArr.concat(results[i].itemLinkArr);
    			indexManager[index] = results[i].dirname;
    			
    		}
 
			async.mapLimit(allLinkArr,1,async function(url){
	
				let dirIndex = getDirIndex(++count,indexManager);
    			let { text } = await request(url);
    			let $ = cheerio.load(text);
    			let	img_src = $('#bigpic img').attr('src');
    			download( img_src, indexManager[dirIndex]); 
  				
    		},(err,results) => {
    			if (err) throw err
    		})
	    		

		})
    	
    }else{
    	console.log(err)
    }
});

function getDirIndex(count,obj){
	for (let key in obj) {

		if(count <= key){
			return key;
		}
	}
}