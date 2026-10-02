import {describe,it,expect} from 'vitest';
import {latestSelection} from './latest-selection';
describe('attachment selection lifetime',()=>{
 it('a slow earlier read cannot replace the latest selected file',async()=>{
  const gate=latestSelection();let visible='';let finish!:()=>void;
  const first=gate.next();const slow=new Promise<void>(resolve=>{finish=()=>{if(gate.current(first))visible='old.csv';resolve();};});
  const second=gate.next();if(gate.current(second))visible='new.txt';finish();await slow;
  expect(visible).toBe('new.txt');
 });
 it.each(['remove','send','new conversation','invalid replacement'])('%s invalidates unfinished reads',()=>{
  const gate=latestSelection(),pending=gate.next();gate.next();expect(gate.current(pending)).toBe(false);
 });
 it('a replacement immediately removes the prior payload and blocks sending until its read settles',()=>{
  const gate=latestSelection<{name:string;text:string}>();
  const old=gate.begin();gate.finish(old,{name:'old.txt',text:'old content'});
  expect(gate.snapshot().value?.name).toBe('old.txt');
  const pending=gate.begin();
  expect(gate.snapshot()).toMatchObject({reading:true,value:null});
  expect(gate.finish(old,{name:'old.txt',text:'late old content'})).toBe(false);
  gate.finish(pending,{name:'new.txt',text:'current content'});
  expect(gate.snapshot()).toMatchObject({reading:false,value:{name:'new.txt',text:'current content'}});
  gate.next(); // invalid replacement must not restore the old attachment
  expect(gate.snapshot()).toMatchObject({reading:false,value:null});
 });
 it('a changed attachment invalidates a send snapshot waiting for thread creation',()=>{
  const gate=latestSelection();const send=gate.snapshot();gate.begin();expect(gate.current(send.generation)).toBe(false);
 });
});
