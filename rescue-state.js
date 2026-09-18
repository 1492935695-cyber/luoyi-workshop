(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RescueState=factory()})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const IDS=[0,1,2,3,4],clone=x=>JSON.parse(JSON.stringify(x));
  function fresh(mode='free'){return {id:Date.now()+'-'+Math.random().toString(36).slice(2,7),mode,started:false,shore:IDS.slice(),aboard:[],arrived:[],trips:[],history:[],hints:0,revisions:0,fullAttempts:0,status:'dock',events:[]}}
  function check(s){
    if(!s||!['free','two'].includes(s.mode)||!['dock','done'].includes(s.status)||!Array.isArray(s.trips)||!Array.isArray(s.history)||!Array.isArray(s.events))return false;
    if(!Array.isArray(s.shore)||!Array.isArray(s.aboard)||!Array.isArray(s.arrived))return false;
    const all=[...s.shore,...s.aboard,...s.arrived];
    return all.length===5&&new Set(all).size===5&&all.every(x=>IDS.includes(x))&&s.aboard.length<=3&&s.trips.every(t=>Array.isArray(t)&&t.length>=1&&t.length<=3)&&s.trips.flat().length===s.arrived.length&&s.trips.flat().every(x=>s.arrived.includes(x))&&(s.status!=='done'||s.arrived.length===5);
  }
  function event(s,type,details={}){s.events.push({type,...details,time:new Date().toISOString()});s.events=s.events.slice(-160)}
  function toggle(s,id){
    if(s.status!=='dock'||s.arrived.includes(id)||!IDS.includes(id))return 'ignored';
    const i=s.aboard.indexOf(id);
    if(i!==-1){s.aboard.splice(i,1);s.shore.push(id);s.shore.sort();s.revisions++;event(s,'unboard',{id});return 'unboard'}
    if(s.aboard.length===3){s.fullAttempts++;event(s,'full',{id});return 'full'}
    s.shore.splice(s.shore.indexOf(id),1);s.aboard.push(id);event(s,'board',{id});return 'board';
  }
  function sail(s){
    if(s.status!=='dock'||!s.aboard.length)return null;
    const before={shore:s.shore.slice(),aboard:s.aboard.slice(),arrived:s.arrived.slice(),trips:clone(s.trips)};
    s.history.push(before);const passengers=s.aboard.slice();s.trips.push(passengers);s.arrived.push(...passengers);s.aboard=[];
    if(s.arrived.length===5)s.status='done';event(s,'cross',{passengers});return passengers;
  }
  function undo(s){if(!s.history.length)return false;const previous=s.history.pop();Object.assign(s,previous);s.status='dock';s.revisions++;event(s,'undo');return true}
  function summary(s){return {id:s.id,mode:s.mode,time:new Date().toISOString(),trips:s.trips.map(t=>t.length),hints:s.hints,revisions:s.revisions,fullAttempts:s.fullAttempts,complete:s.status==='done',twoTripGoal:s.mode==='two'&&s.status==='done'&&s.trips.length===2,events:clone(s.events)}}
  return {fresh,check,toggle,sail,undo,summary,event,clone};
});
