import {createModelAsset} from './model-assets.mjs';

const PI=Math.PI;

// A room is composed once. Window and seated locations only select a camera
// pose and available targets; furniture, openings and props stay in place.
export function composeFreeWorld(k,view,h) {
  const v={...view,flags:view.flags||{}},p=k.root,C=h.C;
  const available=new Set(v.availableActions||[]),mark=k.mark;
  k.mark=(id,label,object,at)=>available.has(id)?mark(id,label,object,at):object;
  function named(object,name) {object.name=name;return k.keep(object);}
  function asset(name,label,x,y,z,size,options={}) {
    const object=createModelAsset(k.T,name,{size,...options});
    k.adopt(object);p.add(object);object.position.set(x,y,z);
    object.traverse(node=>{if(node.isGroup&&node.name)k.keep(node);});
    return named(object,label);
  }
  function passage(name,x,z,width=1.15) {
    return named(h.leftPassage(k,p,x,z,width),name);
  }
  function floorRoute(id,label,x,z,width=.72,depth=.9) {
    const object=named(k.group(p,x,0,z),id+'-cue');
    k.surface(object,'route',0xbabda8,0,.014,0,width,depth,true);
    k.ring(object,0,.019,0,.19,.012,0xe1d6ab);
    k.mark(id,label,object,[0,.022,0]);
    return object;
  }
  function camera(position,target,contextTargets) {
    return {position,target,fov:64,maxHorizontalFov:88,
      dragLimit:['front','back'].includes(v.location)?.65:.55,
      pitchLimit:.28,contextTargets};
  }
  function teaSteam(parent) {
    const steam=named(k.group(parent,0,.14,0),'tea-steam');
    for(let i=0;i<4;i++) {
      const wisp=k.ball(steam,0,.04+i*.035,0,.009,.026,.009,0xe7e7db);
      k.animate(wisp,time=>{
        const phase=(time*.23+i*.22)%1;
        wisp.position.set(Math.sin(phase*PI*2+i)*.017,.04+phase*.17,Math.cos(phase*PI*2+i)*.008);
        wisp.scale.set(.008*(1-phase*.65),.025*(1-phase*.35),.008*(1-phase*.65));
      });
    }
  }
  function windowGarden(z=-1.75) {
    k.surface(p,'garden',0x9eab83,0,-.14,z-7.5,22,13,true);
    k.surface(p,'water',0x9ebfb0,.5,-.10,z-7.3,4,3.6,true);
    for(let i=0;i<13;i++) {
      const x=(i*37%23)/23*12-6,depth=z-3.0-(i*17%19)/19*8;
      const stone=k.ball(p,x,-.08,depth,.23,.055,.16,0xc7c4ae);
      stone.rotation.y=i*.7;
    }
    for(let i=0;i<11;i++) {
      const x=(i*13%17)/17*13-6.5,depth=z-4.2-(i*7%13)/13*7;
      h.plant(k,p,x,-.14,depth,i,.9+(i%4)*.26);
    }
    for(const x of[-5.4,5.2]) {
      k.rod(p,[x,-.1,z-9],[x,1.8,z-9],.10,0x8c8267);
      k.ball(p,x,1.95,z-9,1.13,.91,.82,0x869776);
      k.ball(p,x+.62,1.55,z-8.8,.73,.75,.72,0x93a37e);
    }
    const arch=k.group(p,-.2,0,z-10.8);
    for(const x of[-1.1,1.1]) k.rod(arch,[x,0,0],[x,2.15,0],.055,0xb7b69c);
    const curved=k.ring(arch,0,2.12,0,1.1,.048,0xb7b69c);curved.rotation.x=0;
    for(let i=0;i<7;i++) {
      const a=i*PI/6;
      k.ball(arch,1.1*Math.cos(a),2.12+1.1*Math.sin(a),.03,.13,.11,.11,i%2?0xcab0a1:0xa7b08d);
    }
  }

  function miniatureGarden() {
    const y=1.088,z=-1.55;
    const duck=named(k.group(p,1.02,y,z),'garden-duck');
    k.ball(duck,0,.043,0,.070,.043,.050,0xd3bd70);
    k.ball(duck,.037,.086,-.002,.034,.034,.031,0xe1cf86);
    k.box(duck,.071,.078,.013,.035,.011,.024,0xbc8c4c);
    k.ball(duck,.045,.095,.024,.004,.004,.003,0x4b554b);
    k.mark('duck','Tiny garden duck',duck,[.01,.065,.025]);
    const flower=asset('flower','garden-flower',1.32,y,z-.02,.18);
    k.mark('flower','Miniature flower',flower,[0,.10,0]);
    const boat=asset('boat','garden-boat',1.62,y,z+.01,.19);
    boat.rotation.y=.17;k.mark('boat','Little boat',boat,[0,.047,.014]);
    const jar=asset('jar','garden-jar',1.92,y,z-.02,.15);
    k.mark('jar','Little glass jar',jar,[0,.075,0]);
    const windmill=named(k.group(p,2.22,y,z),'garden-windmill');
    k.cylinder(windmill,0,.063,0,.024,.040,.126,0xb9b4a0,8);
    k.cylinder(windmill,0,.145,0,0,.042,.055,0x9a8169,8);
    const blades=named(k.group(windmill,0,.116,.030),'windmill-blades');
    for(let i=0;i<4;i++) {
      const arm=k.group(blades);arm.rotation.z=i*PI/2;
      k.box(arm,0,.048,0,.021,.085,.006,0xd1c7a0);
      k.rod(arm,[0,0,0],[0,.095,0],.004,0x8b886f);
    }
    k.ball(blades,0,0,.007,.011,.011,.008,0x7e846f);
    k.animate(blades,time=>{blades.rotation.z=time*.27;});
    k.mark('windmill','Tiny turning windmill',windmill,[0,.116,.040]);
    const star=asset('star','garden-star',2.52,y,z-.02,.16);
    k.mark('star','Small lucky star',star,[0,.075,0]);
  }
  function composeTeaRoom() {
    const z=-1.75,branch={x:-2.72,w:1.38,b:0,t:2.42},
      door={x:-1.06,w:.96,b:0,t:2.10},win={x:1.76,w:1.94,b:1.07,t:2.31};
    p.userData.room='tea';
    h.indoorShell(k,p,[branch,door,win],z);
    const hall=passage('tea-hall-passage',branch.x,z+.10,branch.w);
    const hallDoor=named(h.wallLeaf(k,p,branch.x,z+.14,branch.w-.04,2.38,v.flags.window?1.12:0,false,0xb5b7a6),'tea-hall-door');
    hall.attach(hallDoor);k.mark('left','Go to the table room',hall,[0,1.10,-.05]);
    const outside=passage('tea-outside-passage',door.x,z+.10,door.w);
    outside.attach(named(h.wallLeaf(k,p,door.x,z+.12,.93,2.06,1.1,false,0xb5b7a6),'tea-outside-door'));
    k.mark('outside','Return outside',outside,[0,1.10,-.05]);
    const window=named(h.openingTrim(k,p,win.x,z+.099,win.w,win.b,win.t),'tea-window');
    const sash=named(h.sash(k,window,0,(win.b+win.t)/2,0,win.w,win.t-win.b,v.flags.tea?.62:0,!v.flags.tea),'tea-window-sash');
    k.box(window,0,win.b-.016,.07,win.w+.17,.067,.30,0xcfcbbc);
    k.mark('window','Look through the open window',window,[win.w/2+.044,1.90,.073]);
    k.mark('returntea','Step back from the window',window,[-.99,1.089,.18]);
    windowGarden(z);miniatureGarden();
    named(h.plankTable(k,p,-.02,-.67,1.20,.72,.78,0x9a8669),'tea-table');
    named(h.ground(k,h.chair(k,p,-1.81,0,-.23,.36,0x8b8d77),-.009),'tea-chair');
    const fan=named(h.fan(k,p,-.16,1.96,z+.136),'tea-fan');
    k.mark('fan','Wall fan',fan,[0,.10,.33]);
    const tape=named(k.group(p,.39,1.44,z+.116),'tea-tape');
    for(const[x,y,a]of[[-.19,.17,-.1],[.14,.17,.14],[-.18,-.09,.06],[.15,-.09,-.12]]) k.box(tape,x,y,0,.052,.049,.006,0xc9ba84).rotation.z=a;
    k.mark('tape','Little pieces of yellow tape',tape,[.14,.17,.007]);
    const sink=h.basin(k,p,win.x,z+.61,6);
    named(sink.g,'tea-sink');named(sink.tap,'tea-tap');named(sink.dish,'tea-dish');
    k.mark('pattern','Blue fish pattern',sink.dish,[.122,.032,-.023]);
    const mug=named(h.cup(k,p,-.12,.781,-.48,0xc5c5b1,.26),'tea-cup');
    k.mark('cup',v.flags.tea?'Warm cup of tea':'Tea cup',mug,[0,.125,0]);
    const pot=asset('teapot','tea-pot',.38,.781,-.70,.38,{color:0x97a38b});
    k.mark('tea','Make a warm cup of tea',pot,[0,.115,.025]);
    if(v.flags.tea) {
      named(k.cylinder(mug,0,.126,0,.064,.064,.004,0xa86b26,24),'amber-tea');teaSteam(mug);
    }
    return v.location==='window'
      ?camera([1.76,1.62,.36],[1.76,1.25,-2.30],['returntea','duck','star'])
      :camera([0,1.62,3.5],[-.10,1.10,-1.2],v.flags.window?['tea','window','left']:v.flags.tea?['tea','window','outside']:['tea','cup','outside']);
  }
  function letter() {
    const object=named(h.photographicPrint(k,p,.31,.790,.17,-.14),'table-letter');
    k.box(object,0,-.006,0,.30,.008,.225,C.paper);
    k.mark('photo','Open the discovered photograph',object,[.02,.012,.02]);
    return h.ground(k,object,.779);
  }
  function steadyBench() {
    const seat=k.group(p,-.43,0,.94),wood=0x99816a;
    for(const side of[-1,1]) {
      k.box(seat,0,.357,side*.114,1.42,.075,.037,wood);
      for(const end of[-1,1])k.box(seat,end*.644,.224,side*.108,.069,.418,.068,wood);
    }
    k.rounded(seat,0,.437,0,1.55,.07,.33,.021,0xb29d80);
    for(let i=0;i<2;i++) {
      k.rounded(seat,-.48,.493+i*.049,.007,.47-i*.025,.061,.349,.031,i===1?0xafab91:0x9b977e);
      k.box(seat,-.60,.523+i*.05,.01,.012,.002,.317,0xc2bca2);
    }
    return named(h.ground(k,seat,-.009),'table-bench');
  }
  function composeTableRoom() {
    const seated=v.location==='ending',z=-1.73,win={x:.32,w:2.51,b:.50,t:2.28},
      portal={x:-2.85,w:1.18,b:0,t:2.38};
    p.userData.room='table';
    h.indoorShell(k,p,[win,portal],z);
    const window=named(k.group(p,win.x,0,z),'table-window');
    h.openingTrim(k,window,0,.106,win.w,win.b,win.t);
    named(h.sash(k,window,0,(win.b+win.t)/2,.117,win.w,win.t-win.b,0,false),'table-window-sash');
    k.box(window,0,win.b-.037,.18,win.w+.20,.082,.38,0xc8c1b0);
    const arrival=passage('table-entry-passage',portal.x,z+.10,portal.w);
    k.mark('returntea','Return through the entrance',arrival,[0,1.10,-.05]);
    k.surface(p,'yard',C.cement,0,-.028,-7.83,22,12,true);
    k.surface(p,'soil',C.grass,0,-.035,-18.20,55,10,true);
    k.box(p,0,-.021,-5.28,16,.005,.023,0x989b8f);
    k.hose(p,[[-2.68,-.002,-5.51],[-1.71,-.002,-5.85],[-.82,-.002,-6.62],[.17,-.002,-6.83],[1.14,-.002,-6.64],[2.93,-.002,-6.97]],.014,0x7c8975);
    for(const[x,z,angle]of[[.09,-3.89,-.083],[.33,-3.84,.045]])
      named(h.ground(k,h.footwear(k,p,x,0,z,angle,0x9d9480),-.028),'shoe');
    const table=named(h.plankTable(k,p,-.43,.06,1.94,.93,.778,0xa08466),'table');
    k.mark('returnroom','Stand up at the table',table,[.66,.762,.465]);
    for(const[x,z,angle,tint,name]of[[-.43,-.80,0,0x969884,'table-back-chair'],[-1.63,.061,PI/2,0x9b8c73,'table-left-chair'],[.75,-.02,-PI/2,0x9b8c73,'table-right-chair']])
      named(h.ground(k,h.chair(k,p,x,0,z,angle,tint),-.009),name);
    const seat=steadyBench();
    k.mark('sit','Sit at the table',seat,[.26,.473,.10]);
    const mug=named(h.cup(k,p,-.45,.779,-.18,0xc5c5b1,.27),'table-cup');
    k.mark('cup','Quiet cup on the table',mug,[0,.114,0]);
    const chest=asset('chest','table-chest',.31,.778,-.17,.32,{open:!!v.flags.chest});
    if(seated)k.mark('chest',v.flags.chest?'Opened treasure box':'Open the small box',chest,[0,.105,.083]);
    if(v.flags.chest)letter();
    const result=seated
      ?camera([-.08,1.24,1.16],[.13,.65,-3.8],['chest','cup'])
      :camera([.3,1.62,3.8],[-.25,.92,.05],v.flags.chest?['sit','photo','returntea']:['sit','returntea']);
    result.context=[];
    p.updateMatrixWorld(true);
    if(seated)for(const shoe of p.getObjectsByProperty('name','shoe')) {
      const bounds=new k.T.Box3().setFromObject(shoe,true);
      for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])
        for(const z of[bounds.min.z,bounds.max.z])result.context.push([x,y,z]);
    }
    return result;
  }
  let result;
  if(v.location==='front'||v.location==='back') {
    const rear=v.location==='back';p.userData.room=v.location;
    h.exterior(k,{...v,step:rear?2:0});
    const door=k.targets.find(target=>target.id===(rear?'backdoor':'frontdoor'));
    if(door) {
      named(door.object,rear?'back-door':'front-door');
      door.label=rear?(v.flags.backdoor?'Opened back door':'Unlock the back door'):'Locked front door';
    }
    if(rear) {
      if(!v.flags.key) {
        const key=asset('key','key',-2.03,.101,.18,.27,{color:0xc4a35d});
        k.mark('key','Small brass key',key,[0,.035,.015]);
      }
      if(v.flags.backdoor) {
        const entry=named(k.group(p,.14,0,-.77),'back-entry');
        k.box(entry,0,1.04,-.72,1.03,2.08,.055,0x7b8774);
        k.surface(entry,'floor',0xc6c6b8,0,.018,-.20,1.04,1.22,true);
        k.ring(entry,0,.022,-.03,.20,.014,0xd8cba1);
        k.mark('enterhouse','Step through the open back door',entry,[0,.91,-.18]);
      }
      floorRoute('returnfront','Return to the front',-1.4,1.8,.8,.95);
      result=camera([1.05,1.62,3.4],[-.5,1.0,-.4],v.flags.backdoor?['backdoor','enterhouse','returnfront']:['backdoor','key','returnfront']);
    } else {
      result=camera([1.0,1.62,5.4],[-.7,1.12,-.35],['frontdoor','sidepath']);
      result.context=[[-2.74,-.009,.45],[-1.97,.83,1.18]];
    }
  } else if(v.location==='tea'||v.location==='window')result=composeTeaRoom();
  else result=composeTableRoom();
  k.mark=mark;
  return result;
}


