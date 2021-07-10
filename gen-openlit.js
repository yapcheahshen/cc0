//parse and convert open-lit zip 
const booknames=require('./openlit-booknames');
const ChineseNumber=require('./chinesenumber');
const fs=require('fs')
const extractChapters=raw=>{
	const out=[];
	const pat=/<a href="(\d+)\.html" target="right_Article" >(.+?)<\/a>/g
	raw.replace(pat,(m,fn,cname)=>out.push(fn));
	return out;
}
const extractReadme=raw=>{
	const p1=raw.indexOf('</h4>');
	const p2=raw.indexOf('<hr>');
	const readme=raw.substr(0,p2).substr(p1+5).trim().replace(/<br>/g,'\n').replace(/<br \/>/g,'\n');
	if (!readme.length) {
		throw "error readme ";
	}
	return readme;
}
/*
const replaceChapterNumber=str=>{
	return str
	.replace(/<h4><font color=navy>卷?第([一二三四五六七八九十百千]+)/,(m,m1)=>new ChineseNumber(m1).toInteger()+'|')
}
*/
const extractContent=raw=>{
	const p1=raw.indexOf('<h4><font color=navy>');
	const p2=raw.lastIndexOf('<hr>');
	if (p1==-1||p2==-1) throw "error content";

	const content=raw.substr(0,p2).substr(p1).trim()
		.replace(/○/g,'〇')
		.replace(/<br>/g,'\n').replace(/<br \/>/g,'\n');
		//.replace(/<\/font><\/h4>/g,''));

	return content;
}
const AdmZip = require('adm-zip');

const readmes={};

const extractZip=fseq=>{
	// reading archives
	const zip = new AdmZip("../open-lit/lit_"+fseq+'.zip');
	const zipEntries = zip.getEntries(); // an array of ZipEntry records

	let cnames=[],contents=[];
	zipEntries.forEach(function(zipEntry) {
	    // console.log(zipEntry.toString()); // outputs zip entries information
		if (zipEntry.entryName == "readme.html") {
			readmes[fseq]=extractReadme(zipEntry.getData().toString('utf8'));
		} else if (zipEntry.entryName=='index.html') {
			cnames=extractChapters(zipEntry.getData().toString('utf8'));
		} else {
			contents[zipEntry.entryName.replace(".html","")]=extractContent(zipEntry.getData().toString('utf8'))
		}
	});

	const chapters=[];

	cnames.forEach((ch,idx)=>{
		chapters.push( (idx+1)+'|'+contents[ch].replace(/\r?\n/g,'\n') );
	});
	return chapters;
}

// const redo={674:true}
for (let key in booknames) {
	// if (!redo[key]) continue;
	process.stdout.write('\r'+key+'     ');
	const chapters=extractZip(key);
	const content=chapters.join('\n');
	
	fs.writeFileSync('openlit/'+key+'.txt',content,'utf8')
}

//fs.writeFileSync('readmes.txt',JSON.stringify(readmes),'utf8');