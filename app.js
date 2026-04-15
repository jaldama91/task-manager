const SUPABASE_URL = "https://cwimgkiiswmpnpjbwply.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aW1na2lpc3dtcG5wamJ3cGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDExNDIsImV4cCI6MjA5MTY3NzE0Mn0.TdLVJcNHtEo6A5D6bJCJkHj7aICTDQNeEOD5kY1cNWA";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

const { useState, useEffect, useCallback } = React;

// ── taxonomy ───────────────────────────────────────────────────────────────
var NS=["Strategy","Finances","Operations","People","Clients","Marketing"];
var KS=["Strategy","Finances","Operations","People","Marketing","Menu"];
var PS=["Child","Home","Family","Rentals","Misc Personal"];
var NI=NS.map(function(s){return "N:"+s;});
var KI=KS.map(function(s){return "K:"+s;});
var PI=PS.slice();
var AI=NI.concat(KI).concat(PI);

var TREE=[
  {id:"N",label:"Nuve",       subs:NI.map(function(id,i){return {id:id,label:NS[i]};})},
  {id:"K",label:"Kesos Tacos",subs:KI.map(function(id,i){return {id:id,label:KS[i]};})},
  {id:"P",label:"Personal",   subs:PI.map(function(id,i){return {id:id,label:PS[i]};})},
];

var USERS={
  Jhonatan:{ini:"JA",color:"#00965E",bg:"#E0F7EE",ctxs:AI,          canGin:true },
  Sarah:   {ini:"SA",color:"#0F6E9A",bg:"#E0F2FB",ctxs:PI,           canGin:false},
  Gin:     {ini:"GN",color:"#7C3AED",bg:"#EDE9FE",ctxs:NI.concat(KI),canGin:false},
};

var PK=["High","Medium","Low"];
var PRI={
  High:  {lbl:"High",  bg:"#FEE2E2",tx:"#991B1B",bd:"#FCA5A5",dot:"#EF4444"},
  Medium:{lbl:"Medium",bg:"#FEF3C7",tx:"#92400E",bd:"#FDE68A",dot:"#F59E0B"},
  Low:   {lbl:"Low",   bg:"#D4F7E5",tx:"#065F46",bd:"#6EE7B7",dot:"#2AD870"},
};
var PO={High:1,Medium:2,Low:3};

var CTC={};
NI.forEach(function(id){CTC[id]={bg:"#D4F7E5",tx:"#065F46",bd:"#2AD870"};});
KI.forEach(function(id){CTC[id]={bg:"#FEF3C7",tx:"#92400E",bd:"#FCD34D"};});
CTC["Child"]        ={bg:"#FFF0F6",tx:"#9D174D",bd:"#FBCFE8"};
CTC["Home"]         ={bg:"#FFF7ED",tx:"#9A3412",bd:"#FED7AA"};
CTC["Family"]       ={bg:"#EFF6FF",tx:"#1E40AF",bd:"#BFDBFE"};
CTC["Rentals"]      ={bg:"#E0F2FB",tx:"#0F6E9A",bd:"#7DD3F0"};
CTC["Misc Personal"]={bg:"#F1F5F9",tx:"#475569",bd:"#CBD5E1"};

var PC={N:{ac:"#2AD870",bg:"#E8FBF1",tx:"#065F46"},K:{ac:"#F59E0B",bg:"#FFFBEB",tx:"#92400E"},P:{ac:"#6366F1",bg:"#EEF2FF",tx:"#3730A3"}};
var CC={"To Do":{ac:"#111",tx:"#111",bg:"#F0F0EE"},"In Progress":{ac:"#2AD870",tx:"#065F46",bg:"#E8FBF1"},"Done":{ac:"#00965E",tx:"#065F46",bg:"#D4F7E5"}};
var RC={bg:"#D4F7E5",tx:"#00965E",bd:"#2AD870"};
var DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var ORDINALS=["1st","2nd","3rd","4th","5th"];
var COLS=["To Do","In Progress","Done"];
var MN=["January","February","March","April","May","June","July","August","September","October","November","December"];
var DN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var MB="#2AD870",ML="#8FF9BA",MD="#00965E",BLK="#111",WH="#fff";

function fmt(s){if(!s)return "";var p=s.split("-");return p[1]+"/"+p[2]+"/"+p[0].slice(2);}
function padZ(n){return String(n).padStart(2,"0");}
function addInt(d,r){
  var dt=new Date(d+"T12:00:00");
  if(r==="Daily")    dt.setDate(dt.getDate()+1);
  if(r==="Weekly")   dt.setDate(dt.getDate()+7);
  if(r==="Biweekly") dt.setDate(dt.getDate()+14);
  if(r==="Monthly")  dt.setMonth(dt.getMonth()+1);
  if(r==="Quarterly")dt.setMonth(dt.getMonth()+3);
  if(r==="Annually") dt.setFullYear(dt.getFullYear()+1);
  return dt.toISOString().slice(0,10);
}
// ── Recur helpers ──────────────────────────────────────────────────────────
// recur format:  "None" | "WEEKLY:Monday" | "MONTHLY_DATE:15" | "MONTHLY_DAY:2:Tuesday" | "EVERY_N:10"
function recurLabel(r){
  if(!r||r==="None")return null;
  var p=r.split(":");
  if(p[0]==="WEEKLY")      return "Every "+p[1];
  if(p[0]==="MONTHLY_DATE")return "Every "+p[1]+(p[1]==="1"?"st":p[1]==="2"?"nd":p[1]==="3"?"rd":"th");
  if(p[0]==="MONTHLY_DAY") return "Every "+ORDINALS[parseInt(p[1])-1]+" "+p[2];
  if(p[0]==="EVERY_N")     return "Every "+p[1]+" days";
  return r;
}
function addInt(d,r){
  if(!d||!r||r==="None")return null;
  var dt=new Date(d+"T12:00:00");
  var p=r.split(":");
  if(p[0]==="EVERY_N"){
    dt.setDate(dt.getDate()+parseInt(p[1]));
    return dt.toISOString().slice(0,10);
  }
  if(p[0]==="WEEKLY"){
    var targetDay=DAYS.indexOf(p[1]);
    dt.setDate(dt.getDate()+1);
    while(dt.getDay()!==targetDay)dt.setDate(dt.getDate()+1);
    return dt.toISOString().slice(0,10);
  }
  if(p[0]==="MONTHLY_DATE"){
    var day=parseInt(p[1]);
    dt.setMonth(dt.getMonth()+1);
    dt.setDate(day);
    return dt.toISOString().slice(0,10);
  }
  if(p[0]==="MONTHLY_DAY"){
    var nth=parseInt(p[1]),wday=DAYS.indexOf(p[2]);
    dt.setMonth(dt.getMonth()+1);
    dt.setDate(1);
    var count=0;
    while(count<nth){if(dt.getDay()===wday)count++;if(count<nth)dt.setDate(dt.getDate()+1);}
    return dt.toISOString().slice(0,10);
  }
  return null;
}

