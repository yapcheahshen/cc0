const {readFileSync,writeFileSync}=require('fs');
const raw=readFileSync('hanyu3/hydzd-raw.txt','utf8').split(/\r?\n/);
raw.length=1000;
const {createBuilder}=require("pengine/builder");

const build=()=>{ //make sure headword is sorted
	const builder=createBuilder({name:'hc',pagenameastoken:true});
    const bk='lz'; //釋義 
	raw.forEach((line,idx)=>{
        const [headword,def,lz]=line.split('\t');
        const pn=headword; //headword as pn
        if (pn) {
            builder.newpage(pn,0,bk);
        }
        builder.addline(def+(lz?('\t'+lz):''));
    })
	builder.addbook(bk);
	const payload=[];//for PTS
	builder.done(payload,{});
}
build();