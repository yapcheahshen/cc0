'use strict'
const {readFileSync,writeFileSync}=require('fs')

const extract=(fn,lines)=>{
    let emit=false, pn='';
    const text=[];
    const comm=[];
    lines.forEach(line=>{
        if (line=='|') {
            emit=false;
            return;
        }
        const m=line.match(/^\|(\d+\.\d+)/);
        if (m) {
            emit=true;
            pn=m[1];
//            if (out[pn]) throw 'repeat pn '+pn;
            text.push(pn+'|');
        } else if (emit) {
            if (text[text.length-1].endsWith('|')) text[text.length-1]+=line;
            else text.push(line);
        } else {
            if (line) comm.push(pn+'\t'+line);
        }
    })
    writeFileSync('../'+fn+'-books/abhas.orig.txt',text.join('\n'),'utf8')
    writeFileSync('../'+fn+'-books/abhas0a.orig.txt',comm.join('\n'),'utf8')
}

extract('zh',readFileSync('./abhas-zh.txt','utf8').split(/\r?\n/));
extract('en',readFileSync('./abhas-en.txt','utf8').split(/\r?\n/));
