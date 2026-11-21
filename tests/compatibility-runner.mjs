export function runChecks(sources,dependencies){
 const results=[],diagnostics=[];
 const fail=m=>{throw Error(m||"Assertion failed");};
 const equal=(a,b,m)=>{if(!Object.is(a,b))fail((m||"Expected equality")+": "+JSON.stringify(a)+" !== "+JSON.stringify(b));};
 const assert={ok:(v,m)=>{if(!v)fail(m);},equal,strictEqual:equal,deepEqual:(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))fail(m||"Different structures");},notDeepEqual:(a,b,m)=>{if(JSON.stringify(a)===JSON.stringify(b))fail(m||"Same structures");},notEqual:(a,b,m)=>{if(Object.is(a,b))fail(m||"Same values");},match:(v,re,m)=>{if(!re.test(v))fail(m||"Pattern mismatch");}};
 const test=(name,fn)=>{try{fn({diagnostic:m=>diagnostics.push(m)});results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.message,stack:e.stack?.slice(0,1600)});}};
 for(let source of sources){
  source=source.replace(/^import\s[\s\S]*?;\n/gm,"").replace(/const threeSource = await readFile[\s\S]*?const THREE = await import\([\s\S]*?;\n/,"").replace(/const source = await readFile[\s\S]*?const THREE = await import\([\s\S]*?;\n/,"");
  try{new Function("assert","test",...Object.keys(dependencies),source)(assert,test,...Object.values(dependencies));}catch(e){results.push({name:"Load test module",passed:false,error:e.message,stack:e.stack?.slice(0,1200)});}
 }
 return{results,diagnostics};
}
