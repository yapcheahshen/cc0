'use strict'
const fs=require("fs");
const {createBuilder,getParaname}=require("pengine/builder");
const lang=process.argv[2]||'zh';
const paranames_folder='paranames/';
const {NOTESEP,HEADSEP}=require('pengine/textutil')
// build db for parallel mapping to cs0m
let folder=lang+"-books/";
const booknames=['abhas']

const build=()=>{
	let prevbk='',prevg=0,pbk='';
	const paranames=[];
	const builder=createBuilder({name:"cc0"+lang});
	booknames.forEach(bk=>{
        let prevpn=0;
		const fn=folder+bk+".txt";
		pbk=bk;
		if (!fs.existsSync(fn))return;
		const rawlines=fs.readFileSync(fn,'utf8').split(/\r?\n/);
		for (var i=0;i<rawlines.length;i++) {
			let content=rawlines[i];
			if (prevbk&&bk!==prevbk){
				builder.newpage(-1,g);
				paranames.push( getParaname(lang+'-'+paranames_folder+prevbk+'.txt') );
				builder.addbook(prevbk);
			}
			prevbk=bk;
			const at2=content.indexOf(HEADSEP);
			const at4=content.indexOf(NOTESEP);
			if (at2>-1 && at2!==at4) {
                const m=content.match(/^(\d+)\.(\d+)/);
                if (m) {
                    const g=parseInt(m[1]),  pn=parseInt(m[2]);
                    builder.newpage(pn,g,bk);
                    prevpn=pn;
                    prevg=g;
                }
                content=content.substr(at2+1);
            }
            builder.addline(content);
        }
	})
	paranames.push( getParaname(lang+'-'+paranames_folder+prevbk+'.txt') );
	builder.newpage(-1,prevg,pbk);
	builder.addbook(prevbk);
	const payload=paranames;
	builder.done(payload,{});
}

build();