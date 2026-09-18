(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RescueContent=factory()})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const cast=[{name:'小兔',role:'rabbit',animal:'小兔'},{name:'李欣袆',role:'xin',animal:'小鸭'},{name:'乔治哥哥',role:'george',animal:'小熊'},{name:'杨诗然',role:'yang',animal:'小猫'},{name:'汤葭荟',role:'tang',animal:'小狐'}];
 const levels=[
  {id:'picnic',title:'去对岸野餐',ids:[0,1,2,3,4],seats:3,kind:'free',rule:'把等船的伙伴接到对岸',intro:['welcome','controls'],hint:'hintFree',win:'winFree',topic:'5的整体与部分'},
  {id:'curtain',title:'小兔先开场',ids:[0,1,2,3,4],seats:3,kind:'first',who:0,rule:'第一趟要有小兔',intro:['firstRule'],hint:'hintFirst',win:'winFirst',topic:'数量分合；先后顺序拓展'},
  {id:'friends',title:'结伴看荷花',ids:[0,1,3,4],seats:2,kind:'pair',pair:[1,3],rule:'李欣袆和杨诗然坐同一趟',intro:['pairRule'],hint:'hintPair',win:'winPair',topic:'4的分合；条件推理拓展'},
  {id:'smallboat',title:'小船来接班',ids:[0,1,2,3,4],seats:2,kind:'budget',maxTrips:3,rule:'两个座位，三趟以内接齐',intro:['smallRule'],hint:'hintBudget',win:'winBudget',topic:'5的分批组成；趟数规划拓展'},
  {id:'basket',title:'带上野餐篮',ids:[0,1,2,4],seats:3,kind:'cargo',rule:'第一趟篮子占一个座位',intro:['basketRule'],hint:'hintBasket',win:'winBasket',topic:'3的分合；剩余船位推理'},
  {id:'home',title:'一起看夕阳',ids:[0,3,4],seats:3,kind:'budget',maxTrips:1,rule:'一趟接齐三位伙伴',intro:['homeRule'],hint:'hintHome',win:'winHome',topic:'3的整体与部分；提前规划'}
 ];
 const voices={captain:'zh-CN-YunyangNeural',rabbit:'zh-CN-XiaoxiaoNeural',xin:'zh-CN-XiaoyiNeural',george:'zh-CN-YunxiNeural',yang:'zh-TW-HsiaoChenNeural',tang:'zh-TW-HsiaoYuNeural'};
 // Display and speech share one source, including role names.
 const lines={
  welcome:['小兔','小兔说，珞伊，对岸开野餐啦！点伙伴上船，再点一下就能下船。','rabbit'],
  controls:['王老师','王老师说，我来开船。三个座位，坐不下的等下一趟。安排好了，就点出发。','captain'],
  firstRule:['小兔','小兔说，我要先去铺野餐垫！第一趟带上我，其他伙伴也要接过去哦。','rabbit'],
  pairRule:['李欣袆','李欣袆说，我想和杨诗然坐同一趟，一起看荷花。船有两个座位，把大家都接过去吧！','xin'],
  smallRule:['乔治哥哥','乔治哥哥说，小船来接班啦！只有两个座位，五个伙伴，试试三趟以内都接到。','george'],
  basketRule:['汤葭荟','汤葭荟说，四个伙伴去野餐。篮子先占一个座位，第一趟还能坐几位？送到后就腾出座位啦！','tang'],
  homeRule:['杨诗然','杨诗然说，三个伙伴想一起看夕阳。船有三个座位，这次一趟就出发！','yang'],
  empty:['王老师','先点一位等船的伙伴，上船再出发吧。','captain'],
  full:['王老师','乘客座位坐满啦！可以出发，也可以点船上的伙伴，下船换一位。','captain'],
  hintFree:['王老师','数数船上的伙伴，再看看岸上。每次想接谁，由你来安排。','captain'],
  hintFirst:['小兔','别忘啦，我要先到对岸铺垫子。第一趟带上我就行。','rabbit'],
  hintPair:['李欣袆','我和杨诗然要坐在同一条船上。看看船上，是不是我们两个人？','xin'],
  hintBudget:['王老师','看看剩下的伙伴和船位。剩下的趟数够吗？也可以撤回上一趟，换个安排。','captain'],
  hintBasket:['汤葭荟','看见船上的篮子了吗？它占一个座位。篮子到岸后，三个座位就都能坐伙伴了。','tang'],
  hintHome:['杨诗然','这次只去一趟。岸上还在等的伙伴，也要一起上船哦。','yang'],
  firstError:['小兔','我还没上船呢，第一趟要带上我去铺野餐垫。','rabbit'],
  pairError:['李欣袆','等一下，我和杨诗然要同船。可以让我们一起上船，也可以先接其他伙伴。','xin'],
  budgetMiss:['王老师','大家都到了。这次多跑了几趟也没关系，可以换个办法，重新安排。','captain'],
  arrived:['小兔','到岸啦！小船回来接下一批伙伴。','rabbit'],
  cargoArrived:['汤葭荟','篮子送到啦！现在三个座位都空出来了，接上剩下的伙伴吧。','tang'],
  winFree:['小兔','小兔说，你把大家都接来啦，野餐开场！下一站，我有一件事想请你帮忙。','rabbit'],
  winFirst:['小兔','小兔说，我先到岸铺好了垫子，大家也都到了！你记住了先后顺序。','rabbit'],
  winPair:['李欣袆','李欣袆说，我和杨诗然一起看到了荷花，大家也都到啦！你把同船的约定安排好了。','xin'],
  winBudget:['乔治哥哥','乔治哥哥说，两个座位，三趟就接齐五个伙伴！你的安排让小船少跑了冤枉路。','george'],
  winBasket:['汤葭荟','汤葭荟说，篮子和伙伴都到齐啦！你发现篮子送到以后，就多了一个空位。','tang'],
  winHome:['杨诗然','杨诗然说，三个伙伴一起到啦！珞伊，谢谢你带大家来看夕阳。','yang'],
  undo:['王老师','回到出发前了，照你的想法重新安排吧。','captain']
 };
 const captions={
  welcome:'点伙伴上船，再点下船。大家想去对岸野餐！',
  controls:'船有3座。坐不下等下一趟，安排好点出发。',
  firstRule:'第一趟带上小兔，再把其他伙伴接过去。',
  pairRule:'李欣袆和杨诗然要同船。2个座位，把大家接齐。',
  smallRule:'2个座位、5位伙伴，试试3趟以内接齐。',
  basketRule:'4位伙伴。篮子占首趟1座，送到后有3个空位。',
  homeRule:'3位伙伴、3个座位，这次一趟接齐！',
  empty:'先点一位等船的伙伴，上船再出发吧。',
  full:'座位满啦！可以出发，也可以点伙伴下船换一位。',
  hintFree:'看看船上，再看看岸上。每次接谁，由你安排。',
  hintFirst:'小兔要先去铺垫子，第一趟带上小兔。',
  hintPair:'李欣袆和杨诗然要同船，船上是这两位吗？',
  hintBudget:'剩下的趟数够吗？可以撤回上一趟，换个安排。',
  hintBasket:'篮子占1座，送到后3个座位都能坐伙伴。',
  hintHome:'这次只去一趟，岸上等的伙伴也要一起上船。',
  firstError:'小兔还没上船呢，第一趟要带上小兔。',
  pairError:'这两位要同船。也可以先接其他伙伴。',
  budgetMiss:'大家到了！多跑几趟也没关系，可以换个办法。',
  arrived:'到岸啦！小船回来接下一批伙伴。',
  cargoArrived:'篮子送到啦！3个座位都空出来了。',
  winFree:'你把大家都接来啦！下一站，小兔还想请你帮忙。',
  winFirst:'小兔先铺好垫子，大家也到了！顺序安排好啦。',
  winPair:'李欣袆和杨诗然一起到了，同船约定达成！',
  winBudget:'2个座位，3趟接齐5位伙伴！安排成功啦。',
  winBasket:'篮子和伙伴都到啦！送完篮子，多出1个空位。',
  winHome:'3位伙伴一起到啦！珞伊，来看夕阳吧。',
  undo:'回到出发前了，照你的想法重新安排吧。'
 };
 return {cast,levels,voices,lines,captions,version:2};
});
