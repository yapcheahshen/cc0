'use strict'
const {readFileSync,writeFileSync}=require('fs');
const Errata=require('./errata')
/*
    ZI/ZMLB/ZM | XH | YD/PYLB/PY|ZY|DY 
                    |   /GY
                      ZMSY/SYLB/XH|SY|LZ
    ZI/CI/CMLB/CM/CY|LJXH|CMSY/SYLB/XH|SY|LZ
     

    ZI 字及所有詞
    CMLB 詞列表
    
    PYLB 注音群
    PY 拼音
    ZY 注音
    DY ？音

    GY 廣韻/集韻
    
    GL 亦作

    ZMSY 單字釋義群
    SYLB/XH 義項 XH序號
    ZM/XH   音項 XH序號
    SY 釋義

    CI 詞群
    CMSY 詞釋義群
    CM 詞條
    CY 詞名

    LZ 例子
    LJXH 第n個詞

*/
const Sax=require("sax");
const {fromObj, alphabetically0, alphabetically,unique, alphabetically1}=require('pengine/arrutil');
const {compress}=require('pengine/tokentable');
const rawcontent=readFileSync('hanyu3/HYDC1-utf8.txt','utf8').trim()
const lines=rawcontent.split(/\r?\n/);
lines.shift();
// lines.length=10;
const Entries={},LZ=[],Words=[],SelfLink={}, ProperName={},BookName={};
let tagstack=[];
let textpiece='',capture=false, headchar='',headword='', 
sy='',//釋義
lz='',plz='',//例句, 上個例句(檢查重覆) 
homo='', //音項序 (同形異字)
sense=''; //義項

let fields={};
let inSYLB=false,zi=true;
const addBookname=(bookname,ori)=>{
    if (!BookName[bookname]) BookName[bookname]=0;
    BookName[bookname]++;
    return ori;
}

const addEntry=()=>{
    sy=sy.replace(/《([^》]+)》/g,(m,m1)=>addBookname(m1,m))
    lz=lz.replace(/《([^》]+)》/g,(m,m1)=>addBookname(m1,m))
    
    const hc=headchar+homo;
    const hw=headword;
    const w = hw?hw:hc;

    if (Errata[hw]) {
        let replarr=Errata[hw];
        if (!Array.isArray(replarr[0])) replarr=[replarr];
        replarr.forEach(([from,to])=>sy=sy.replace(from,to));
        replarr.forEach(([from,to])=>lz=lz.replace(from,to));
    }
    if (!Entries[w]) {
        Words.push(hw);
        const py=(fields.PY||'')+(fields.GY?('\t'+fields.GY):'');
        Entries[w]=[py,[]]
        fields={}
    }

    if (plz&&plz==lz) lz='';   // console.log("repeated lz",lz.substr(0,20))
    plz=lz;
    Entries[w][1].push([sy,lz]);
    sy='';lz='';
    textpiece='';
}

