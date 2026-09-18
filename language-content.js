(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.LanguageContent=f()})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
const cast=[{id:'rabbit',name:'小兔',kind:0,voice:'zh-CN-XiaoxiaoNeural'},{id:'xin',name:'李欣袆',kind:1,voice:'zh-CN-XiaoyiNeural'},{id:'george',name:'乔治哥哥',kind:2,voice:'zh-CN-YunxiNeural'},{id:'yang',name:'杨诗然',kind:3,voice:'zh-TW-HsiaoChenNeural'},{id:'tang',name:'汤葭荟',kind:4,voice:'zh-TW-HsiaoYuNeural'}];
const rounds=[
{id:'rabbit-self',title:'风筝开工啦',cast:['rabbit','xin','george'],speaker:'rabbit',listener:'xin',word:'我',target:'rabbit',intro:['welcome','r0'],request:'r0',hint:'h0',win:'w0',place:'荷塘工坊'},
{id:'your-turn',title:'谁来拿风筝？',cast:['george','yang','xin'],speaker:'xin',listener:'yang',word:'你',target:'yang',intro:['r1'],request:'r1',hint:'h1',win:'w1',place:'桃花小径'},
{id:'ask-him',title:'请哥哥试飞',cast:['yang','tang','george'],speaker:'yang',listener:'tang',word:'他',target:'george',intro:['r2'],request:'r2',hint:'h2',win:'w2',place:'湖边试飞场'},
{id:'another-me',title:'换个人说话',cast:['xin','george','rabbit'],speaker:'george',listener:'xin',word:'我',target:'george',intro:['r3'],request:'r3',hint:'h3',win:'w3',place:'竹林风口'},
{id:'another-you',title:'把快乐传下去',cast:['rabbit','yang','tang'],speaker:'tang',listener:'rabbit',word:'你',target:'rabbit',intro:['r4'],request:'r4',hint:'h4',win:'w4',place:'夕阳荷塘'}];
const lines={
welcome:['rabbit','小兔说，珞伊，来放风筝呀！听伙伴的话，点一个伙伴，把风筝送过去。'],
r0:['rabbit','请把风筝给我，我来系尾巴。'],
r1:['xin','李欣袆说，杨诗然，风筝给你，你来拿着。'],
r2:['yang','杨诗然说，汤葭荟，哥哥会试飞，把风筝给他吧。'],
r3:['george','乔治哥哥说，李欣袆，请把风筝给我，我来收线。'],
r4:['tang','汤葭荟说，小兔，风筝给你，你来放飞。'],
h0:['rabbit','看看谁正在说话。说话的人说“我”，就是指自己。'],
h1:['xin','我在对杨诗然说话。“你”，指我正在对话的伙伴。'],
h2:['yang','我和汤葭荟正在说话。“他”，指我们提到的乔治哥哥。'],
h3:['george','这次换我说话了。“我”指说话的自己，不总是小兔哦。'],
h4:['tang','看看我正在对谁说话。这次，“你”指小兔。'],
w0:['rabbit','谢谢珞伊！你听懂“我”指说话的自己，尾巴系好啦！'],
w1:['xin','送到啦！你找到了我正在对话的伙伴，“你”就是杨诗然。'],
w2:['yang','你把风筝送给了我们提到的哥哥，他把风筝放起来啦！'],
w3:['george','谢谢！换我说话，“我”就指我了。你发现了这个变化！'],
w4:['tang','你听懂了新的对话！小兔接到风筝，珞伊，我们一起放飞吧！'],
retry:['rabbit','风筝送到这里啦。再看看谁在说话、对谁说话，也可以点灯泡听线索。'],
director:['rabbit','小兔说，珞伊当导演啦！选谁说话、对谁说，再选“我”或“你”。点放飞，看看风筝会找谁。'],
finish:['rabbit','小兔说，珞伊，风筝飞起来啦！想编自己的对话，就来当小导演；也可以先休息。']};
for(const c of cast){lines[c.id+'Me']=[c.id,c.name+'说，请把风筝给我。'];lines[c.id+'You']=[c.id,c.name+'说，风筝给你。'];}
return {version:1,cast,rounds,lines,pinyin:{'我':'wǒ','你':'nǐ','他':'tā'},lesson:'人教版2024 · 一上语文《天地人》第8页选练'};
});