// ── RecurPicker component ──────────────────────────────────────────────────
function RecurPicker(props){
  var val=props.value||"None",onChange=props.onChange;
  var p=val==="None"?[]:val.split(":");
  var type=val==="None"?"None":p[0];

  var inp={padding:"7px 10px",borderRadius:7,border:"0.5px solid #DDD",background:WH,fontSize:13,color:BLK,width:"100%"};
  var typeBtns=["None","WEEKLY","MONTHLY_DATE","MONTHLY_DAY","EVERY_N"].map(function(t){
    var labels={None:"None",WEEKLY:"Every weekday",MONTHLY_DATE:"Day of month",MONTHLY_DAY:"Nth weekday",EVERY_N:"Every X days"};
    var a=type===t;
    return ce("button",{key:t,onClick:function(){
      if(t==="None")onChange("None");
      else if(t==="WEEKLY")onChange("WEEKLY:Monday");
      else if(t==="MONTHLY_DATE")onChange("MONTHLY_DATE:1");
      else if(t==="MONTHLY_DAY")onChange("MONTHLY_DAY:1:Monday");
      else if(t==="EVERY_N")onChange("EVERY_N:7");
    },style:{padding:"5px 10px",borderRadius:20,fontSize:11,fontWeight:a?600:400,border:a?"1.5px solid "+MD:"0.5px solid #DDD",background:a?RC.bg:"#F7F7F6",color:a?MD:"#666",cursor:"pointer",whiteSpace:"nowrap"}},labels[t]);
  });

  var detail=null;
  if(type==="WEEKLY"){
    detail=ce("div",null,
      ce("label",{style:{fontSize:11,color:"#888",display:"block",marginBottom:4}},"Which day?"),
      ce("select",{value:p[1]||"Monday",onChange:function(e){onChange("WEEKLY:"+e.target.value);},style:inp},
        DAYS.map(function(d){return ce("option",{key:d},d);})
      )
    );
  }
  if(type==="MONTHLY_DATE"){
    var opts=[];for(var i=1;i<=31;i++)opts.push(i);
    detail=ce("div",null,
      ce("label",{style:{fontSize:11,color:"#888",display:"block",marginBottom:4}},"Which day of the month?"),
      ce("select",{value:p[1]||"1",onChange:function(e){onChange("MONTHLY_DATE:"+e.target.value);},style:inp},
        opts.map(function(n){return ce("option",{key:n,value:n},n+(n===1?"st":n===2?"nd":n===3?"rd":"th"));})
      )
    );
  }
  if(type==="MONTHLY_DAY"){
    detail=ce("div",{style:{display:"flex",gap:8}},
      ce("div",{style:{flex:1}},
        ce("label",{style:{fontSize:11,color:"#888",display:"block",marginBottom:4}},"Which week?"),
        ce("select",{value:p[1]||"1",onChange:function(e){onChange("MONTHLY_DAY:"+e.target.value+":"+(p[2]||"Monday"));},style:inp},
          [1,2,3,4,5].map(function(n){return ce("option",{key:n,value:n},ORDINALS[n-1]);})
        )
      ),
      ce("div",{style:{flex:1}},
        ce("label",{style:{fontSize:11,color:"#888",display:"block",marginBottom:4}},"Which day?"),
        ce("select",{value:p[2]||"Monday",onChange:function(e){onChange("MONTHLY_DAY:"+(p[1]||"1")+":"+e.target.value);},style:inp},
          DAYS.map(function(d){return ce("option",{key:d},d);})
        )
      )
    );
  }
  if(type==="EVERY_N"){
    detail=ce("div",null,
      ce("label",{style:{fontSize:11,color:"#888",display:"block",marginBottom:4}},"Every how many days?"),
      ce("input",{type:"number",min:1,max:365,value:p[1]||"7",onChange:function(e){onChange("EVERY_N:"+e.target.value);},style:inp})
    );
  }

  return ce("div",{style:{display:"flex",flexDirection:"column",gap:8}},
    ce("div",{style:{display:"flex",gap:5,flexWrap:"wrap"}},typeBtns),
    detail
  );
}

function isPers(ctx){return PI.indexOf(ctx)>=0;}
function resolveCtxs(sel,ctxs){
  if(sel==="All")return ctxs;
  if(ctxs.indexOf(sel)>=0)return [sel];
  for(var i=0;i<TREE.length;i++){
    if(TREE[i].id===sel)return TREE[i].subs.map(function(c){return c.id;}).filter(function(c){return ctxs.indexOf(c)>=0;});
  }
  return [];
}
function getVL(sel){
  if(sel==="All")return "All tasks";
  for(var i=0;i<TREE.length;i++){
    if(TREE[i].id===sel)return TREE[i].label;
    for(var j=0;j<TREE[i].subs.length;j++){if(TREE[i].subs[j].id===sel)return TREE[i].subs[j].label;}
  }
  return sel;
}

// db helpers
function dbToTask(row){
  return {
    id:row.id, title:row.title, ctx:row.ctx, pri:row.pri,
    due:row.due||"", status:row.status, notes:row.notes||"",
    subtasks:row.subtasks||[], recur:row.recur||"None",
    by:row.by_user, to:row.to_user, shared:!!row.shared
  };
}
function taskToDb(t,byUser){
  return {
    title:t.title, ctx:t.ctx, pri:t.pri, due:t.due||null,
    status:t.status, notes:t.notes||"", subtasks:t.subtasks||[],
    recur:t.recur||"None", by_user:byUser||t.by, to_user:t.to, shared:!!t.shared
  };
}

// ── ce helper ──────────────────────────────────────────────────────────────
function ce(t,p){
  var args=[t,p||null];
  for(var i=2;i<arguments.length;i++)args.push(arguments[i]);
  return React.createElement.apply(React,args);
}
function svg(paths,w,h,stroke,sw){
  var sp={viewBox:"0 0 16 16",fill:"none",stroke:stroke||"currentColor",strokeWidth:sw||"1.5",strokeLinecap:"round",strokeLinejoin:"round",width:w||16,height:h||16};
  return ce("svg",sp,paths.map(function(d,i){return ce("path",{key:i,d:d});}));
}
function svgR(rects,paths,w,h,stroke){
  var sp={viewBox:"0 0 16 16",fill:"none",stroke:stroke||"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",width:w||16,height:h||16};
  return ce("svg",sp,rects.map(function(r,i){return ce("rect",{key:"r"+i,x:r.x,y:r.y,width:r.w,height:r.h,rx:r.rx});}).concat(paths.map(function(d,i){return ce("path",{key:"p"+i,d:d});})));
}
function svgC(circs,paths,w,h,stroke){
  var sp={viewBox:"0 0 16 16",fill:"none",stroke:stroke||"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",width:w||16,height:h||16};
  return ce("svg",sp,circs.map(function(c,i){return ce("circle",{key:"c"+i,cx:c.cx,cy:c.cy,r:c.r});}).concat(paths.map(function(d,i){return ce("path",{key:"p"+i,d:d});})));
}
function Ico(name,sz,col){
  var c=col||"currentColor",w=sz||16,h=sz||16;
  if(name==="edit")   return svg(["M11.5 2.5l2 2-7 7H4.5v-2l7-7z","M10 4l2 2"],w,h,c);
  if(name==="trash")  return svg(["M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l.8 9.5h8.4L13 4"],w,h,c);
  if(name==="plus")   return svg(["M8 3v10M3 8h10"],w,h,c);
  if(name==="chev")   return svg(["M4 6l4 4 4-4"],w,h,c);
  if(name==="chevu")  return svg(["M4 10l4-4 4 4"],w,h,c);
  if(name==="recur")  return svg(["M3 8a5 5 0 0 1 9-3H9.5","M13 8a5 5 0 0 1-9 3H6","M12 5l.5-2.5 2 1.5","M4 11l-.5 2.5-2-1.5"],w,h,c);
  if(name==="warn")   return svg(["M8 2L1.5 13.5h13L8 2z","M8 7v3","M8 11.5v.5"],w,h,c);
  if(name==="check")  return svg(["M3 8l4 4 6-7"],w,h,c,"2");
  if(name==="x")      return svg(["M4 4l8 8M12 4l-8 8"],w,h,c);
  if(name==="move")   return svg(["M9 3l4 4-4 4","M3 7h10"],w,h,c);
  if(name==="logout") return svg(["M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3","M10 11l3-3-3-3","M13 8H6"],w,h,c);
  if(name==="layers") return svg(["M1.5 5.5l6.5-4 6.5 4-6.5 4-6.5-4z","M1.5 9.5l6.5 4 6.5-4","M1.5 12.5l6.5 4 6.5-4"],w,h,c);
  if(name==="sortup") return svg(["M8 13V3M4 7l4-4 4 4"],w,h,c);
  if(name==="sortdn") return svg(["M8 3v10M4 9l4 4 4-4"],w,h,c);
  if(name==="cal")    return svgR([{x:"1.5",y:"2.5",w:"13",h:"12",rx:"2"}],["M1.5 6.5h13","M5 1v3","M11 1v3"],w,h,c);
  if(name==="note")   return svgR([{x:"2",y:"1.5",w:"12",h:"13",rx:"1.5"}],["M5 5.5h6","M5 8h6","M5 10.5h4"],w,h,c);
  if(name==="users")  return svgC([{cx:"5",cy:"5",r:"2.5"},{cx:"11",cy:"5",r:"2"}],["M0.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4","M13 13c0-2-1.5-3.5-3.5-3.5"],w,h,c);
  if(name==="spin")   return svg(["M8 2a6 6 0 1 1-4.24 1.76"],w,h,c);
  return null;
}

