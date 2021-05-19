'use strict'
const {readFileSync,writeFileSync}=require('fs');
const content=readFileSync('bookname.txt','utf8').split(/\r?\n/).map(item=>item.split(','));
const {fromObj}=require('pengine/arrutil')
const books={};

const totalfreq=content.reduce((acc,item)=>parseInt(item[1])+acc,0);
let accfreq=0;


content.forEach(item=>{
    const freq=parseInt(item[1])/totalfreq;
    const book=item[0].replace(/·.+/,'');
    if (!books[book]) books[book]=0;
    books[book]+=parseInt(item[1]);
})

const arr=fromObj(books,(k,v)=>[k,v]);

arr.sort((a,b)=>b[1]-a[1]);
arr.forEach( item=>{
    accfreq+=item[1]
    item[2]=(accfreq/totalfreq).toFixed(2);
})
writeFileSync('bookfreq.txt',arr.join('\n'),'utf8')