const onopentag=e=>{
    tagstack.push(e);
    if (e.name=='CY') {
        textpiece='';
    } else if (e.name=='CMLB') {
        capture=false;
    } else if (e.name=='ZI'||e.name=='CI') {
        zi=e.name=='ZI';
        capture=true;
    } else if (e.name=='SYLB') {
        inSYLB=true;
    } else if (e.name=='CM') {
        //homo='';
    }
    // console.log(tagstack.length,e.name);
}
const formatHead=w=>{//同形異音的字， 敦1 ~敦A (最多到A) 改為 敦A ~敦J
    return w.replace(/([\dA])/,(m,m1)=>{
        const code=m1.charCodeAt(0);
        let c=code-0x31; //通常是數字
        if (code==0x41) c=10;
        const s=String.fromCharCode(c+0xFF21); //必須用全形，第二字音才會排在第一音的詞之後
        return s;
    })
}
const onclosetag=ename=>{
    const e=tagstack.pop();
    if (ename=='CMLB') {
        capture=true;
    } else if (ename=='CY' || ename=='ZM') {
        if (ename=='CY'&& capture) headword=formatHead(textpiece);
        else if (ename=='ZM'&& capture) {
            headchar=formatHead(textpiece);
            headword='';
        }
        textpiece='';    
    } else if (ename=='GY'||ename=='GL'||ename=='PY'||ename=='ZY'||ename=='DY') {
        fields[ename]=textpiece;
        textpiece='';
    } else if (ename=='SY') {
        sy=textpiece;
        textpiece='';
    } else if (ename=='XH') {
        if (inSYLB) {
            sense=textpiece;
        } else {
            // 1,2,3,4,5,6,7,8,9,A 敦
            //第一音後的Ａ 省略，否則會排在第一音詞之後
            homo=[,'','Ｂ','Ｃ','Ｄ','Ｅ','Ｆ','Ｇ','Ｈ','Ｉ','Ｊ'][parseInt(textpiece,16)||0];
        }
        textpiece='';
    } else if (ename=='LJXH') {
        textpiece='';
    } else if (ename=='LZ') {
        lz=textpiece;
        textpiece='';
    } else if (ename=='ZI' ||ename=='CI') {
        capture=false;
    } else if (ename=='SYLB' ||ename=='ZMLB') {
        addEntry();
        if (ename=='SYLB') inSYLB=false;
    } else if (e.name=='TP') {
        textpiece=''; //IMAGE filename
    } else if (e.name=='TPBT') {
        textpiece=''; // IMAGE description
    }
    // textpiece='';
}
const ontext=t=>{
    //  replace /\"\"/  , 10 occurances
    if (capture) textpiece+=t;
}
const oncdata=t=>{
    t=t.replace(/<a href=javascript:ShowHyper\(\'[^\']+\'\)[^<]([^<]+)<\/a>/g,(m,m1)=>{
        const w=formatHead(m1);
        if (!SelfLink[w]) SelfLink[w]=0;
        SelfLink[w]++;        
        // return 'NAME'
        return '{'+w+'}'
    });
    t=t.replace(/<u>([^<]+)<\/u>/g,(m,m1)=>{
        if (!ProperName[m1]) ProperName[m1]=0;
        ProperName[m1]++;
        // return 'LINK'
        return '['+m1+']'
    });
    t=t.replace(/“\{/g,'{')
    t=t.replace(/\}”/g,'}')
    textpiece=t;
}
const parse=(rawline,idx)=>{
    if (idx%100==0) process.stdout.write('\r'+idx+'  ')
	let parser=Sax.parser();
	parser.onopentag=onopentag;
	parser.onclosetag=onclosetag;
	parser.oncdata=oncdata;
	parser.ontext=ontext;
	parser.write(rawline);
    tagstack=[];
}
const dumpTokenTables=()=>{
    const pnarr=fromObj(ProperName,(k,v)=>[k,v]);
    pnarr.sort((a,b)=>b[1]-a[1]);

    const linkarr=fromObj(SelfLink,(k,v)=>[k,v]);
    linkarr.sort((a,b)=>b[1]-a[1]);

    let bookarr=fromObj(BookName,(k,v)=>[k,v]);
    bookarr.sort((a,b)=>b[1]-a[1]);
    // writeFileSync('propername.txt',pnarr.join('\n'),'utf8')
    // writeFileSync('linkarr.txt',linkarr.join('\n'),'utf8')
    // writeFileSync('entries.txt',Entries.join('\n'),'utf8');
    // writeFileSync('words.txt',Words.join('\n'),'utf8')
    // unique(Words.sort(alphabetically), dupword);
    // writeFileSync('words-dup.txt',dupword.join('\n'),'utf8')
    // writeFileSync('bookname.txt',bookarr.join('\n'),'utf8')

}
const splitLZ=lz=>{
    return lz.replace(/”([^“《\[]*)/g,'”$1\n').trim().split(/\n/);
}

const dumpEntries=()=>{
    const out=[];   //head word and def
    const quoteout=[]; //head word+sense and lz
    // const arr=fromObj(Entries,(k,v)=>[k,v]);
    const E=[];
    for (let w in Entries) {
        const py=Entries[w][0]?('\t'+Entries[w][0]):'';
        E.push([w, py, Entries[w][1] ])
    }
    E.sort(alphabetically0);
    /* */

    for (let i=0;i<E.length;i++) {
        const hchw=E[i][0].split(/\t/);
        const w=hchw[1]?hchw[1]:hchw[0];
        const py=E[i][1]?('\t'+E[i][1]):'';
        let syword='';
        if (py) out.push([w+py])
        else syword=w;
        const lzword=w;
        const sylz=E[i][2];
        for (let i=0;i<sylz.length;i++) {
            const [sy,lz]=sylz[i];
            if (sy) out.push(syword+'\t'+sy);
            const lz_s=splitLZ(lz);
            if (lz_s.length && lz_s[0]) {
                quoteout.push('|'+lzword+'#'+(i+1)); //一個義項會有多個例句
                for (let j=0;j<lz_s.length;j++) {
                    quoteout.push(lz_s[j]);
                }
            }
            syword=''; //output once
        };
    }
    writeFileSync('hydzd-sy.txt',out.join('\n'),'utf8');
    writeFileSync('hydzd-lz.txt',quoteout.join('\n'),'utf8');
}
const main=()=>{
    lines.forEach(parse);
    //dumpTokenTables();
    dumpEntries();
}
/*
~xxx  LINK        3 byte packint
{xxx  BOOKNAME
}xxx  PROPERNAME   
*/
//TOFIX
/*
<u>楊<u></u>柳</u>輕颺
第三八回：“﹝<u>LINK</u>﹞便斟了半盞，看時，卻是黃酒

沒標記的人名
[唐]褚遂良《山河帖》
[唐]徐景暉

book inside bookname
《《太平廣記》卷二四七引[隋] [侯白]《啟顏錄·石動筩》》

[唐]褚遂良《諫戍高昌疏》

西京賦,370
文選·張衡＜西京賦＞,304
文選·張衡〈西京賦〉,157
文選·西京賦,3
文選·張衡·＜西京賦＞,1
文選·張衡＜西京賦＞“競媚取榮”[三國] [吳] [薛綜]注,1


人名被包入書名
《醫宗金鑒·張仲景＜金匱要略·婦人妊娠＞》
[漢] [張仲景]《金匱要略·婦人雜病》

《[元]本[高明]《琵琶記·伯喈五娘相會》》

霉 [沙汀]《《困獸記》》

repeated entries 
五氣朝元	道教修煉之法。謂煉內丹者不視、不聽、不言、不聞、不動，而五臟之精氣生剋制化，朝歸於黃庭(臍內空處)，叫五氣朝元。
五氣朝元	道教修煉之法。謂煉內丹者不視、不聽、不言、不聞、不動，而五臟之精氣生剋制化，朝歸於黃庭(臍內空處)，謂之“五氣朝元”。

缺連結
也叫繭糖
寫作“胭脂”
涼薯	方言。即豆薯。有的地方也叫地瓜

朝代名頻次大，與人名合併。
[宋] [蘇軾] 改為 [蘇軾（宋）]

疑為「信宮」「渭南」
《史記·秦始皇本紀》：“[始皇]巡[隴西]、[北地]，出[雞頭山]，過[回中]。焉作[信宮渭]南。”

重覆
亦作“奸猾”。亦作“奸滑”。

nested quote
《西游記》第八一回：“[行者]道：‘師父說那裏話！常言道：“一日爲師，終身爲父。”我等與你做徒弟，就是兒子一般。’”

*/


main();