function ColorBar(){
  return ce("div",{style:{display:"flex",height:4,borderRadius:4,overflow:"hidden",width:44,gap:1}},
    ce("div",{style:{flex:1,background:ML}}),ce("div",{style:{flex:1,background:MB}}),ce("div",{style:{flex:1,background:MD}})
  );
}
function Av(name,sz){
  sz=sz||28;var u=USERS[name];if(!u)return null;
  return ce("div",{style:{width:sz,height:sz,borderRadius:"50%",background:u.bg,border:"1.5px solid "+u.color+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:sz*0.33,fontWeight:600,color:u.color,flexShrink:0}},u.ini);
}
function Tag(bg,tx,bd,children){
  return ce("span",{style:{fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:20,background:bg,color:tx,border:"0.5px solid "+(bd||bg),lineHeight:1.6,display:"inline-flex",alignItems:"center",gap:3}},children);
}
function PBadge(p){
  var c=PRI[p];if(!c)return null;
  return ce("span",{style:{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:6,background:c.bg,color:c.tx,border:"1px solid "+c.bd,flexShrink:0,display:"inline-flex",alignItems:"center",gap:4}},
    ce("span",{style:{width:6,height:6,borderRadius:"50%",background:c.dot,flexShrink:0}}),c.lbl
  );
}

// ── PIN data ───────────────────────────────────────────────────────────────
var PINS={Jhonatan:"2013",Sarah:"0222",Gin:"0221"};

