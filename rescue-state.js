(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./rescue-content.js'));else root.RescueState=factory(root.RescueContent)})(typeof window!=='undefined'?window:globalThis,function(C){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const level=s=>C.levels.find(l=>l.id===s.levelId);
 const capacity=s=>level(s).seats-(level(s).kind==='cargo'&&s.trips.length===0?1:0);
 function fresh(index=0){const l=C.levels[index];if(!l)throw Error('Unknown mission');return {version:2,id:Date.now()+'-'+Math.random().toString(36).slice(2,7),levelId:l.id,started:false,shore:l.ids.slice(),aboard:[],arrived:[],trips:[],history:[],hints:0,revisions:0,fullAttempts:0,rulePrompts:0,status:'dock',events:[]}}
 function check(s){
  const l=s&&level(s);if(!l||s.version!==2||!['dock','done'].includes(s.status)||!Array.isArray(s.trips)||!Array.isArray(s.history)||!Array.isArray(s.events))return false;
  if(!['shore','aboard','arrived'].every(k=>Array.isArray(s[k]))||!['hints','revisions','fullAttempts','rulePrompts'].every(k=>Number.isInteger(s[k])&&s[k]>=0))return false;
  const all=[...s.shore,...s.aboard,...s.arrived],sent=s.trips.flat();
  return all.length===l.ids.length&&new Set(all).size===all.length&&all.every(x=>l.ids.includes(x))&&s.aboard.length<=capacity(s)&&s.trips.every((t,i)=>Array.isArray(t)&&t.length>=1&&t.length<=l.seats-(l.kind==='cargo'&&i===0?1:0))&&sent.length===s.arrived.length&&new Set(sent).size===sent.length&&sent.every(x=>s.arrived.includes(x))&&(s.status==='done')===(s.arrived.length===l.ids.length);
 }
 function event(s,type,details={}){s.events.push({type,...details,time:new Date().toISOString()});s.events=s.events.slice(-160)}
 function toggle(s,id){
  if(s.status!=='dock'||s.arrived.includes(id)||!level(s).ids.includes(id))return 'ignored';
  const i=s.aboard.indexOf(id);
  if(i!==-1){s.aboard.splice(i,1);s.shore.push(id);s.shore.sort();s.revisions++;event(s,'unboard',{id});return 'unboard'}
  if(s.aboard.length===capacity(s)){s.fullAttempts++;event(s,'full',{id});return 'full'}
  s.shore.splice(s.shore.indexOf(id),1);s.aboard.push(id);event(s,'board',{id});return 'board';
 }
 function departureError(s){const l=level(s);if(!s.aboard.length)return 'empty';if(l.kind==='first'&&!s.trips.length&&!s.aboard.includes(l.who))return 'firstError';if(l.kind==='pair'&&l.pair.filter(id=>s.aboard.includes(id)).length===1)return 'pairError';return null}
 function sail(s){
  if(s.status!=='dock'||departureError(s))return null;
  s.history.push({shore:s.shore.slice(),aboard:s.aboard.slice(),arrived:s.arrived.slice(),trips:clone(s.trips)});
  const passengers=s.aboard.slice();s.trips.push(passengers);s.arrived.push(...passengers);s.aboard=[];
  if(s.arrived.length===level(s).ids.length)s.status='done';event(s,'cross',{passengers});return passengers;
 }
 function undo(s){if(!s.history.length)return false;Object.assign(s,s.history.pop());s.status='dock';s.revisions++;event(s,'undo');return true}
 function goal(s){const l=level(s);return s.status==='done'&&(!l.maxTrips||s.trips.length<=l.maxTrips)&&(l.kind!=='first'||s.trips[0].includes(l.who))&&(l.kind!=='pair'||s.trips.some(t=>l.pair.every(id=>t.includes(id))))}
 function budgetAtRisk(s){const l=level(s);return !!l.maxTrips&&s.status!=='done'&&s.trips.length+Math.ceil((s.shore.length+s.aboard.length)/capacity(s))>l.maxTrips}
 function summary(s){const l=level(s);return {id:s.id,version:2,levelId:l.id,title:l.title,kind:l.kind,topic:l.topic,time:new Date().toISOString(),trips:s.trips.map(t=>t.length),passengers:clone(s.trips),hints:s.hints,revisions:s.revisions,fullAttempts:s.fullAttempts,rulePrompts:s.rulePrompts,complete:s.status==='done',goalMet:goal(s),events:clone(s.events)}}
 return {fresh,check,toggle,sail,undo,summary,event,clone,level,capacity,departureError,goal,budgetAtRisk};
});
