const {readFileSync,writeFileSync}=require('fs');
const { fromObj,alphabetically0 } = require('pengine/arrutil');
const { pack3 } = require('pengine/packintarr');
const raw=readFileSync('hanyu3/hydzd-sy.txt','utf8').split(/\r?\n/);
// raw.length=10000;
const {createBuilder}=require("pengine/builder");

const build=()=>{ //make sure headword is sorted
	const builder=createBuilder({name:'hc',pagepat:"9ZH"});
    const PY={};
	raw.forEach((line,idx)=>{
        if (idx%1024==0) process.stdout.write('\r'+idx+'/'+raw.length+'   ')
        const [headword,def,py]=line.split('\t');
        const pn=headword; //headword as pn
        if (py) {
            // console.log(builder.pagename.length,py)
            if (!PY[py]) PY[py]=[];
            PY[py].push(builder.pagename.length);
        }
        if (pn) builder.newpage(pn,0,'sy');

        builder.addline(def);
    })
	builder.addbook('sy');//釋義 

    const pyarr=fromObj(PY,(k,v)=>[k,v]);
    pyarr.sort(alphabetically0);

    //音到page索引
    builder.newpage('py',0,'py');
    for (let i=0;i<pyarr.length;i++) {
        // console.log(pyarr[i])
        builder.addline(pack3(pyarr[i][1]));
    }
    builder.addbook('py');
	const payload=[];
    const pinyin=pyarr.map(item=>item[0]).join(',');
	builder.done(payload,{pinyin});
}
build();