// ── PinScreen ──────────────────────────────────────────────────────────────
function PinScreen(props){
  var name=props.name,u=USERS[name];
  var [digits,setDigits]=useState(["","","",""]);
  var [err,setErr]=useState(false);
  var [shake,setShake]=useState(false);
  var refs=[React.useRef(),React.useRef(),React.useRef(),React.useRef()];
  function handleChange(i,val){
    if(!/^\d?$/.test(val))return;
    var next=digits.slice();next[i]=val;setDigits(next);setErr(false);
    if(val&&i<3)refs[i+1].current&&refs[i+1].current.focus();
  }
  function handleKeyDown(i,e){
    if(e.key==="Backspace"&&!digits[i]&&i>0)refs[i-1].current&&refs[i-1].current.focus();
    if(e.key==="Enter")trySubmit(digits);
  }
  function handlePaste(e){
    var p=e.clipboardData.getData("text").replace(/\D/g,"").slice(0,4);
    if(p.length===4){var nd=p.split("");setDigits(nd);refs[3].current&&refs[3].current.focus();setTimeout(function(){trySubmit(nd);},80);}
  }
  function trySubmit(d){
    if(d.join("")===PINS[name]){props.onSuccess();}
    else{setErr(true);setShake(true);setTimeout(function(){setDigits(["","","",""]);setShake(false);refs[0].current&&refs[0].current.focus();},600);}
  }
  var boxStyle=function(i){return{width:52,height:60,borderRadius:10,textAlign:"center",fontSize:26,fontWeight:700,border:err?"2px solid #EF4444":digits[i]?"2px solid "+u.color:"1.5px solid #DDD",background:err?"#FEF2F2":digits[i]?u.bg:"#FAFAFA",color:"transparent",caretColor:u.color,outline:"none",transition:"border-color .15s,background .15s"};};
  return ce("div",{style:{minHeight:"100vh",background:"linear-gradient(160deg,"+MD+" 0%,"+MB+" 60%,"+ML+" 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 16px"}},
    ce("div",{style:{marginBottom:28}},ColorBar()),
    ce("div",{style:{background:"rgba(255,255,255,.97)",borderRadius:20,padding:"36px 40px",display:"flex",flexDirection:"column",alignItems:"center",gap:24,boxShadow:"0 8px 40px rgba(0,0,0,.15)",minWidth:300}},
      ce("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:10}},
        ce("div",{style:{width:60,height:60,borderRadius:"50%",background:u.bg,border:"2.5px solid "+u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:u.color}},u.ini),
        ce("div",{style:{fontSize:17,fontWeight:700,color:BLK}},name),
        ce("div",{style:{fontSize:12,color:"#999"}},"Enter your 4-digit PIN")
      ),
      ce("div",{style:{display:"flex",gap:10,animation:shake?"shake .4s":"none"}},
        digits.map(function(d,i){
          return ce("div",{key:i,style:{position:"relative"}},
            ce("input",{ref:refs[i],type:"tel",maxLength:1,value:d,autoFocus:i===0,onChange:function(e){handleChange(i,e.target.value);},onKeyDown:function(e){handleKeyDown(i,e);},onPaste:handlePaste,style:boxStyle(i)}),
            d?ce("div",{style:{position:"absolute",top:0,left:0,right:0,bottom:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}},
              ce("div",{style:{width:12,height:12,borderRadius:"50%",background:err?"#EF4444":u.color}})
            ):null
          );
        })
      ),
      err?ce("div",{style:{fontSize:13,color:"#EF4444",fontWeight:500}},"Incorrect PIN — try again"):null,
      ce("div",{style:{display:"flex",gap:10,width:"100%"}},
        ce("button",{onClick:props.onBack,style:{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid #DDD",background:WH,color:"#666",fontSize:14,cursor:"pointer"}},"← Back"),
        ce("button",{onClick:function(){trySubmit(digits);},disabled:digits.join("").length<4,style:{flex:2,padding:"10px",borderRadius:10,border:"none",background:digits.join("").length===4?u.color:"#DDD",color:digits.join("").length===4?WH:"#aaa",fontSize:14,fontWeight:600,cursor:digits.join("").length===4?"pointer":"default",transition:"background .15s"}},"Unlock")
      )
    ),
    ce("style",null,"@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}")
  );
}

// ── Login ──────────────────────────────────────────────────────────────────
function Login(props){
  var [selected,setSelected]=useState(null);
  if(selected){return ce(PinScreen,{name:selected,onSuccess:function(){props.onLogin(selected);},onBack:function(){setSelected(null);}});}
  return ce("div",{style:{minHeight:"100vh",background:"linear-gradient(160deg,"+MD+" 0%,"+MB+" 60%,"+ML+" 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 16px"}},
    ce("div",{style:{marginBottom:28}},ColorBar()),
    ce("div",{style:{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center"}},
      Object.keys(USERS).map(function(name){
        var u=USERS[name];
        return ce("button",{key:name,onClick:function(){setSelected(name);},style:{display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:"22px 26px",borderRadius:14,border:"none",background:"rgba(255,255,255,.95)",cursor:"pointer",minWidth:120}},
          ce("div",{style:{width:52,height:52,borderRadius:"50%",background:u.bg,border:"2.5px solid "+u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:u.color}},u.ini),
          ce("div",{style:{fontSize:14,fontWeight:600,color:BLK}},name)
        );
      })
    )
  );
}

// ── CardInner ──────────────────────────────────────────────────────────────
function CardInner(props){
  var task=props.task,cu=props.cu,open=props.open,setOpen=props.setOpen;
  var cc=CTC[task.ctx]||{bg:"#F2F2F0",tx:"#555",bd:"#DDD"};
  var cm=CC[task.status]||CC["To Do"];
  var lbl=ctxLbl(task.ctx);
  var over=!!(task.due&&new Date(task.due)<new Date()&&task.status!=="Done");
  var rec=!!(task.recur&&task.recur!=="None");
  var recLbl=recurLabel(task.recur);
  var done=task.subtasks.filter(function(s){return s.done;}).length;
  var can=!!(USERS[cu]&&USERS[cu].ctxs.indexOf(task.ctx)>=0);
  var isShared=!!(task.shared&&isPers(task.ctx));
  var moveCols=COLS.filter(function(c){return c!==task.status;});

  var duePill=task.due?Tag(over?"#FFE4E4":"#F2F2F0",over?"#991B1B":"#666",over?"#FECACA":"#DDD",[Ico(over?"warn":"cal",11,over?"#991B1B":"#999"),ce("span",{key:"d",style:{marginLeft:2}},fmt(task.due))]):null;
  var recPill=rec?Tag(RC.bg,RC.tx,RC.bd,[Ico("recur",11,RC.tx),ce("span",{key:"r",style:{marginLeft:2}},recLbl)]):null;
  var shPill=isShared?Tag("#FEF0FF","#6B21A8","#D8B4FE",[Ico("users",11,"#6B21A8"),ce("span",{key:"s",style:{marginLeft:2}},"Shared")]):null;
  var subPill=task.subtasks.length>0?Tag("#F2F2F0","#666",null,done+"/"+task.subtasks.length+" done"):null;
  var avStack=isShared
    ?ce("div",{style:{display:"flex"}},Av("Jhonatan",20),ce("div",{style:{marginLeft:-6}},Av("Sarah",20)))
    :ce("div",{style:{display:"flex"}},Av(task.to,20),task.by!==task.to?ce("div",{style:{marginLeft:-6}},Av(task.by,20)):null);

  var expandBody=null;
  if(open){
    var subItems=task.subtasks.map(function(s,i){
      return ce("div",{key:i,style:{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:"0.5px solid #EEE"}},
        ce("div",{style:{width:16,height:16,borderRadius:4,border:"1.5px solid "+(s.done?MB:"#DDD"),background:s.done?MB:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},s.done?Ico("check",10,"#fff"):null),
        ce("span",{style:{fontSize:13,color:s.done?"#aaa":BLK,textDecoration:s.done?"line-through":"none"}},s.text)
      );
    });
    var moveBtns=can?moveCols.map(function(col){
      return ce("button",{key:col,onClick:function(){if(col==="Done"&&rec){props.onComplete(task);}else{props.onMove(task.id,col);}},style:{display:"flex",alignItems:"center",gap:5,fontSize:12,padding:"5px 10px",borderRadius:7,border:"0.5px solid #2AD87088",background:"#E8FBF1",cursor:"pointer",color:MD}},
        Ico("move",12,MD)," > "+col
      );
    }):[];
    expandBody=ce("div",{style:{borderTop:"0.5px solid #EEE",padding:"10px 12px 12px",background:"#FAFAF9"},onClick:function(e){e.stopPropagation();}},
      task.notes?ce("div",{style:{display:"flex",gap:7,marginBottom:10,padding:"8px 10px",background:"#F2F2F0",borderRadius:7}},Ico("note",14,"#999"),ce("span",{style:{fontSize:13,color:"#555",lineHeight:1.5}},task.notes)):null,
      task.subtasks.length>0?ce("div",{style:{marginBottom:10}},subItems):null,
      rec&&task.due?ce("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:10,padding:"6px 10px",background:RC.bg,borderRadius:7}},Ico("recur",13,RC.tx),ce("span",{style:{fontSize:12,color:RC.tx}},recLbl+" · Next: "+fmt(addInt(task.due,task.recur)))):null,
      ce("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:4,flexWrap:"wrap",gap:8}},
        ce("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},moveBtns),
        ce("div",{style:{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#999"}},Av(task.to,16),ce("span",null,task.to),task.by!==task.to?ce("span",{style:{color:"#ddd"}},"· by "+task.by):null)
      )
    );
  }

  return ce("div",{style:{background:WH,border:"0.5px solid #E2E2E0",borderRadius:10,marginBottom:8,overflow:"hidden"}},
    ce("div",{style:{borderLeft:"3px solid "+cm.ac,padding:"10px 12px",cursor:"pointer"},onClick:function(){setOpen(!open);}},
      ce("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}},
        ce("div",{style:{display:"flex",alignItems:"flex-start",gap:8,flex:1,minWidth:0}},PBadge(task.pri),ce("span",{style:{fontWeight:500,fontSize:14,lineHeight:1.4,color:BLK}},task.title)),
        ce("div",{style:{display:"flex",gap:2,flexShrink:0,alignItems:"center"}},
          can?ce("button",{onClick:function(e){e.stopPropagation();props.onEdit(task);},style:{background:"none",border:"none",cursor:"pointer",padding:4,color:"#999",display:"flex"}},Ico("edit",14)):null,
          can?ce("button",{onClick:function(e){e.stopPropagation();props.onDel(task.id);},style:{background:"none",border:"none",cursor:"pointer",padding:4,color:"#999",display:"flex"}},Ico("trash",14)):null,
          ce("div",{style:{color:"#bbb",paddingLeft:2}},open?Ico("chevu",14):Ico("chev",14))
        )
      ),
      ce("div",{style:{display:"flex",flexWrap:"wrap",gap:5,marginTop:8,alignItems:"center"}},
        Tag(cc.bg,cc.tx,cc.bd,lbl),duePill,recPill,shPill,subPill,
        ce("div",{key:"av",style:{marginLeft:"auto"}},avStack)
      )
    ),
    expandBody
  );
}

function TaskCard(props){
  var [open,setOpen]=useState(false);
  return ce(CardInner,Object.assign({},props,{open:open,setOpen:setOpen}));
}

// ── TaskModal ──────────────────────────────────────────────────────────────
function TaskModal(props){
  var task=props.task,cu=props.cu;
  var uctxs=USERS[cu].ctxs;
  var defCtx=uctxs[0]||NI[0];
  var blank={title:"",ctx:defCtx,pri:"Medium",due:"",notes:"",subtasks:[],recur:"None",by:cu,to:cu,shared:false};
  var initF=task?Object.assign({},task,{subtasks:task.subtasks.map(function(s){return Object.assign({},s);})}):blank;
  var [f,setF]=useState(initF);
  var [stxt,setStxt]=useState("");
  function set(k,v){setF(function(p){return Object.assign({},p,{[k]:v});});}
  function addSub(){if(!stxt.trim())return;set("subtasks",f.subtasks.concat([{text:stxt.trim(),done:false}]));setStxt("");}

  var inp={width:"100%",padding:"8px 10px",borderRadius:7,border:"0.5px solid #DDD",background:WH,fontSize:14,color:BLK,boxSizing:"border-box"};
  var lb={fontSize:12,color:"#666",display:"block",marginBottom:4,fontWeight:500};
  var nodes=TREE.filter(function(n){return n.subs.some(function(c){return uctxs.indexOf(c.id)>=0;});});
  var assignable=Object.keys(USERS).filter(function(u){if(u==="Gin"&&!USERS[cu].canGin&&cu!=="Gin")return false;return USERS[u].ctxs.indexOf(f.ctx)>=0||u===cu;});
  var isPersonal=isPers(f.ctx);

  var catNodes=nodes.map(function(node){
    var leaves=node.subs.filter(function(c){return uctxs.indexOf(c.id)>=0;});
    return ce("div",{key:node.id},
      ce("div",{style:{fontSize:10,fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}},node.label),
      ce("div",{style:{display:"flex",flexWrap:"wrap",gap:5}},
        leaves.map(function(c){var a=f.ctx===c.id,col=CTC[c.id]||{bg:"#F2F2F0",tx:"#555",bd:"#DDD"};return ce("button",{key:c.id,onClick:function(){set("ctx",c.id);},style:{padding:"4px 11px",borderRadius:20,fontSize:12,fontWeight:a?600:400,border:a?"1.5px solid "+col.bd:"0.5px solid #DDD",background:a?col.bg:"#F7F7F6",color:a?col.tx:"#555",cursor:"pointer"}},c.label);})
      )
    );
  });

  var assignSection;
  if(isPersonal){
    var toggle=ce("div",{style:{display:"flex",gap:8,marginBottom:6}},
      ce("button",{onClick:function(){set("shared",false);},style:{flex:1,padding:"7px 10px",borderRadius:9,border:!f.shared?"1.5px solid #6B21A8":"0.5px solid #DDD",background:!f.shared?"#FEF0FF":"#F7F7F6",cursor:"pointer",fontSize:12,fontWeight:!f.shared?600:400,color:!f.shared?"#6B21A8":"#555"}},"One person"),
      ce("button",{onClick:function(){set("shared",true);},style:{flex:1,padding:"7px 10px",borderRadius:9,border:f.shared?"1.5px solid #6B21A8":"0.5px solid #DDD",background:f.shared?"#FEF0FF":"#F7F7F6",cursor:"pointer",fontSize:12,fontWeight:f.shared?600:400,color:f.shared?"#6B21A8":"#555"}},"Both")
    );
    var hint=f.shared?ce("p",{style:{fontSize:11,color:"#6B21A8",background:"#FEF0FF",padding:"5px 10px",borderRadius:6,margin:"0 0 6px"}},"Either can complete — marks done for both."):null;
    var pick=!f.shared?ce("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},assignable.map(function(u){var a=f.to===u,usr=USERS[u];return ce("button",{key:u,onClick:function(){set("to",u);},style:{flex:1,display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:9,border:a?"1.5px solid "+usr.color:"0.5px solid #DDD",background:a?usr.bg:"#F7F7F6",cursor:"pointer",minWidth:80}},Av(u,20),ce("span",{style:{fontSize:12,fontWeight:a?500:400,color:a?usr.color:"#555"}},u),a?ce("div",{style:{marginLeft:"auto",width:14,height:14,borderRadius:"50%",background:MB,display:"flex",alignItems:"center",justifyContent:"center"}},Ico("check",9,"#fff")):null);})):null;
    assignSection=ce("div",{style:{marginBottom:14}},toggle,hint,pick);
  } else {
    assignSection=ce("div",{style:{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}},
      assignable.map(function(u){var a=f.to===u,usr=USERS[u];return ce("button",{key:u,onClick:function(){set("to",u);},style:{flex:1,display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:9,border:a?"1.5px solid "+usr.color:"0.5px solid #DDD",background:a?usr.bg:"#F7F7F6",cursor:"pointer",minWidth:80}},Av(u,20),ce("span",{style:{fontSize:12,fontWeight:a?500:400,color:a?usr.color:"#555"}},u),a?ce("div",{style:{marginLeft:"auto",width:14,height:14,borderRadius:"50%",background:MB,display:"flex",alignItems:"center",justifyContent:"center"}},Ico("check",9,"#fff")):null);})
    );
  }

  return ce("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100},onClick:props.onClose},
    ce("div",{style:{background:WH,borderRadius:14,padding:"22px 24px",width:"min(92vw,460px)",maxHeight:"86vh",overflowY:"auto"},onClick:function(e){e.stopPropagation();}},
      ce("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}},
        ce("div",{style:{display:"flex",alignItems:"center",gap:10}},Av(cu,28),ce("h2",{style:{margin:0,fontSize:16,fontWeight:500,color:BLK}},task?"Edit task":"New task")),
        ce("button",{onClick:props.onClose,style:{background:"none",border:"none",cursor:"pointer",color:"#bbb",display:"flex",padding:4}},Ico("x",16))
      ),
      ce("label",{style:lb},"Title"),
      ce("input",{style:Object.assign({},inp,{marginBottom:14}),value:f.title,onChange:function(e){set("title",e.target.value);},placeholder:"Task title"}),
      ce("label",{style:lb},"Category"),
      ce("div",{style:{marginBottom:14,display:"flex",flexDirection:"column",gap:10}},catNodes),
      ce("label",{style:lb},"Priority"),
      ce("div",{style:{display:"flex",gap:6,marginBottom:14}},PK.map(function(p){var pc=PRI[p],a=f.pri===p;return ce("button",{key:p,onClick:function(){set("pri",p);},style:{flex:1,padding:"7px 0",borderRadius:7,border:a?"1.5px solid "+pc.bd:"0.5px solid #DDD",background:a?pc.bg:"#F7F7F6",cursor:"pointer"}},ce("span",{style:{fontSize:12,fontWeight:700,color:a?pc.tx:"#aaa"}},pc.lbl));})),
      ce("div",{style:{marginBottom:14}},
        ce("div",null,ce("label",{style:lb},"Due date"),ce("input",{type:"date",style:inp,value:f.due,onChange:function(e){set("due",e.target.value);}}))
      ),
      ce("label",{style:lb},"Repeats"),
      ce("div",{style:{marginBottom:14}},ce(RecurPicker,{value:f.recur,onChange:function(v){set("recur",v);}})),
      f.recur!=="None"&&f.due?ce("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:RC.bg,borderRadius:7,marginBottom:14}},Ico("recur",13,RC.tx),ce("span",{style:{fontSize:12,color:RC.tx}},"Next: "+fmt(addInt(f.due,f.recur)))):null,
      ce("label",{style:lb},"Assign to"),
      assignSection,
      ce("label",{style:lb},"Notes"),
      ce("textarea",{style:Object.assign({},inp,{marginBottom:14,minHeight:52,resize:"vertical"}),value:f.notes,onChange:function(e){set("notes",e.target.value);},placeholder:"Optional notes..."}),
      ce("label",{style:lb},"Subtasks"),
      ce("div",{style:{marginBottom:8}},f.subtasks.map(function(s,i){
        return ce("div",{key:i,style:{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"0.5px solid #EEE"}},
          ce("div",{onClick:function(){set("subtasks",f.subtasks.map(function(x,j){return j===i?Object.assign({},x,{done:!x.done}):x;}));},style:{width:16,height:16,borderRadius:4,border:"1.5px solid "+(s.done?MB:"#DDD"),background:s.done?MB:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}},s.done?Ico("check",10,"#fff"):null),
          ce("span",{style:{fontSize:13,flex:1,textDecoration:s.done?"line-through":"none",color:s.done?"#aaa":BLK}},s.text),
          ce("button",{onClick:function(){set("subtasks",f.subtasks.filter(function(_,j){return j!==i;}));},style:{background:"none",border:"none",cursor:"pointer",color:"#bbb",display:"flex",padding:2}},Ico("x",13))
        );
      })),
      ce("div",{style:{display:"flex",gap:6,marginBottom:20}},
        ce("input",{style:Object.assign({},inp,{flex:1}),value:stxt,onChange:function(e){setStxt(e.target.value);},onKeyDown:function(e){if(e.key==="Enter")addSub();},placeholder:"Add subtask..."}),
        ce("button",{onClick:addSub,style:{padding:"8px 10px",borderRadius:7,border:"0.5px solid "+MB,background:"#E8FBF1",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:4,color:MD}},Ico("plus",13,MD)," Add")
      ),
      ce("div",{style:{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"0.5px solid #EEE",paddingTop:16}},
        ce("button",{onClick:props.onClose,style:{padding:"8px 16px",borderRadius:8,border:"0.5px solid #DDD",background:"none",cursor:"pointer",fontSize:14,color:"#666"}},"Cancel"),
        ce("button",{onClick:function(){if(f.title.trim())props.onSave(f);},style:{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:8,border:"none",background:MB,cursor:"pointer",fontSize:14,fontWeight:600,color:BLK}},Ico("check",14,BLK)," Save")
      )
    )
  );
}

// ── RecurModal ─────────────────────────────────────────────────────────────
function RecurModal(props){
  var task=props.task;
  return ce("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200},onClick:props.onClose},
    ce("div",{style:{background:WH,borderRadius:14,padding:"22px 24px",width:"min(90vw,380px)"},onClick:function(e){e.stopPropagation();}},
      ce("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:14}},
        ce("div",{style:{width:36,height:36,borderRadius:9,background:RC.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},Ico("recur",18,RC.tx)),
        ce("h2",{style:{margin:0,fontSize:16,fontWeight:500,color:BLK}},"Recurring task completed")
      ),
      ce("p",{style:{fontSize:13,color:"#666",margin:"0 0 8px"}},ce("span",{style:{fontWeight:500,color:BLK}},task.title)," repeats ",recurLabel(task.recur)||task.recur,"."  ),
      task.due?ce("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:RC.bg,borderRadius:7,marginBottom:16}},Ico("cal",13,RC.tx),ce("span",{style:{fontSize:12,color:RC.tx}},"Next due: "+fmt(addInt(task.due,task.recur)))):null,
      ce("div",{style:{display:"flex",flexDirection:"column",gap:8}},
        ce("button",{onClick:props.onSpawn,style:{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:9,border:"none",background:MB,cursor:"pointer",fontSize:14,fontWeight:600,color:BLK,textAlign:"left"}},Ico("recur",15,BLK)," Mark done and create next"),
        ce("button",{onClick:props.onArchive,style:{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:9,border:"0.5px solid #DDD",background:"#F2F2F0",cursor:"pointer",fontSize:14,color:BLK,textAlign:"left"}},Ico("check",15)," Mark done only"),
        ce("button",{onClick:props.onClose,style:{padding:"10px 14px",borderRadius:9,border:"none",background:"none",cursor:"pointer",fontSize:14,color:"#999",textAlign:"left"}},"Cancel")
      )
    )
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar(props){
  var cu=props.cu,sel=props.sel,tasks=props.tasks,af=props.af,setAf=props.setAf;
  var uctxs=USERS[cu].ctxs;
  var [exp,setExp]=useState({N:false,K:false,P:true});
  function cnt(arr){return tasks.filter(function(t){return arr.indexOf(t.ctx)>=0&&t.status!=="Done";}).length;}
  function togExp(id){setExp(function(e){return Object.assign({},e,{[id]:!e[id]});});}
  var nodes=TREE.filter(function(n){return n.subs.some(function(c){return uctxs.indexOf(c.id)>=0;});});
  var allCnt=cnt(AI);

  var allBtn=cu==="Jhonatan"?ce("button",{onClick:function(){props.onSel("All");},style:{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,border:sel==="All"?"1.5px solid "+MB:"0.5px solid transparent",background:sel==="All"?"#E8FBF1":"transparent",cursor:"pointer",width:"100%",textAlign:"left"}},
    Ico("layers",14,sel==="All"?MD:"#999"),
    ce("span",{style:{fontSize:13,fontWeight:sel==="All"?600:400,color:sel==="All"?MD:"#555",flex:1}},"All tasks"),
    allCnt>0?ce("span",{style:{fontSize:11,color:sel==="All"?MD:"#aaa",background:sel==="All"?ML+"66":"#EBEBEA",borderRadius:20,padding:"0 6px"}},allCnt):null
  ):null;

  var nodeEls=nodes.map(function(node){
    var leaves=node.subs.filter(function(c){return uctxs.indexOf(c.id)>=0;});
    var leafIds=leaves.map(function(c){return c.id;});
    var pSel=sel===node.id;
    var ps=PC[node.id]||{ac:"#888",bg:"#F5F5F5",tx:"#333"};
    var isExp=!!exp[node.id];
    var pCnt=cnt(leafIds);
    var leafEls=isExp?leaves.map(function(c){
      var cSel=sel===c.id,cc=CTC[c.id]||{bg:"#F2F2F0",tx:"#555",bd:"#DDD"},cCnt=cnt([c.id]);
      return ce("button",{key:c.id,onClick:function(){props.onSel(cSel?node.id:c.id);},style:{display:"flex",alignItems:"center",gap:7,padding:"5px 10px",borderRadius:7,border:cSel?"1.5px solid "+cc.bd:"0.5px solid transparent",background:cSel?cc.bg:"transparent",cursor:"pointer",width:"100%",textAlign:"left"}},
        ce("span",{style:{width:6,height:6,borderRadius:"50%",background:cc.bd,flexShrink:0}}),
        ce("span",{style:{fontSize:12,fontWeight:cSel?600:400,color:cSel?cc.tx:"#666",flex:1}},c.label),
        cCnt>0?ce("span",{style:{fontSize:10,color:cSel?cc.tx:"#bbb",background:cSel?cc.bg:"#EBEBEA",borderRadius:20,padding:"0 5px"}},cCnt):null
      );
    }):[];
    return ce("div",{key:node.id},
      ce("button",{onClick:function(){togExp(node.id);props.onSel(node.id);},style:{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,border:pSel?"1.5px solid "+ps.ac:"0.5px solid transparent",background:pSel?ps.bg:"transparent",cursor:"pointer",width:"100%",textAlign:"left"}},
        ce("span",{style:{width:8,height:8,borderRadius:2,background:ps.ac,flexShrink:0}}),
        ce("span",{style:{fontSize:13,fontWeight:pSel?600:500,color:pSel?ps.tx:"#333",flex:1}},node.label),
        pCnt>0?ce("span",{style:{fontSize:11,color:pSel?ps.tx:"#aaa",background:pSel?ps.ac+"33":"#EBEBEA",borderRadius:20,padding:"0 6px"}},pCnt):null,
        Ico(isExp?"chevu":"chev",12,"#bbb")
      ),
      isExp?ce("div",{style:{marginLeft:18,marginTop:2,display:"flex",flexDirection:"column",gap:1}},leafEls):null
    );
  });

  return ce("div",{style:{width:190,flexShrink:0,display:"flex",flexDirection:"column",gap:2}},
    allBtn,nodeEls,
    ce("div",{style:{borderTop:"0.5px solid #EEE",marginTop:8,paddingTop:10,display:"flex",flexDirection:"column",gap:1}},
      ce("div",{style:{fontSize:10,fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:".06em",paddingLeft:10,marginBottom:4}},"Assigned to"),
      ce("button",{onClick:function(){setAf("All");},style:{display:"flex",alignItems:"center",gap:7,padding:"5px 10px",borderRadius:7,border:af==="All"?"1.5px solid #CCC":"0.5px solid transparent",background:af==="All"?"#EBEBEA":"transparent",cursor:"pointer",width:"100%"}},
        ce("span",{style:{fontSize:12,fontWeight:af==="All"?600:400,color:af==="All"?"#333":"#666"}},"Everyone")
      ),
      Object.keys(USERS).map(function(u){
        var a=af===u,usr=USERS[u];
        return ce("button",{key:u,onClick:function(){setAf(a?"All":u);},style:{display:"flex",alignItems:"center",gap:7,padding:"5px 10px",borderRadius:7,border:a?"1.5px solid "+usr.color:"0.5px solid transparent",background:a?usr.bg:"transparent",cursor:"pointer",width:"100%"}},
          Av(u,18),ce("span",{style:{fontSize:12,fontWeight:a?600:400,color:a?usr.color:"#666"}},u)
        );
      })
    )
  );
}

// ── CalendarView ───────────────────────────────────────────────────────────
function CalendarView(props){
  var cu=props.cu,tasks=props.tasks;
  var now=new Date();
  var [yr,setYr]=useState(now.getFullYear());
  var [mon,setMon]=useState(now.getMonth());
  var monStr=yr+"-"+padZ(mon+1);
  var todayStr=now.getFullYear()+"-"+padZ(now.getMonth()+1)+"-"+padZ(now.getDate());
  var firstDay=new Date(yr,mon,1).getDay();
  var daysInMonth=new Date(yr,mon+1,0).getDate();
  var myTasks=tasks.filter(function(t){return t.due&&t.status!=="Done"&&(t.to===cu||(t.shared&&isPers(t.ctx)));});
  var taskCount=myTasks.filter(function(t){return t.due&&t.due.slice(0,7)===monStr;}).length;
  function prevMon(){if(mon===0){setMon(11);setYr(yr-1);}else{setMon(mon-1);}}
  function nextMon(){if(mon===11){setMon(0);setYr(yr+1);}else{setMon(mon+1);}}
  var cells=[];var i;
  for(i=0;i<firstDay;i++){cells.push(null);}
  for(i=1;i<=daysInMonth;i++){cells.push(i);}
  while(cells.length%7!==0){cells.push(null);}
  var hdrCells=DN.map(function(d){return ce("div",{key:d,style:{fontSize:11,fontWeight:600,color:"#aaa",textAlign:"center",padding:"4px 0",textTransform:"uppercase",letterSpacing:".05em"}},d);});
  var rowEls=[];
  for(var r=0;r<cells.length/7;r++){
    var rowCells=cells.slice(r*7,r*7+7);
    var cellEls=rowCells.map(function(day,ci){
      if(!day){return ce("div",{key:"e"+ci,style:{minHeight:72}});}
      var ds=monStr+"-"+padZ(day);
      var dayTasks=myTasks.filter(function(t){return t.due===ds;});
      var isToday=ds===todayStr;
      var isOver=new Date(ds)<now&&!isToday;
      var pills=dayTasks.slice(0,3).map(function(t,ti){var pc=PRI[t.pri]||{bg:"#F2F2F0",tx:"#555"};return ce("div",{key:ti,style:{fontSize:10,padding:"2px 5px",borderRadius:4,background:pc.bg,color:pc.tx,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}},ctxLbl(t.ctx)+": "+t.title);});
      if(dayTasks.length>3){pills.push(ce("div",{key:"more",style:{fontSize:10,color:"#999",marginTop:2}},"+"+(dayTasks.length-3)+" more"));}
      return ce("div",{key:day,style:{minHeight:72,background:isToday?"#E8FBF1":WH,borderRadius:8,border:isToday?"1.5px solid "+MB:"0.5px solid #E2E2E0",padding:"5px 7px"}},
        ce("div",{style:{fontSize:12,fontWeight:isToday?700:400,color:isToday?MD:isOver?"#ccc":BLK,marginBottom:2}},day),pills
      );
    });
    rowEls.push(ce("div",{key:"r"+r,style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}},cellEls));
  }
  return ce("div",{style:{background:WH,borderRadius:12,padding:"16px 18px",border:"0.5px solid #E2E2E0"}},
    ce("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}},
      ce("div",{style:{display:"flex",alignItems:"center",gap:10}},
        ce("button",{onClick:prevMon,style:{background:"none",border:"0.5px solid #DDD",borderRadius:7,cursor:"pointer",padding:"4px 10px",fontSize:14,color:"#555"}},"<"),
        ce("span",{style:{fontSize:15,fontWeight:600,color:BLK}},MN[mon]+" "+yr),
        ce("button",{onClick:nextMon,style:{background:"none",border:"0.5px solid #DDD",borderRadius:7,cursor:"pointer",padding:"4px 10px",fontSize:14,color:"#555"}},">")
      ),
      taskCount>0?ce("span",{style:{fontSize:12,color:MD,background:"#E0F7EE",padding:"3px 10px",borderRadius:20,border:"0.5px solid "+MB}},taskCount+" task"+(taskCount===1?"":"s")+" this month"):ce("span",{style:{fontSize:12,color:"#aaa"}},"No tasks this month")
    ),
    ce("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}},hdrCells),
    ce("div",{style:{display:"flex",flexDirection:"column",gap:4}},rowEls)
  );
}

// ── App ────────────────────────────────────────────────────────────────────
function App(){
  var [cu,setCu]=useState(null);
  var [tasks,setTasks]=useState([]);
  var [loading,setLoading]=useState(false);
  var [sel,setSel]=useState("All");
  var [af,setAf]=useState("All");
  var [srt,setSrt]=useState(null);
  var [view,setView]=useState("board");
  var [modal,setModal]=useState(false);
  var [editT,setEditT]=useState(null);
  var [recurT,setRecurT]=useState(null);
  var [sideOpen,setSideOpen]=useState(window.innerWidth>=700);

  // load tasks from supabase
  var loadTasks=useCallback(function(){
    setLoading(true);
    sb.from("tasks").select("*").order("created_at",{ascending:true}).then(function(result){
      setLoading(false);
      if(result.data){setTasks(result.data.map(dbToTask));}
    });
  },[]);

  // realtime subscription
  useEffect(function(){
    if(!cu)return;
    loadTasks();
    var channel=sb.channel("tasks-changes").on("postgres_changes",{event:"*",schema:"public",table:"tasks"},function(){loadTasks();}).subscribe();
    return function(){sb.removeChannel(channel);};
  },[cu,loadTasks]);

  if(!cu){return ce(Login,{onLogin:function(u){setCu(u);setSel(u==="Jhonatan"?"All":u==="Sarah"?"P":"N");}});}

  var uctxs=USERS[cu].ctxs;
  var actCtxs=resolveCtxs(sel,uctxs);
  var allVis=tasks.filter(function(t){
    if(uctxs.indexOf(t.ctx)>=0)return true;
    if(t.shared&&isPers(t.ctx)&&(cu==="Jhonatan"||cu==="Sarah"))return true;
    return false;
  });
  var base=tasks.filter(function(t){
    var inCtx=actCtxs.indexOf(t.ctx)>=0;
    var sv=t.shared&&isPers(t.ctx)&&(cu==="Jhonatan"||cu==="Sarah");
    if(!inCtx&&!sv)return false;
    if(af!=="All"&&!t.shared&&t.to!==af)return false;
    return true;
  });
  var sorted=srt?base.slice().sort(function(a,b){
    if(srt==="pa")return PO[a.pri]-PO[b.pri];
    if(srt==="pd")return PO[b.pri]-PO[a.pri];
    if(srt==="da")return(a.due||"9999")>(b.due||"9999")?1:-1;
    if(srt==="dd")return(a.due||"0000")<(b.due||"0000")?1:-1;
    return 0;
  }):base;

  var openCnt=allVis.filter(function(t){return t.status!=="Done";}).length;
  var recCnt=allVis.filter(function(t){return t.recur!=="None"&&t.status!=="Done";}).length;
  var mineCnt=allVis.filter(function(t){return(t.to===cu||t.shared)&&t.status!=="Done";}).length;
  var vl=getVL(sel);
  var roleLbl=cu==="Gin"?"Work only":cu==="Sarah"?"Personal & Rentals":"Full access";

  function saveTask(form){
    var data=taskToDb(form,cu);
    if(editT){
      sb.from("tasks").update(data).eq("id",editT.id).then(function(){loadTasks();});
    } else {
      sb.from("tasks").insert([data]).then(function(){loadTasks();});
    }
    setModal(false);setEditT(null);
  }
  function moveTask(id,st){
    sb.from("tasks").update({status:st}).eq("id",id).then(function(){loadTasks();});
  }
  function delTask(id){
    sb.from("tasks").delete().eq("id",id).then(function(){loadTasks();});
  }
  function doComplete(task){if(task.recur!=="None"){setRecurT(task);}else{moveTask(task.id,"Done");}}
  function spawnNext(){
    var t=recurT,nd=addInt(t.due,t.recur);
    sb.from("tasks").update({status:"Done"}).eq("id",t.id).then(function(){
      var newTask=taskToDb(Object.assign({},t,{status:"To Do",due:nd,subtasks:t.subtasks.map(function(s){return Object.assign({},s,{done:false});})}),t.by);
      sb.from("tasks").insert([newTask]).then(function(){loadTasks();});
    });
    setRecurT(null);
  }

  var statEls=[{lb:"open",v:openCnt,bg:"#F2F2F0",tc:"#444",bc:"#DDD"},{lb:"recurring",v:recCnt,bg:RC.bg,tc:RC.tx,bc:RC.bd},{lb:"mine",v:mineCnt,bg:"#E0F7EE",tc:MD,bc:MB}].map(function(s){
    return ce("div",{key:s.lb,style:{textAlign:"center",padding:"5px 11px",background:s.bg,borderRadius:8,border:"0.5px solid "+s.bc}},
      ce("div",{style:{fontSize:16,fontWeight:600,lineHeight:1.1,color:s.tc}},s.v),
      ce("div",{style:{fontSize:10,color:s.tc,marginTop:1,opacity:.8}},s.lb)
    );
  });

  var sortBtns=[{k:"pa",lb:"Priority Hi",ic:"sortup"},{k:"pd",lb:"Priority Lo",ic:"sortdn"},{k:"da",lb:"Due asc",ic:"sortup"},{k:"dd",lb:"Due desc",ic:"sortdn"}].map(function(sb){
    var a=srt===sb.k;
    return ce("button",{key:sb.k,onClick:function(){setSrt(a?null:sb.k);},style:{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:a?600:400,border:a?"1.5px solid "+MB:"0.5px solid #DDD",background:a?"#E8FBF1":"#F7F7F6",color:a?MD:"#666",cursor:"pointer"}},
      Ico(sb.ic,11,a?MD:"#999")," ",sb.lb
    );
  });

  var colEls=COLS.map(function(col){
    var cm=CC[col];
    var items=sorted.filter(function(t){return t.status===col;});
    var cards=items.length===0?[ce("div",{key:"empty",style:{textAlign:"center",padding:"22px 0",color:"#bbb",fontSize:13}},"No tasks")]:items.map(function(t){return ce(TaskCard,{key:t.id,task:t,cu:cu,onMove:moveTask,onEdit:function(tk){setEditT(tk);setModal(true);},onDel:delTask,onComplete:doComplete});});
    return ce("div",{key:col},
      ce("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"7px 10px",background:cm.bg,borderRadius:8,border:"0.5px solid "+cm.ac+"33"}},
        ce("span",{style:{width:8,height:8,borderRadius:"50%",background:cm.ac,flexShrink:0}}),
        ce("span",{style:{fontSize:13,fontWeight:600,color:cm.tx,flex:1}},col),
        ce("span",{style:{fontSize:12,color:cm.tx,background:"rgba(255,255,255,.75)",borderRadius:20,padding:"1px 8px",border:"0.5px solid "+cm.ac+"44"}},items.length)
      ),
      cards
    );
  });

  var boardView=ce("div",{style:{flex:1,minWidth:0}},
    ce("div",{style:{marginBottom:8,display:"flex",alignItems:"center",gap:8}},
      ce("span",{style:{fontSize:14,fontWeight:600,color:BLK}},vl),
      ce("span",{style:{fontSize:12,color:"#aaa"}},"·"),
      ce("span",{style:{fontSize:12,color:"#888"}},base.filter(function(t){return t.status!=="Done";}).length+" open")
    ),
    ce("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:10,flexWrap:"wrap"}},
      ce("span",{style:{fontSize:11,color:"#aaa",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}},"Sort"),
      sortBtns,
      srt?ce("button",{onClick:function(){setSrt(null);},style:{fontSize:11,color:"#999",background:"none",border:"none",cursor:"pointer",padding:"2px 4px"}},"x clear"):null
    ),
    loading?ce("div",{style:{textAlign:"center",padding:40,color:"#aaa",fontSize:13}},"Loading tasks..."):ce("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}},colEls)
  );

  var calView=ce("div",{style:{flex:1,minWidth:0}},
    ce("div",{style:{marginBottom:12,display:"flex",alignItems:"center",gap:8}},
      ce("span",{style:{fontSize:14,fontWeight:600,color:BLK}},"Calendar"),
      ce("span",{style:{fontSize:12,color:"#aaa"}},"·"),
      ce("span",{style:{fontSize:12,color:"#888"}},"Your tasks by due date")
    ),
    ce(CalendarView,{cu:cu,tasks:allVis})
  );

  var topBar=ce("div",{style:{background:WH,borderRadius:12,padding:"10px 14px",marginBottom:12,border:"0.5px solid #E2E2E0",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}},
    // Sidebar toggle button
    ce("button",{onClick:function(){setSideOpen(function(o){return !o;});},style:{display:"flex",alignItems:"center",justifyContent:"center",width:34,height:34,borderRadius:8,border:"0.5px solid #DDD",background:sideOpen?"#E8FBF1":"#F7F7F6",cursor:"pointer",flexShrink:0}},
      svg(sideOpen?["M3 5h10","M3 8h7","M3 11h4"]:["M3 5h10","M3 8h10","M3 11h10"],16,16,sideOpen?MD:"#666")
    ),
    ColorBar(),
    ce("div",{style:{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",flex:1}},
      statEls
    ),
    ce("div",{style:{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}},
      ce("button",{onClick:function(){setEditT(null);setModal(true);},style:{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:9,fontSize:13,fontWeight:600,border:"none",background:MB,color:BLK,cursor:"pointer"}},Ico("plus",14,BLK)," New task"),
      ce("div",{style:{display:"flex",border:"0.5px solid #DDD",borderRadius:8,overflow:"hidden"}},
        ce("button",{onClick:function(){setView("board");},style:{padding:"6px 11px",fontSize:12,fontWeight:view==="board"?600:400,background:view==="board"?MB:"#F7F7F6",color:view==="board"?BLK:"#666",border:"none",cursor:"pointer"}},"Board"),
        ce("button",{onClick:function(){setView("calendar");},style:{padding:"6px 11px",fontSize:12,fontWeight:view==="calendar"?600:400,background:view==="calendar"?MB:"#F7F7F6",color:view==="calendar"?BLK:"#666",border:"none",cursor:"pointer"}},"Calendar")
      ),
      ce("div",{style:{display:"flex",alignItems:"center",gap:7,padding:"5px 9px",background:"#F7F7F6",borderRadius:9,border:"0.5px solid #E2E2E0"}},
        Av(cu,24),
        ce("div",{style:{fontSize:12,fontWeight:600,color:BLK,lineHeight:1.2}},cu),
        ce("button",{onClick:function(){setCu(null);},style:{background:"none",border:"none",cursor:"pointer",color:"#bbb",display:"flex",padding:3,marginLeft:2}},Ico("logout",14))
      )
    )
  );

  var modalEl=null;
  if(modal){modalEl=ce(TaskModal,{task:editT,cu:cu,onSave:saveTask,onClose:function(){setModal(false);setEditT(null);}});}
  var recurEl=null;
  if(recurT){recurEl=ce(RecurModal,{task:recurT,onSpawn:spawnNext,onArchive:function(){moveTask(recurT.id,"Done");setRecurT(null);},onClose:function(){setRecurT(null);}});}

  return ce("div",{style:{background:"#F2F2F0",minHeight:"100vh",padding:14,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}},
    topBar,
    ce("div",{style:{display:"flex",gap:12,alignItems:"flex-start",position:"relative"}},
      // Sidebar — on mobile overlays as a drawer, on desktop stays inline
      sideOpen?ce("div",{style:{
        background:WH,borderRadius:12,padding:"12px 10px",border:"0.5px solid #E2E2E0",flexShrink:0,
        position:window.innerWidth<700?"fixed":"relative",
        top:window.innerWidth<700?0:undefined,
        left:window.innerWidth<700?0:undefined,
        bottom:window.innerWidth<700?0:undefined,
        zIndex:window.innerWidth<700?150:undefined,
        width:window.innerWidth<700?"75vw":undefined,
        boxShadow:window.innerWidth<700?"4px 0 24px rgba(0,0,0,.18)":undefined,
        overflowY:window.innerWidth<700?"auto":undefined,
        paddingTop:window.innerWidth<700?20:undefined,
      }},
        // Close button on mobile
        window.innerWidth<700?ce("button",{onClick:function(){setSideOpen(false);},style:{position:"absolute",top:12,right:12,background:"none",border:"none",cursor:"pointer",color:"#aaa",display:"flex",padding:4}},Ico("x",16)):null,
        ce(Sidebar,{cu:cu,sel:sel,onSel:function(s){setSel(s);if(window.innerWidth<700)setSideOpen(false);},tasks:allVis,af:af,setAf:setAf})
      ):null,
      // Mobile backdrop
      sideOpen&&window.innerWidth<700?ce("div",{onClick:function(){setSideOpen(false);},style:{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:140}}):null,
      // Main content
      ce("div",{style:{flex:1,minWidth:0,overflowX:"auto"}},
        view==="calendar"?calView:boardView
      )
    ),
    modalEl,recurEl
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(ce(App,null));
