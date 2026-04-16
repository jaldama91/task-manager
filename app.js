const SUPABASE_URL = "https://cwimgkiiswmpnpjbwply.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aW1na2lpc3dtcG5wamJ3cGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDExNDIsImV4cCI6MjA5MTY3NzE0Mn0.TdLVJcNHtEo6A5D6bJCJkHj7aICTDQNeEOD5kY1cNWA";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

const { useState, useEffect, useCallback } = React;

// ── taxonomy ───────────────────────────────────────────────────────────────
var NS=["Strategy","Finances","Operations","People","Clients","Marketing"];
var SW=["Strategy","Finances","Operations","Clients","Projects"];
var SWI=SW.map(function(s){return "SW:"+s;});
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
  {id:"SW",label:"My Work",     subs:SW.map(function(s,i){return {id:"SW:"+s,label:s};})},
];

var USERS={
  Jhonatan:{ini:"JA",color:"#00965E",bg:"#E0F7EE",ctxs:AI,          canGin:true, canSarah:true },
  Sarah:   {ini:"SA",color:"#0F6E9A",bg:"#E0F2FB",ctxs:PI.concat(SWI),canGin:false,canSarah:false},
  Gin:     {ini:"GN",color:"#7C3AED",bg:"#EDE9FE",ctxs:NI.concat(KI),canGin:false,canSarah:false,canAssignJPersonal:true},
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
SWI.forEach(function(id){CTC[id]={bg:"#FEF0FF",tx:"#6B21A8",bd:"#D8B4FE"};});

var PC={N:{ac:"#2AD870",bg:"#E8FBF1",tx:"#065F46"},K:{ac:"#EAB308",bg:"#FEF9C3",tx:"#854D0E"},P:{ac:"#6366F1",bg:"#EEF2FF",tx:"#3730A3"},SW:{ac:"#A855F7",bg:"#FEF0FF",tx:"#6B21A8"}};
var CC={"To Do":{ac:"#2563EB",tx:"#1E40AF",bg:"#EFF6FF"},"In Progress":{ac:"#2AD870",tx:"#065F46",bg:"#E8FBF1"},"Done":{ac:"#00965E",tx:"#065F46",bg:"#D4F7E5"}};
var RC={bg:"#D4F7E5",tx:"#00965E",bd:"#2AD870"};
function ctxLbl(ctx){return ctx.indexOf(":")>=0?ctx.split(":")[1]:ctx;}
function ctxParent(ctx){
  // Returns the parent category label for a ctx id
  for(var i=0;i<TREE.length;i++){
    for(var j=0;j<TREE[i].subs.length;j++){
      if(TREE[i].subs[j].id===ctx)return TREE[i].label;
    }
    // If ctx IS a parent id
    if(TREE[i].id===ctx)return TREE[i].label;
  }
  return ctx;
}
var DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var ORDINALS=["1st","2nd","3rd","4th","5th"];
var COLS=["To Do","In Progress","Done"];
var MN=["January","February","March","April","May","June","July","August","September","October","November","December"];
var DN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var MB="#2AD870",ML="#8FF9BA",MD="#00965E",BLK="#111",WH="#fff";

function fmt(s){if(!s)return "";var p=s.split("-");return p[1]+"/"+p[2]+"/"+p[0].slice(2);}
function padZ(n){return String(n).padStart(2,"0");}
// ── Recur helpers ──────────────────────────────────────────────────────────
// recur format:  "None" | "WEEKLY:Monday" | "MONTHLY_DATE:15" | "MONTHLY_DAY:2:Tuesday" | "EVERY_N:10" | "YEARLY:MM-DD" | "QUARTERLY:MM-DD"
function recurLabel(r){
  if(!r||r==="None")return null;
  var p=r.split(":");
  if(p[0]==="WEEKLY")      return "Every "+p[1];
  if(p[0]==="MONTHLY_DATE")return "Every "+p[1]+(p[1]==="1"?"st":p[1]==="2"?"nd":p[1]==="3"?"rd":"th");
  if(p[0]==="MONTHLY_DAY") return "Every "+ORDINALS[parseInt(p[1])-1]+" "+p[2];
  if(p[0]==="EVERY_N")     return "Every "+p[1]+" days";
  if(p[0]==="YEARLY")       return "Every year on "+fmt(new Date().getFullYear()+"-"+p[1]);
  if(p[0]==="QUARTERLY")    return "Every quarter on "+fmt(new Date().getFullYear()+"-"+p[1]);
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
  if(p[0]==="YEARLY"){
    // p[1] = MM-DD
    var parts=p[1].split("-");
    dt.setFullYear(dt.getFullYear()+1);
    dt.setMonth(parseInt(parts[0])-1);
    dt.setDate(parseInt(parts[1]));
    return dt.toISOString().slice(0,10);
  }
  if(p[0]==="QUARTERLY"){
    // p[1] = MM-DD (the day within each quarter)
    var qparts=p[1].split("-");
    var qmonth=parseInt(qparts[0])-1; // 0-based target month within quarter
    dt.setMonth(dt.getMonth()+3);
    // Set to the same day-of-quarter pattern
    dt.setDate(parseInt(qparts[1]));
    return dt.toISOString().slice(0,10);
  }
  return null;
}


// ── Generate virtual occurrences of recurring tasks ────────────────────────
// Returns array of virtual task objects with _virtual:true and _baseId set
// Generates occurrences from startDate to endDate (strings YYYY-MM-DD)
function generateOccurrences(tasks, startStr, endStr){
  var result = [];
  var start = new Date(startStr+"T00:00:00");
  var end   = new Date(endStr+"T23:59:59");
  tasks.forEach(function(t){
    if(!t.recur || t.recur==="None" || !t.due) return;
    // Walk forward from due date generating occurrences within window
    var cur = t.due;
    var safety = 0;
    // First, walk backward if due date is after start (to catch patterns that started before window)
    // Actually just walk forward from due date
    // If due date is after end, skip
    if(new Date(cur+"T00:00:00") > end) return;
    while(safety < 200){
      safety++;
      var next = addInt(cur, t.recur);
      if(!next) break;
      var nd = new Date(next+"T00:00:00");
      if(nd > end) break;
      if(nd >= start){
        // Check this date isn't already a real task (same recur_id + due)
        var alreadyExists = tasks.some(function(r){
          return r.recur_id === t.id && r.due === next;
        });
        if(!alreadyExists){
          // If task has a deadline offset, compute the actual due date
        var actualDue=next;
        if(t.recur_deadline&&t.recur_deadline!=="None"){
          actualDue=addInt(next,t.recur_deadline)||next;
        }
        result.push(Object.assign({}, t, {
            id: t.id+"__"+next,
            due: actualDue,
            _startDate: next,
            status: "To Do",
            _virtual: true,
            _baseId: t.id,
            subtasks: t.subtasks ? t.subtasks.map(function(s){return Object.assign({},s,{done:false});}) : []
          }));
        }
      }
      cur = next;
    }
  });
  return result;
}

// Get date range for board view — only 30 days ahead for recurring tasks
function getBoardWindow(){
  var now = new Date();
  var start = now.toISOString().slice(0,10);
  var end = new Date(now.getTime() + 30*24*60*60*1000).toISOString().slice(0,10);
  return {start:start, end:end};
}

// ── RecurPicker component ──────────────────────────────────────────────────
function RecurPicker(props){
  var val=props.value||"None",onChange=props.onChange;
  var p=val==="None"?[]:val.split(":");
  var type=val==="None"?"None":p[0];

  var inp={padding:"7px 10px",borderRadius:7,border:"0.5px solid #DDD",background:WH,fontSize:13,color:BLK,width:"100%"};
  var typeBtns=["None","WEEKLY","MONTHLY_DATE","MONTHLY_DAY","EVERY_N","QUARTERLY","YEARLY"].map(function(t){
    var labels={None:"None",WEEKLY:"Every weekday",MONTHLY_DATE:"Day of month",MONTHLY_DAY:"Nth weekday",EVERY_N:"Every X days",QUARTERLY:"Quarterly",YEARLY:"Yearly"};
    var a=type===t;
    return ce("button",{key:t,onClick:function(){
      if(t==="None")onChange("None");
      else if(t==="WEEKLY")onChange("WEEKLY:Monday");
      else if(t==="MONTHLY_DATE")onChange("MONTHLY_DATE:1");
      else if(t==="MONTHLY_DAY")onChange("MONTHLY_DAY:1:Monday");
      else if(t==="EVERY_N")onChange("EVERY_N:7");
      else if(t==="QUARTERLY")onChange("QUARTERLY:01-01");
      else if(t==="YEARLY")onChange("YEARLY:01-01");
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

  if(type==="YEARLY"||type==="QUARTERLY"){
    var mmdd=(p[1]||"01-01").split("-");
    var months=[];for(var mi=1;mi<=12;mi++)months.push(mi);
    var days2=[];for(var di=1;di<=31;di++)days2.push(di);
    detail=ce("div",{style:{display:"flex",gap:8}},
      ce("div",{style:{flex:1}},
        ce("label",{style:{fontSize:11,color:"#888",display:"block",marginBottom:4}},type==="YEARLY"?"Month of year":"Month of quarter (1-3)"),
        ce("select",{value:mmdd[0]||"01",onChange:function(e){onChange(type+":"+e.target.value+"-"+(mmdd[1]||"01"));},style:inp},
          (type==="YEARLY"?months:[1,2,3]).map(function(n){return ce("option",{key:n,value:padZ(n)},type==="YEARLY"?MN[n-1]:"Month "+n);})
        )
      ),
      ce("div",{style:{flex:1}},
        ce("label",{style:{fontSize:11,color:"#888",display:"block",marginBottom:4}},"Day"),
        ce("select",{value:mmdd[1]||"01",onChange:function(e){onChange(type+":"+(mmdd[0]||"01")+"-"+e.target.value);},style:inp},
          days2.map(function(n){return ce("option",{key:n,value:padZ(n)},n+(n===1?"st":n===2?"nd":n===3?"rd":"th"));})
        )
      )
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
    recur_deadline:row.recur_deadline||"None",
    by:row.by_user, to:row.to_user, shared:!!row.shared,
    created_at:row.created_at||"",
    comments:row.comments||[]
  };
}
// displayDate: the date used for calendar/quarterly bucketing
// Use due date if set, otherwise fall back to created_at date
function displayDate(t){
  if(t._startDate) return t._startDate;
  if(t.due) return t.due;
  if(t.created_at) return t.created_at.slice(0,10);
  return null;
}
function taskToDb(t,byUser){
  return {
    title:t.title, ctx:t.ctx, pri:t.pri, due:t.due||null,
    status:t.status, notes:t.notes||"", subtasks:t.subtasks||[],
    recur:t.recur||"None", recur_deadline:t.recur_deadline||"None",
    private_notes:t.private_notes||"", notify_notes:t.notify_notes||"", comments:t.comments||[],
    by_user:byUser||t.by||t.by_user, to_user:t.to||t.to_user, shared:!!t.shared
  };
}

// ── ce helper ──────────────────────────────────────────────────────────────
function ce(t,p){
  var args=[t,p||null];
  for(var i=2;i<arguments.length;i++)args.push(arguments[i]);
  return React.createElement.apply(React,args);
}
function svg(paths,w,h,stroke,sw){
  var sp={viewBox:"0 0 16 16",fill:"none",stroke:stroke||"currentColor",strokeWidth:sw||"1.5",strokeLinecap:"round",strokeLinejoin:"round",width:w||16,height:h||16,display:"block"};
  return ce("svg",sp,paths.map(function(d,i){return ce("path",{key:i,d:d});}));
}
function svgR(rects,paths,w,h,stroke){
  var sp={viewBox:"0 0 16 16",fill:"none",stroke:stroke||"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",width:w||16,height:h||16,display:"block"};
  return ce("svg",sp,rects.map(function(r,i){return ce("rect",{key:"r"+i,x:r.x,y:r.y,width:r.w,height:r.h,rx:r.rx});}).concat(paths.map(function(d,i){return ce("path",{key:"p"+i,d:d});})));
}
function svgC(circs,paths,w,h,stroke){
  var sp={viewBox:"0 0 16 16",fill:"none",stroke:stroke||"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",width:w||16,height:h||16,display:"block"};
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
var PINS={Jhonatan:"2013",Sarah:"0222",Gin:"2021"};
var LOGO_WHITE="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI0LjMuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxMDgwIDIzMC4wOSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTA4MCAyMzAuMDk7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojRkZGRkZGO30KPC9zdHlsZT4KPGc+Cgk8Zz4KCQk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNjcxLjE5LDI0Ljc0djEwMy44NGMwLDYxLjAyLTI5LjI3LDg0LjU3LTkyLjc4LDg0LjU3cy05Mi43Ny0yMy41NC05Mi43Ny04NC41N1YyNC43NGg1Mi44MXY5MS43CgkJCWMwLDQwLjY4LDExLjc3LDUzLjg5LDM5Ljk2LDUzLjg5YzI4LjE5LDAsMzkuOTctMTMuMiwzOS45Ny01My44OXYtOTEuN0g2NzEuMTl6Ii8+CgkJPHBhdGggY2xhc3M9InN0MCIgZD0iTTI4OC41MiwyMDUuNzJWMTAxLjg5YzAtNjEuMDIsMjkuMjctODQuNTcsOTIuNzgtODQuNTdzOTIuNzcsMjMuNTQsOTIuNzcsODQuNTd2MTAzLjg0aC01Mi44MXYtOTEuNwoJCQljMC00MC42OC0xMS43Ny01My44OS0zOS45Ni01My44OXMtMzkuOTcsMTMuMi0zOS45Nyw1My44OXY5MS43SDI4OC41MnoiLz4KCQk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNzM5LjYsMjQuNzRsNTEuMDMsMTEyLjc2bDUxLjAzLTExMi43Nmg2Mi4wOGwtOTUuMjcsMTgyLjdoLTM1LjY5bC05NS4yNy0xODIuN0g3MzkuNnoiLz4KCQk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNOTgyLjU4LDE5LjAzYzU0Ljk2LDAsOTcuNDIsMzYuMDQsOTcuNDIsOTUuOTljMCwyLjUtMC4zNSw3Ljg1LTAuMzUsNy44NUg5MzcuOTgKCQkJYzAsMzIuODMsMjYuMDUsNDguMTcsNDkuMjQsNDguMTdjMjIuODQsMCwzNS4zMy02LjA3LDUwLjY3LTI0LjI3bDM4LjE5LDE5LjI3Yy0xOS45OCwzMy4xOS01Mi44MSw0Ny4xLTkyLjc4LDQ3LjEKCQkJYy01NC45NiwwLTk5LjkxLTQzLjUzLTk5LjkxLTk3LjQxQzg4My4zOCw2Mi4yMSw5MjcuOTksMTkuMDMsOTgyLjU4LDE5LjAzeiBNMTAyOC42Miw5My4yNWMtMi44Ni0yMC43LTIxLjA1LTM2LjA0LTQ0LjYxLTM2LjA0CgkJCWMtMjYuMDUsMC00My4xOCwxNy4xMi00NC42MSwzNi4wNEgxMDI4LjYyeiIvPgoJPC9nPgoJPGc+CgkJPHBhdGggY2xhc3M9InN0MCIgZD0iTTc2LjUxLDE1My41OFYwQzM0LjI2LDAsMCwzNC4yNiwwLDc2LjUxdjE1My41OGgxNTMuMDJDMTEwLjc3LDIzMC4wOSw3Ni41MSwxOTUuODQsNzYuNTEsMTUzLjU4eiIvPgoJCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik03Ni41MSwwYzQyLjI2LDAsNzYuNTEsMzQuMjYsNzYuNTEsNzYuNTF2MTUzLjU4YzQyLjI2LDAsNzYuNTEtMzQuMjYsNzYuNTEtNzYuNTFWMEg3Ni41MXoiLz4KCTwvZz4KPC9nPgo8L3N2Zz4K";
var LOGO_SVG="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI0LjMuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxMDgwIDIzMC4wOSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTA4MCAyMzAuMDk7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojOEZGOUJBO30KCS5zdDF7ZmlsbDojMDA5NjVFO30KCS5zdDJ7ZmlsbDojN0FDQzlCO30KCS5zdDN7ZmlsbDojMkFEODcwO30KPC9zdHlsZT4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNjcxLjE5LDI0Ljc0djEwMy44NGMwLDYxLjAyLTI5LjI3LDg0LjU3LTkyLjc4LDg0LjU3cy05Mi43Ny0yMy41NC05Mi43Ny04NC41N1YyNC43NGg1Mi44MXY5MS43CgkJCWMwLDQwLjY4LDExLjc3LDUzLjg5LDM5Ljk2LDUzLjg5YzI4LjE5LDAsMzkuOTctMTMuMiwzOS45Ny01My44OXYtOTEuN0g2NzEuMTl6Ii8+CgkJPHBhdGggZD0iTTI4OC41MiwyMDUuNzJWMTAxLjg5YzAtNjEuMDIsMjkuMjctODQuNTcsOTIuNzgtODQuNTdzOTIuNzcsMjMuNTQsOTIuNzcsODQuNTd2MTAzLjg0aC01Mi44MXYtOTEuNwoJCQljMC00MC42OC0xMS43Ny01My44OS0zOS45Ni01My44OXMtMzkuOTcsMTMuMi0zOS45Nyw1My44OXY5MS43SDI4OC41MnoiLz4KCQk8cGF0aCBkPSJNNzM5LjYsMjQuNzRsNTEuMDMsMTEyLjc2bDUxLjAzLTExMi43Nmg2Mi4wOGwtOTUuMjcsMTgyLjdoLTM1LjY5bC05NS4yNy0xODIuN0g3MzkuNnoiLz4KCQk8cGF0aCBkPSJNOTgyLjU4LDE5LjAzYzU0Ljk2LDAsOTcuNDIsMzYuMDQsOTcuNDIsOTUuOTljMCwyLjUtMC4zNSw3Ljg1LTAuMzUsNy44NUg5MzcuOThjMCwzMi44MywyNi4wNSw0OC4xNyw0OS4yNCw0OC4xNwoJCQljMjIuODQsMCwzNS4zMy02LjA3LDUwLjY3LTI0LjI3bDM4LjE5LDE5LjI3Yy0xOS45OCwzMy4xOS01Mi44MSw0Ny4xLTkyLjc4LDQ3LjFjLTU0Ljk2LDAtOTkuOTEtNDMuNTMtOTkuOTEtOTcuNDEKCQkJQzg4My4zOCw2Mi4yMSw5MjcuOTksMTkuMDMsOTgyLjU4LDE5LjAzeiBNMTAyOC42Miw5My4yNWMtMi44Ni0yMC43LTIxLjA1LTM2LjA0LTQ0LjYxLTM2LjA0Yy0yNi4wNSwwLTQzLjE4LDE3LjEyLTQ0LjYxLDM2LjA0CgkJCUgxMDI4LjYyeiIvPgoJPC9nPgoJPGc+CgkJPHBhdGggY2xhc3M9InN0MCIgZD0iTTc2LjUxLDE1My41OFYwQzM0LjI2LDAsMCwzNC4yNiwwLDc2LjUxdjE1My41OGgxNTMuMDJDMTEwLjc3LDIzMC4wOSw3Ni41MSwxOTUuODQsNzYuNTEsMTUzLjU4eiIvPgoJCTxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik03Ni41MSwwYzQyLjI2LDAsNzYuNTEsMzQuMjYsNzYuNTEsNzYuNTF2MTUzLjU4YzQyLjI2LDAsNzYuNTEtMzQuMjYsNzYuNTEtNzYuNTFWMEg3Ni41MXoiLz4KCQk8cGF0aCBjbGFzcz0ic3QyIiBkPSJNNzYuNTEsMEw3Ni41MSwwbDAsMTUzLjU4YzAsNDIuMjYsMzQuMjYsNzYuNTEsNzYuNTEsNzYuNTFoMFY3Ni41MUMxNTMuMDIsMzQuMjYsMTE4Ljc3LDAsNzYuNTEsMHoiLz4KCQk8cGF0aCBjbGFzcz0ic3QzIiBkPSJNNzYuNTEsMEw3Ni41MSwwbDAsMTUzLjU4YzAsNDIuMjYsMzQuMjYsNzYuNTEsNzYuNTEsNzYuNTFoMFY3Ni41MUMxNTMuMDIsMzQuMjYsMTE4Ljc3LDAsNzYuNTEsMHoiLz4KCTwvZz4KPC9nPgo8L3N2Zz4K";

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
    ce("img",{src:LOGO_WHITE,alt:"Nuve",style:{height:44,width:"auto",marginBottom:28}}),
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
  return ce("div",{style:{minHeight:"100vh",background:"linear-gradient(160deg,"+MD+" 0%,"+MB+" 60%,"+ML+" 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 16px",position:"relative"}},
    ce("img",{src:LOGO_WHITE,alt:"Nuve",style:{height:44,width:"auto",marginBottom:28}}),
    ce("div",{style:{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center"}},
      Object.keys(USERS).map(function(name){
        var u=USERS[name];
        return ce("button",{key:name,onClick:function(){setSelected(name);},style:{display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:"22px 26px",borderRadius:14,border:"none",background:"rgba(255,255,255,.95)",cursor:"pointer",minWidth:120}},
          ce("div",{style:{width:52,height:52,borderRadius:"50%",background:u.bg,border:"2.5px solid "+u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:u.color}},u.ini),
          ce("div",{style:{fontSize:14,fontWeight:600,color:BLK}},name)
        );
      })
    ),
    ce("div",{style:{position:"absolute",bottom:20,left:0,right:0,textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.55)",letterSpacing:".05em"}},"Nuve Task Manager v1.0")
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
  var can=!!(USERS[cu]&&USERS[cu].ctxs.indexOf(task.ctx)>=0&&!task._virtual);
  var isShared=!!(task.shared&&isPers(task.ctx));
  var moveCols=COLS.filter(function(c){return c!==task.status;});

  var pastDueBadge=over?ce("span",{style:{
    fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:4,
    background:"#DC2626",color:"#fff",letterSpacing:".05em",
    textTransform:"uppercase",flexShrink:0,display:"inline-flex",alignItems:"center",gap:3
  }},Ico("warn",10,"#fff")," PAST DUE"):null;
  var duePill=task.due?Tag(over?"#FEE2E2":"#F2F2F0",over?"#991B1B":"#666",over?"#FCA5A5":"#DDD",[Ico(over?"warn":"cal",11,over?"#991B1B":"#999"),ce("span",{key:"d",style:{marginLeft:2}},fmt(task.due))]):null;
  // Period label: for recurring show "for MM/DD/YY", for all show created date if no due date
  var periodLbl=null;
  if(rec&&task.due){
    periodLbl=Tag("#F0F9FF","#0369A1","#BAE6FD",[ce("span",{key:"p",style:{fontSize:10,fontWeight:600}},"for "+fmt(task.due))]);
  } else if(!task.due&&task.created_at){
    periodLbl=Tag("#F8FAFC","#64748B","#E2E8F0",[Ico("cal",10,"#94A3B8"),ce("span",{key:"c",style:{marginLeft:2,fontSize:10}},fmt(task.created_at.slice(0,10)))]);
  }
  var virtPill=task._virtual?Tag(RC.bg,RC.tx,RC.bd,[Ico("recur",10,RC.tx),ce("span",{key:"v",style:{marginLeft:2}},"upcoming")]):null;
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
      task.notify_notes&&task.to===cu?ce("div",{style:{display:"flex",gap:7,marginBottom:10,padding:"8px 10px",background:"#E0F2FB",borderRadius:7,border:"1px solid #7DD3F0"}},
        ce("div",{style:{fontSize:11,fontWeight:600,color:"#0F6E9A",flexShrink:0,marginTop:1}},"📌 Note for you:"),
        ce("span",{style:{fontSize:13,color:"#0C4A6E",lineHeight:1.5}},task.notify_notes)):null,
    task.notes?ce("div",{style:{display:"flex",gap:7,marginBottom:10,padding:"8px 10px",background:"#F2F2F0",borderRadius:7}},Ico("note",14,"#999"),ce("span",{style:{fontSize:13,color:"#555",lineHeight:1.5}},task.notes)):null,
    task.private_notes&&task.by===cu?ce("div",{style:{display:"flex",gap:7,marginBottom:10,padding:"8px 10px",background:"#FEF0FF",borderRadius:7,border:"1px solid #D8B4FE"}},
        ce("div",{style:{fontSize:11,fontWeight:600,color:"#6B21A8",flexShrink:0,marginTop:1}},"🔒 Private:"),
        ce("span",{style:{fontSize:13,color:"#4C1D95",lineHeight:1.5}},task.private_notes)):null,
      task.subtasks.length>0?ce("div",{style:{marginBottom:10}},
        ce("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}},
          ce("span",{style:{fontSize:11,color:"#aaa",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}},done+"/"+task.subtasks.length+" subtasks"),
          done<task.subtasks.length&&can?ce("button",{onClick:function(e){e.stopPropagation();var allDone=task.subtasks.map(function(s){return Object.assign({},s,{done:true});});sb.from("tasks").update({subtasks:allDone}).eq("id",task.id).then(function(){props.onMove&&props.onMove(task.id,task.status);});},style:{fontSize:10,padding:"2px 8px",borderRadius:6,border:"0.5px solid "+MB,background:"#E8FBF1",cursor:"pointer",color:MD,fontWeight:500}},"Complete all"):null
        ),
        subItems
      ):null,
      rec&&task.due?ce("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:10,padding:"6px 10px",background:RC.bg,borderRadius:7}},Ico("recur",13,RC.tx),ce("span",{style:{fontSize:12,color:RC.tx}},recLbl+" · Next: "+fmt(addInt(task.due,task.recur)))):null,
      ce("div",{style:{marginTop:8,borderTop:"0.5px solid #EEE",paddingTop:8}},
        ce("div",{style:{fontSize:11,fontWeight:600,color:"#aaa",marginBottom:6,textTransform:"uppercase",letterSpacing:".04em"}},"Activity"),
        (task.comments||[]).map(function(cm,i){
          return ce("div",{key:i,style:{display:"flex",gap:8,marginBottom:6}},
            Av(cm.by,18),
            ce("div",{style:{flex:1,background:"#F7F7F6",borderRadius:8,padding:"6px 10px"}},
              ce("div",{style:{fontSize:11,fontWeight:600,color:BLK,marginBottom:2}},cm.by," · ",cm.at?cm.at.slice(0,10):""),
              ce("div",{style:{fontSize:12,color:"#444",lineHeight:1.5}},cm.text)
            )
          );
        }),
        can?ce("div",{style:{display:"flex",gap:6,marginTop:4}},
          Av(cu,18),
          ce("input",{
            placeholder:"Add a comment...",
            onKeyDown:function(e){
              if(e.key==="Enter"&&e.target.value.trim()){
                var newComments=(task.comments||[]).concat([{by:cu,text:e.target.value.trim(),at:new Date().toISOString()}]);
                sb.from("tasks").update({comments:newComments}).eq("id",task.id);
                e.target.value="";
              }
            },
            style:{flex:1,padding:"5px 10px",borderRadius:8,border:"0.5px solid #DDD",fontSize:12,outline:"none",fontFamily:"inherit"}
          })
        ):null
      ),
      ce("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8,flexWrap:"wrap",gap:8}},
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
        pastDueBadge,Tag(cc.bg,cc.tx,cc.bd,lbl),duePill,periodLbl,recPill,virtPill,shPill,subPill,
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
  var uctxs=USERS[cu]?USERS[cu].ctxs:(USERS["Jhonatan"].ctxs);
  var defCtx=uctxs[0]||NI[0];
  var blank={title:"",ctx:defCtx,pri:"Medium",due:"",notes:"",private_notes:"",notify_notes:"",subtasks:[],recur:"None",recur_deadline:"None",comments:[],by:cu,to:cu,shared:false,status:"To Do"};
  var initF=task?Object.assign({},task,{subtasks:task.subtasks.map(function(s){return Object.assign({},s);})}):blank;
  var [f,setF]=useState(initF);
  var [stxt,setStxt]=useState("");
  function set(k,v){setF(function(p){return Object.assign({},p,{[k]:v});});}
  function addSub(){if(!stxt.trim())return;set("subtasks",f.subtasks.concat([{text:stxt.trim(),done:false}]));setStxt("");}

  var inp={width:"100%",padding:"8px 10px",borderRadius:7,border:"0.5px solid #DDD",background:WH,fontSize:14,color:BLK,boxSizing:"border-box"};
  var lb={fontSize:12,color:"#666",display:"block",marginBottom:4,fontWeight:500};
  var nodes=TREE.filter(function(n){return n.subs.some(function(c){return uctxs.indexOf(c.id)>=0;});});
  var assignable=Object.keys(USERS).filter(function(u){
    if(u==="Gin"&&!USERS[cu].canGin&&cu!=="Gin")return false;
    if(u==="Sarah"&&!USERS[cu].canSarah&&cu!=="Sarah")return false;
    if(u===cu)return true;
    if(u==="Sarah"&&USERS[cu].canSarah)return true;
    if(u==="Gin"&&USERS[cu].canGin)return true;
    if(u==="Jhonatan"&&USERS[cu].canAssignJPersonal)return true;
    return USERS[u].ctxs.indexOf(f.ctx)>=0;
  });
  // When Gin assigns to Jhonatan, extend available contexts to include personal
  var ginAssignPersonal=cu==="Gin"&&f.to==="Jhonatan";
  var visibleCtxNodes=TREE.filter(function(n){
    if(ginAssignPersonal)return n.subs.some(function(c){return uctxs.concat(PI).indexOf(c.id)>=0;});
    return n.subs.some(function(c){return uctxs.indexOf(c.id)>=0;});
  });
  var isPersonal=isPers(f.ctx);

  var catNodes=visibleCtxNodes.map(function(node){
    var leaves=node.subs.filter(function(c){return (ginAssignPersonal?uctxs.concat(PI):uctxs).indexOf(c.id)>=0;});
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
      props.templates&&props.templates.length>0?ce("div",{style:{marginBottom:12}},
        ce("div",{style:{fontSize:11,color:"#aaa",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em",marginBottom:5}},"Load Template"),
        ce("div",{style:{display:"flex",gap:5,flexWrap:"wrap"}},
          (props.templates||[]).map(function(tpl,i){
            return ce("div",{key:i,style:{display:"flex",alignItems:"center",gap:0,background:"#F0FDF4",borderRadius:6,border:"0.5px solid #86EFAC",overflow:"hidden"}},
              ce("button",{onClick:function(){set("ctx",tpl.ctx);set("pri",tpl.pri);set("recur",tpl.recur);set("recur_deadline",tpl.recur_deadline);set("subtasks",tpl.subtasks||[]);set("notes",tpl.notes||"");},style:{padding:"3px 8px",fontSize:11,background:"none",border:"none",cursor:"pointer",color:MD,fontWeight:500}},tpl.name),
              ce("button",{onClick:function(){props.onDeleteTemplate&&props.onDeleteTemplate(i);},style:{padding:"3px 5px",background:"none",border:"none",cursor:"pointer",color:"#aaa",display:"flex"}},Ico("x",10))
            );
          })
        )
      ):null,
      ce("label",{style:lb},"Category"),
      ce("div",{style:{marginBottom:14,display:"flex",flexDirection:"column",gap:10}},catNodes),
      ce("label",{style:lb},"Priority"),
      ce("div",{style:{display:"flex",gap:6,marginBottom:14}},PK.map(function(p){var pc=PRI[p],a=f.pri===p;return ce("button",{key:p,onClick:function(){set("pri",p);},style:{flex:1,padding:"7px 0",borderRadius:7,border:a?"1.5px solid "+pc.bd:"0.5px solid #DDD",background:a?pc.bg:"#F7F7F6",cursor:"pointer"}},ce("span",{style:{fontSize:12,fontWeight:700,color:a?pc.tx:"#aaa"}},pc.lbl));})),
      ce("div",{style:{marginBottom:14}},
        ce("div",null,ce("label",{style:lb},"Due date"),ce("input",{type:"date",style:inp,value:f.due,onChange:function(e){set("due",e.target.value);}}))
      ),
      ce("label",{style:lb},"Repeats"),
      ce("div",{style:{marginBottom:f.recur!=="None"?8:14}},ce(RecurPicker,{value:f.recur,onChange:function(v){set("recur",v);if(v==="None")set("recur_deadline","None");}})),
      f.recur!=="None"?ce("div",{style:{marginBottom:14}},
        ce("label",{style:{fontSize:12,color:"#666",display:"block",marginBottom:4,fontWeight:500}},"Deadline (days after repeat starts)"),
        ce("div",{style:{background:"#F7F7F6",borderRadius:8,padding:"10px 12px",border:"0.5px solid #EEE"}},
          ce("div",{style:{fontSize:11,color:"#888",marginBottom:6}},"When is the task due relative to when it repeats? e.g. repeats Monday, due by Wednesday"),
          ce(RecurPicker,{value:f.recur_deadline||"None",onChange:function(v){set("recur_deadline",v);}})
        ),
        f.due&&f.recur_deadline&&f.recur_deadline!=="None"?ce("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:RC.bg,borderRadius:7,marginTop:8}},Ico("recur",13,RC.tx),ce("span",{style:{fontSize:12,color:RC.tx}},"Next: "+fmt(addInt(f.due,f.recur))+" · Due: "+fmt(addInt(addInt(f.due,f.recur),f.recur_deadline)))):null
      ):null,
      f.recur!=="None"&&f.due&&(!f.recur_deadline||f.recur_deadline==="None")?ce("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:RC.bg,borderRadius:7,marginBottom:14}},Ico("recur",13,RC.tx),ce("span",{style:{fontSize:12,color:RC.tx}},"Next: "+fmt(addInt(f.due,f.recur)))):null,
      ce("label",{style:lb},"Assign to"),
      assignSection,
      ce("div",{style:{marginBottom:14}},
        ce("label",{style:lb},"Shared Notes"),
        ce("textarea",{style:Object.assign({},inp,{minHeight:52,resize:"vertical"}),value:f.notes,onChange:function(e){set("notes",e.target.value);},placeholder:"Notes visible to all users on this task..."})
      ),
      ce("div",{style:{marginBottom:14}},
        ce("div",{style:{display:"flex",alignItems:"center",gap:5,marginBottom:4}},
          ce("label",{style:Object.assign({},lb,{margin:0})},"Private Notes"),
          ce("span",{style:{fontSize:10,color:"#6B21A8",background:"#FEF0FF",borderRadius:4,padding:"1px 6px",fontWeight:500}},"Only you see this")
        ),
        ce("textarea",{style:Object.assign({},inp,{minHeight:44,resize:"vertical",borderColor:"#D8B4FE"}),value:f.private_notes||"",onChange:function(e){set("private_notes",e.target.value);},placeholder:"Personal notes only visible to you..."})
      ),
      f.to!==cu?ce("div",{style:{marginBottom:14}},
        ce("div",{style:{display:"flex",alignItems:"center",gap:5,marginBottom:4}},
          ce("label",{style:Object.assign({},lb,{margin:0})},"Note for "+f.to),
          ce("span",{style:{fontSize:10,color:"#0F6E9A",background:"#E0F2FB",borderRadius:4,padding:"1px 6px",fontWeight:500}},"Pops up for them")
        ),
        ce("textarea",{style:Object.assign({},inp,{minHeight:44,resize:"vertical",borderColor:"#7DD3F0"}),value:f.notify_notes||"",onChange:function(e){set("notify_notes",e.target.value);},placeholder:("Message that will appear when "+f.to+" opens this task...")})
      ):null,
      ce("label",{style:lb},"Subtasks"),
      ce("div",{style:{marginBottom:8}},f.subtasks.map(function(s,i){
        return ce("div",{key:i,style:{display:"flex",alignItems:"center",gap:6,padding:"5px 6px",borderRadius:7,border:"0.5px solid #E8E8E6",background:"#FAFAF9",marginBottom:4}},
          // Checkbox
          ce("div",{onClick:function(){set("subtasks",f.subtasks.map(function(x,j){return j===i?Object.assign({},x,{done:!x.done}):x;}));},style:{width:16,height:16,borderRadius:4,border:"1.5px solid "+(s.done?MB:"#DDD"),background:s.done?MB:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}},s.done?Ico("check",10,"#fff"):null),
          // Editable text
          ce("input",{
            value:s.text,
            onChange:function(e){
              var val=e.target.value;
              set("subtasks",f.subtasks.map(function(x,j){return j===i?Object.assign({},x,{text:val}):x;}));
            },
            style:{flex:1,fontSize:13,background:"none",border:"none",outline:"none",color:s.done?"#aaa":BLK,textDecoration:s.done?"line-through":"none",fontFamily:"inherit",padding:"1px 0",minWidth:0}
          }),
          // Move up
          ce("button",{
            onClick:function(){
              if(i===0)return;
              var a=f.subtasks.slice();
              var tmp=a[i-1];a[i-1]=a[i];a[i]=tmp;
              set("subtasks",a);
            },
            disabled:i===0,
            style:{background:"none",border:"none",cursor:i===0?"default":"pointer",color:i===0?"#DDD":"#aaa",display:"flex",padding:"2px",flexShrink:0,borderRadius:4}
          },svg(["M8 12V4","M4 8l4-4 4 4"],12,12,i===0?"#DDD":"#aaa")),
          // Move down
          ce("button",{
            onClick:function(){
              if(i===f.subtasks.length-1)return;
              var a=f.subtasks.slice();
              var tmp=a[i+1];a[i+1]=a[i];a[i]=tmp;
              set("subtasks",a);
            },
            disabled:i===f.subtasks.length-1,
            style:{background:"none",border:"none",cursor:i===f.subtasks.length-1?"default":"pointer",color:i===f.subtasks.length-1?"#DDD":"#aaa",display:"flex",padding:"2px",flexShrink:0,borderRadius:4}
          },svg(["M8 4v8","M4 8l4 4 4-4"],12,12,i===f.subtasks.length-1?"#DDD":"#aaa")),
          // Delete
          ce("button",{onClick:function(){set("subtasks",f.subtasks.filter(function(_,j){return j!==i;}));},style:{background:"none",border:"none",cursor:"pointer",color:"#ccc",display:"flex",padding:"2px",flexShrink:0,borderRadius:4}},Ico("x",12))
        );
      })),
      ce("div",{style:{display:"flex",gap:6,marginBottom:20}},
        ce("input",{style:Object.assign({},inp,{flex:1}),value:stxt,onChange:function(e){setStxt(e.target.value);},onKeyDown:function(e){if(e.key==="Enter")addSub();},placeholder:"Add subtask..."}),
        ce("button",{onClick:addSub,style:{padding:"8px 10px",borderRadius:7,border:"0.5px solid "+MB,background:"#E8FBF1",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:4,color:MD}},Ico("plus",13,MD)," Add")
      ),
      ce("div",{style:{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"0.5px solid #EEE",paddingTop:16}},
        task?ce("button",{onClick:function(){props.onSave({_delete:true});},style:{marginRight:"auto",padding:"8px 14px",borderRadius:8,border:"1px solid #FECACA",background:"none",color:"#DC2626",fontSize:13,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:5}},Ico("trash",13,"#DC2626")," Delete"):null,
        !task?ce("button",{onClick:function(){props.onSaveTemplate&&props.onSaveTemplate(f);},style:{padding:"8px 12px",borderRadius:8,border:"0.5px solid #86EFAC",background:"#F0FDF4",color:MD,fontSize:12,cursor:"pointer"}},Ico("layers",12,MD)," Save template"):null,
        ce("button",{onClick:props.onClose,style:{padding:"8px 16px",borderRadius:8,border:"0.5px solid #DDD",background:"none",cursor:"pointer",fontSize:14,color:"#666"}},"Cancel"),
        ce("button",{onClick:function(){if(f.title.trim())props.onSave(f);},style:{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:8,border:"none",background:MB,cursor:"pointer",fontSize:14,fontWeight:600,color:BLK}},Ico("check",14,BLK)," Save")
      )
    )
  );
}

// ── RecurModal (complete confirmation) ─────────────────────────────────────
function RecurModal(props){
  var task=props.task;
  var next=task.due?addInt(task.due,task.recur):null;
  return ce("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200},onClick:props.onClose},
    ce("div",{style:{background:WH,borderRadius:14,padding:"22px 24px",width:"min(90vw,380px)"},onClick:function(e){e.stopPropagation();}},
      ce("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:14}},
        ce("div",{style:{width:36,height:36,borderRadius:9,background:RC.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},Ico("recur",18,RC.tx)),
        ce("h2",{style:{margin:0,fontSize:16,fontWeight:500,color:BLK}},"Recurring task completed")
      ),
      ce("p",{style:{fontSize:13,color:"#666",margin:"0 0 8px"}},ce("span",{style:{fontWeight:500,color:BLK}},task.title)," repeats ",recurLabel(task.recur)||task.recur,"."),
      next?ce("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:RC.bg,borderRadius:7,marginBottom:16}},Ico("cal",13,RC.tx),ce("span",{style:{fontSize:12,color:RC.tx}},"Next due: "+fmt(next))):null,
      ce("div",{style:{display:"flex",flexDirection:"column",gap:8}},
        ce("button",{onClick:props.onSpawn,style:{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:9,border:"none",background:MB,cursor:"pointer",fontSize:14,fontWeight:600,color:BLK}},Ico("recur",15,BLK)," Mark done & schedule next"),
        ce("button",{onClick:props.onArchive,style:{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:9,border:"0.5px solid #DDD",background:"#F2F2F0",cursor:"pointer",fontSize:14,color:BLK}},Ico("check",15)," Mark done only (stop repeating)"),
        ce("button",{onClick:props.onClose,style:{padding:"10px 14px",borderRadius:9,border:"none",background:"none",cursor:"pointer",fontSize:14,color:"#999"}},"Cancel")
      )
    )
  );
}

// ── DeleteRecurModal ────────────────────────────────────────────────────────
function DeleteRecurModal(props){
  var task=props.task;
  var [sel,setSel]=useState("one");
  var [confirm,setConfirm]=useState(false);

  function doDelete(){
    if(sel==="one"){
      props.onDeleteOne();
    } else {
      if(!confirm){setConfirm(true);return;}
      props.onDeleteAll();
    }
  }

  return ce("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300},onClick:props.onClose},
    ce("div",{style:{background:WH,borderRadius:14,padding:"24px",width:"min(92vw,420px)"},onClick:function(e){e.stopPropagation();}},
      ce("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:16}},
        ce("div",{style:{width:36,height:36,borderRadius:9,background:"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},Ico("trash",18,"#DC2626")),
        ce("h2",{style:{margin:0,fontSize:16,fontWeight:600,color:BLK}},"Delete recurring task")
      ),
      ce("p",{style:{fontSize:13,color:"#555",marginBottom:16,lineHeight:1.5}},
        ce("strong",null,task.title)," is a recurring task (",recurLabel(task.recur),"). What would you like to delete?"
      ),
      // Options
      ce("div",{style:{display:"flex",flexDirection:"column",gap:8,marginBottom:20}},
        ce("label",{style:{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",borderRadius:10,border:sel==="one"?"2px solid "+MB:"1px solid #DDD",background:sel==="one"?"#E8FBF1":WH,cursor:"pointer"}},
          ce("input",{type:"radio",name:"del_scope",value:"one",checked:sel==="one",onChange:function(){setSel("one");setConfirm(false);},style:{marginTop:2,accentColor:MD}}),
          ce("div",null,
            ce("div",{style:{fontSize:13,fontWeight:600,color:BLK}},"Delete this instance only"),
            ce("div",{style:{fontSize:12,color:"#888",marginTop:2}},"Future occurrences will continue as scheduled")
          )
        ),
        ce("label",{style:{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",borderRadius:10,border:sel==="all"?"2px solid #EF4444":"1px solid #DDD",background:sel==="all"?"#FEF2F2":WH,cursor:"pointer"}},
          ce("input",{type:"radio",name:"del_scope",value:"all",checked:sel==="all",onChange:function(){setSel("all");setConfirm(false);},style:{marginTop:2,accentColor:"#EF4444"}}),
          ce("div",null,
            ce("div",{style:{fontSize:13,fontWeight:600,color:"#DC2626"}},"Delete all repeating tasks"),
            ce("div",{style:{fontSize:12,color:"#888",marginTop:2}},"Removes this and all future occurrences permanently")
          )
        )
      ),
      confirm&&sel==="all"?ce("div",{style:{padding:"10px 14px",borderRadius:8,background:"#FEF2F2",border:"1px solid #FECACA",marginBottom:16,fontSize:13,color:"#DC2626",fontWeight:500}},
        "⚠️ Are you sure? This cannot be undone."
      ):null,
      ce("div",{style:{display:"flex",gap:10,justifyContent:"flex-end"}},
        ce("button",{onClick:props.onClose,style:{padding:"9px 16px",borderRadius:8,border:"1px solid #DDD",background:WH,color:"#666",fontSize:14,cursor:"pointer"}},"Cancel"),
        ce("button",{onClick:doDelete,style:{padding:"9px 18px",borderRadius:8,border:"none",background:sel==="all"?"#DC2626":MB,color:sel==="all"?WH:BLK,fontSize:14,fontWeight:600,cursor:"pointer"}},
          confirm&&sel==="all"?"Yes, delete all":sel==="all"?"Delete all":"Delete this one"
        )
      )
    )
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar(props){
  var cu=props.cu,sel=props.sel,tasks=props.tasks,af=props.af,setAf=props.setAf;
  var uctxs=USERS[cu]?USERS[cu].ctxs:AI.filter(function(x){return PI.indexOf(x)<0;});
  var [exp,setExp]=useState({N:false,K:false,P:true});
  function cnt(arr){return tasks.filter(function(t){return arr.indexOf(t.ctx)>=0&&t.status!=="Done";}).length;}
  function togExp(id){setExp(function(e){return Object.assign({},e,{[id]:!e[id]});});}
  var nodes=TREE.filter(function(n){return n.subs.some(function(c){return uctxs.indexOf(c.id)>=0;});});
  var allCnt=cnt(uctxs);

  var allBtn=ce("button",{onClick:function(){props.onSel("All");},style:{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,border:sel==="All"?"1.5px solid "+MB:"0.5px solid transparent",background:sel==="All"?"#E8FBF1":"transparent",cursor:"pointer",width:"100%",textAlign:"left"}},
    Ico("layers",14,sel==="All"?MD:"#999"),
    ce("span",{style:{fontSize:13,fontWeight:sel==="All"?600:400,color:sel==="All"?MD:"#555",flex:1}},"All tasks"),
    allCnt>0?ce("span",{style:{fontSize:11,color:sel==="All"?MD:"#aaa",background:sel==="All"?ML+"66":"#EBEBEA",borderRadius:20,padding:"0 6px"}},allCnt):null
  );

  var nodeEls=nodes.map(function(node){
    var leaves=node.subs.filter(function(c){return uctxs.indexOf(c.id)>=0;});
    var leafIds=leaves.map(function(c){return c.id;});
    var pSel=sel===node.id;
    var ps=PC[node.id]||{ac:"#888",bg:"#F5F5F5",tx:"#333"};
    var isExp=!!exp[node.id];
    var pCnt=cnt(leafIds);
    var leafEls=isExp?leaves.map(function(c){
      var cSel=sel===c.id,cc=CTC[c.id]||{bg:"#F2F2F0",tx:"#555",bd:"#DDD"},cCnt=cnt([c.id]);
      return ce("button",{key:c.id,onClick:function(){props.onSel(cSel?node.id:c.id);},style:{display:"flex",alignItems:"center",gap:7,padding:"10px 10px",borderRadius:7,border:cSel?"1.5px solid "+cc.bd:"0.5px solid transparent",background:cSel?cc.bg:"transparent",cursor:"pointer",width:"100%",textAlign:"left"}},
        ce("span",{style:{width:6,height:6,borderRadius:"50%",background:cc.bd,flexShrink:0}}),
        ce("span",{style:{fontSize:12,fontWeight:cSel?600:400,color:cSel?cc.tx:"#666",flex:1}},c.label),
        cCnt>0?ce("span",{style:{fontSize:10,color:cSel?cc.tx:"#bbb",background:cSel?cc.bg:"#EBEBEA",borderRadius:20,padding:"0 5px"}},cCnt):null
      );
    }):[];
    return ce("div",{key:node.id},
      ce("button",{onClick:function(){togExp(node.id);props.onSel(node.id);},style:{display:"flex",alignItems:"center",gap:8,padding:"11px 10px",borderRadius:8,border:pSel?"1.5px solid "+ps.ac:"0.5px solid transparent",background:pSel?ps.bg:"transparent",cursor:"pointer",width:"100%",textAlign:"left"}},
        ce("span",{style:{width:8,height:8,borderRadius:2,background:ps.ac,flexShrink:0}}),
        ce("span",{style:{fontSize:13,fontWeight:pSel?600:500,color:pSel?ps.tx:"#333",flex:1}},node.label),
        pCnt>0?ce("span",{style:{fontSize:11,color:pSel?ps.tx:"#aaa",background:pSel?ps.ac+"33":"#EBEBEA",borderRadius:20,padding:"0 6px"}},pCnt):null,
        Ico(isExp?"chevu":"chev",12,"#bbb")
      ),
      isExp?ce("div",{style:{marginLeft:18,marginTop:2,display:"flex",flexDirection:"column",gap:1}},leafEls):null
    );
  });

  return ce("div",{style:{width:190,flexShrink:0,display:"flex",flexDirection:"column",gap:2}},
    ce("div",{style:{paddingTop:8}}),
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
  var cu=props.cu,tasks=props.tasks,onTaskClick=props.onTaskClick||function(){};
  var now=new Date();
  var [yr,setYr]=useState(now.getFullYear());
  var [mon,setMon]=useState(now.getMonth());
  var monStr=yr+"-"+padZ(mon+1);
  var todayStr=now.getFullYear()+"-"+padZ(now.getMonth()+1)+"-"+padZ(now.getDate());
  var firstDay=new Date(yr,mon,1).getDay();
  var daysInMonth=new Date(yr,mon+1,0).getDate();
  var myTasks=tasks.filter(function(t){
    var d=displayDate(t);
    return d&&t.status!=="Done"&&(t.to===cu||t._virtual||(t.shared&&isPers(t.ctx)));
  });
  var taskCount=myTasks.filter(function(t){var d=displayDate(t);return d&&d.slice(0,7)===monStr;}).length;
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
      var dayTasks=myTasks.filter(function(t){var d=displayDate(t);return d===ds;});
      var isToday=ds===todayStr;
      var isOver=new Date(ds)<now&&!isToday;
      var todayD=new Date().toISOString().slice(0,10);
      var pills=dayTasks.slice(0,3).map(function(t,ti){
        var cc=CTC[t.ctx]||{bg:"#F2F2F0",tx:"#555"};
        var isPastDue=t.due&&t.due<todayD&&t.status!=="Done";
        return ce("div",{key:ti,onClick:function(e){e.stopPropagation();if(!t._virtual)onTaskClick(t);},style:{fontSize:10,padding:"2px 5px",borderRadius:4,background:isPastDue?"#DC2626":cc.bg,color:isPastDue?"#fff":cc.tx,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500,cursor:t._virtual?"default":"pointer"}},
          (isPastDue?"⚠ ":"")+ctxLbl(t.ctx)+": "+t.title
        );
      });
      if(dayTasks.length>3){pills.push(ce("div",{key:"more",style:{fontSize:10,color:"#999",marginTop:2}},"+"+(dayTasks.length-3)+" more"));}
      return ce("div",{key:day,style:{minHeight:window.innerWidth<700?52:72,background:isToday?"#E8FBF1":WH,borderRadius:8,border:isToday?"1.5px solid "+MB:"0.5px solid #E2E2E0",padding:window.innerWidth<700?"3px 4px":"5px 7px"}},
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

// ── RecurringView ──────────────────────────────────────────────────────────
function RecurringView(props){
  var tasks=props.tasks,cu=props.cu;
  var recurTasks=tasks.filter(function(t){return t.recur&&t.recur!=="None"&&!t._virtual;});
  var [editT,setEditT]=useState(null);

  function handleSave(form){
    if(!editT)return;
    if(form._delete){
      sb.from("tasks").delete().eq("id",editT.id).then(function(){props.onReload();setEditT(null);});
    } else {
      var data=taskToDb(form,cu);
      sb.from("tasks").update(data).eq("id",editT.id).then(function(){props.onReload();setEditT(null);});
    }
  }

  if(recurTasks.length===0){
    return ce("div",{style:{background:WH,borderRadius:12,padding:32,textAlign:"center",color:"#aaa",border:"0.5px solid #E2E2E0"}},"No recurring tasks found.");
  }

  var rows=recurTasks.map(function(t){
    var cc=CTC[t.ctx]||{bg:"#F2F2F0",tx:"#555",bd:"#DDD"};
    var pc=PC[t.ctx.split(":")[0]]||{ac:"#888",bg:"#F5F5F5",tx:"#333"};
    var parentLabel=ctxParent(t.ctx);
    var lbl=recurLabel(t.recur);
    var next=t.due?addInt(t.due,t.recur):null;
    return ce("div",{key:t.id,style:{background:WH,border:"0.5px solid #E2E2E0",borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:10,flexWrap:"wrap"}},
      // Parent category circle bubble
      ce("div",{style:{width:36,height:36,borderRadius:"50%",background:pc.bg,border:"1.5px solid "+pc.ac+"55",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},
        ce("span",{style:{fontSize:9,fontWeight:700,color:pc.tx,textAlign:"center",lineHeight:1.1}},parentLabel.slice(0,4).toUpperCase())
      ),
      ce("div",{style:{flex:1,minWidth:180}},
        ce("div",{style:{fontSize:13,fontWeight:600,color:BLK,marginBottom:4}},t.title),
        ce("div",{style:{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}},
          ce("span",{style:{fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:4,background:cc.bg,color:cc.tx}},ctxLbl(t.ctx)),
          ce("span",{style:{fontSize:11,padding:"1px 7px",borderRadius:4,background:RC.bg,color:RC.tx,display:"flex",alignItems:"center",gap:3}},Ico("recur",10,RC.tx),lbl)
        )
      ),
      ce("div",{style:{fontSize:12,color:"#888",minWidth:100}},
        t.due?ce("div",null,ce("div",{style:{fontSize:10,color:"#aaa",marginBottom:1}},"Current due"),ce("div",{style:{fontWeight:500,color:BLK}},fmt(t.due))):ce("div",{style:{color:"#ccc"}},"No due date")
      ),
      ce("div",{style:{fontSize:12,color:"#888",minWidth:100}},
        next?ce("div",null,ce("div",{style:{fontSize:10,color:"#aaa",marginBottom:1}},"Next occurrence"),ce("div",{style:{fontWeight:500,color:MD}},fmt(next))):null
      ),
      ce("div",null,Av(t.to,20)),
      ce("button",{onClick:function(){setEditT(t);},style:{background:"none",border:"0.5px solid #DDD",borderRadius:7,padding:"5px 10px",fontSize:12,cursor:"pointer",color:"#555",display:"flex",alignItems:"center",gap:4}},Ico("edit",12)," Edit")
    );
  });

  return ce("div",{style:{flex:1,minWidth:0}},
    ce("div",{style:{marginBottom:12,display:"flex",alignItems:"center",gap:8}},
      ce("span",{style:{fontSize:14,fontWeight:600,color:BLK}},"Recurring Tasks"),
      ce("span",{style:{fontSize:12,color:"#aaa"}},"·"),
      ce("span",{style:{fontSize:12,color:"#888"}},recurTasks.length+" recurring")
    ),
    ce("div",{style:{background:WH,borderRadius:12,padding:"14px 16px",border:"0.5px solid #E2E2E0"}},rows),
    editT?ce(TaskModal,{task:editT,cu:cu,onSave:handleSave,onClose:function(){setEditT(null);}}):null
  );
}

// ── QuarterlyView ──────────────────────────────────────────────────────────
function QuarterlyView(props){
  var tasks=props.tasks,cu=props.cu;
  var now=new Date();
  var [yr,setYr]=useState(now.getFullYear());

  // Generate all occurrences of recurring tasks within the year
  function expandRecurring(tasks,year){
    var expanded=[];
    tasks.forEach(function(t){
      var baseDate=t.due||(t.created_at?t.created_at.slice(0,10):"");
      if(!baseDate)return;
      // Include base task if it falls in this year (by displayDate)
      var dd=displayDate(t)||(t.created_at?t.created_at.slice(0,10):"");
      if(dd&&dd.slice(0,4)===String(year)){
        expanded.push(Object.assign({},t,{_expanded:false}));
      } else if((!t.recur||t.recur==="None")){
        // Non-recurring tasks only show in their own year
        if(dd&&dd.slice(0,4)===String(year)) expanded.push(Object.assign({},t,{_expanded:false}));
        return;
      }
      // Expand recurring tasks
      if(t.recur&&t.recur!=="None"&&baseDate){
        var cur=baseDate;
        var safety=0;
        while(safety<60){
          safety++;
          var next=addInt(cur,t.recur);
          if(!next)break;
          if(next.slice(0,4)>String(year))break;
          if(next.slice(0,4)===String(year)&&next!==baseDate){
            var qDue=t.recur_deadline&&t.recur_deadline!=="None"?addInt(next,t.recur_deadline)||next:next;
            expanded.push(Object.assign({},t,{id:t.id+"_"+next,due:qDue,_startDate:next,_expanded:true,_baseId:t.id}));
          }
          cur=next;
        }
        // Project forward from dates before this year
        if(baseDate.slice(0,4)<String(year)){
          var cur2=baseDate;
          var safety2=0;
          while(safety2<100){
            safety2++;
            var next2=addInt(cur2,t.recur);
            if(!next2)break;
            if(next2.slice(0,4)>String(year))break;
            if(next2.slice(0,4)===String(year)){
              var qDue2=t.recur_deadline&&t.recur_deadline!=="None"?addInt(next2,t.recur_deadline)||next2:next2;
              expanded.push(Object.assign({},t,{id:t.id+"_"+next2,due:qDue2,_startDate:next2,_expanded:true,_baseId:t.id}));
            }
            cur2=next2;
          }
        }
      }
    });
    // Deduplicate by id
    var seen={};
    return expanded.filter(function(t){
      if(seen[t.id])return false;
      seen[t.id]=true;
      return true;
    });
  }

  var nowYr=new Date().getFullYear();
  // For current year, also expand next year to cover 18-month window
  var allExpanded=expandRecurring(tasks,yr).concat(
    yr===nowYr?expandRecurring(tasks,yr+1):[]
  );
  // If viewing current year, limit to 18 months from today
  var cutoff18=yr===nowYr?(function(){var d=new Date();d.setMonth(d.getMonth()+18);return d.toISOString().slice(0,10);}()):null;

  var quarters=[
    {label:"Q1",months:[0,1,2],color:"#EFF6FF",ac:"#2563EB"},
    {label:"Q2",months:[3,4,5],color:"#F0FDF4",ac:"#16A34A"},
    {label:"Q3",months:[6,7,8],color:"#FFFBEB",ac:"#D97706"},
    {label:"Q4",months:[9,10,11],color:"#FEF2F2",ac:"#DC2626"},
  ];

  var qEls=quarters.map(function(q){
    var qTasks=allExpanded.filter(function(t){
      var d=displayDate(t);
      if(!d)return false;
      if(cutoff18&&d>cutoff18)return false;
      var m=parseInt(d.slice(5,7))-1;
      var y=parseInt(d.slice(0,4));
      return y===yr&&q.months.indexOf(m)>=0;
    }).sort(function(a,b){
      var da=displayDate(a)||"9999";
      var db2=displayDate(b)||"9999";
      return da>db2?1:-1;
    });

    var taskEls=qTasks.length===0
      ?ce("div",{style:{padding:"10px 0",color:"#ccc",fontSize:12,textAlign:"center"}},"No tasks")
      :qTasks.map(function(t){
        var cc=CTC[t.ctx]||{bg:"#F2F2F0",tx:"#555",bd:"#DDD"};
        return ce("div",{key:t.id,style:{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,border:"0.5px solid #E8E8E6",background:t._expanded?"#FAFAF9":WH,marginBottom:4}},
          ce("div",{style:{width:8,height:8,borderRadius:"50%",background:cc.bd,flexShrink:0}}),
          ce("div",{style:{flex:1,fontSize:12,fontWeight:500,color:t.status==="Done"?"#aaa":BLK,textDecoration:t.status==="Done"?"line-through":"none"}},t.title),
          ce("span",{style:{fontSize:10,padding:"1px 6px",borderRadius:4,background:cc.bg,color:cc.tx}},ctxLbl(t.ctx)),
          ce("span",{style:{fontSize:10,color:"#aaa"}},fmt(displayDate(t))),
          t._expanded?ce("span",{style:{fontSize:9,color:RC.tx,background:RC.bg,borderRadius:4,padding:"1px 5px"}},Ico("recur",9,RC.tx)):null
        );
      });

    return ce("div",{key:q.label,style:{flex:1,minWidth:220}},
      ce("div",{style:{background:q.color,border:"0.5px solid "+q.ac+"44",borderRadius:10,padding:"10px 12px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}},
        ce("span",{style:{fontSize:14,fontWeight:700,color:q.ac}}),
        ce("span",{style:{fontSize:14,fontWeight:700,color:q.ac}},q.label),
        ce("span",{style:{fontSize:12,color:q.ac,background:q.ac+"22",borderRadius:20,padding:"1px 8px"}},qTasks.length)
      ),
      ce("div",null,taskEls)
    );
  });

  return ce("div",{style:{flex:1,minWidth:0}},
    ce("div",{style:{marginBottom:12,display:"flex",alignItems:"center",gap:10}},
      ce("span",{style:{fontSize:14,fontWeight:600,color:BLK}},"Quarterly View"),
      ce("div",{style:{display:"flex",alignItems:"center",gap:6}},
        ce("button",{onClick:function(){setYr(yr-1);},style:{background:"none",border:"0.5px solid #DDD",borderRadius:7,cursor:"pointer",padding:"3px 10px",fontSize:13,color:"#555"}},"<"),
        ce("span",{style:{fontSize:13,fontWeight:600,color:BLK,minWidth:40,textAlign:"center"}},yr),
        ce("button",{onClick:function(){setYr(yr+1);},style:{background:"none",border:"0.5px solid #DDD",borderRadius:7,cursor:"pointer",padding:"3px 10px",fontSize:13,color:"#555"}},">")
      ),
      ce("span",{style:{fontSize:11,color:"#aaa",display:"flex",alignItems:"center",gap:3}},Ico("recur",10,"#aaa")," = recurring occurrence")
    ),
    ce("div",{style:{display:"grid",gridTemplateColumns:window.innerWidth<500?"1fr":"repeat(auto-fit,minmax(200px,1fr))",gap:10}},qEls)
  );
}


// ── NotesView ───────────────────────────────────────────────────────────────
// notes table schema:
//   id uuid pk, owner text, shared_with text, ctx text,
//   title text, body text, note_type text (private|ctx|shared), updated_at timestamptz
function NotesView(props){
  var cu=props.cu;
  var [notes,setNotes]=useState([]);
  var [activeId,setActiveId]=useState(null);
  var [editTitle,setEditTitle]=useState("");
  var [editBody,setEditBody]=useState("");
  var [saving,setSaving]=useState(false);
  var [tab,setTab]=useState("private"); // private | ctx | shared
  var [newCtx,setNewCtx]=useState(TREE[0]?TREE[0].id:"N");
  var [newSharedWith,setNewSharedWith]=useState(cu==="Jhonatan"?"Sarah":"Jhonatan");
  var saveTimer=React.useRef(null);

  var uctxs=USERS[cu]?USERS[cu].ctxs:[];
  var accessibleTrees=TREE.filter(function(n){return n.subs.some(function(s){return uctxs.indexOf(s.id)>=0;})||uctxs.indexOf(n.id)>=0;});

  function loadNotes(){
    sb.from("notes").select("*")
      .or("owner.eq."+cu+",shared_with.eq."+cu)
      .order("updated_at",{ascending:false})
      .then(function(r){if(r.data)setNotes(r.data);});
  }

  useEffect(function(){loadNotes();},[cu]);

  // Realtime
  useEffect(function(){
    var ch=sb.channel("notes-rt").on("postgres_changes",{event:"*",schema:"public",table:"notes"},function(){loadNotes();}).subscribe();
    return function(){sb.removeChannel(ch);};
  },[cu]);

  function selectNote(n){
    setActiveId(n.id);
    setEditTitle(n.title||"");
    setEditBody(n.body||"");
  }

  function autoSave(id,title,body){
    if(saveTimer.current)clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(function(){
      setSaving(true);
      sb.from("notes").update({title:title,body:body,updated_at:new Date().toISOString()}).eq("id",id).then(function(){setSaving(false);loadNotes();});
    },800);
  }

  function createNote(type,ctx,sharedWith){
    var row={
      owner:cu,
      note_type:type,
      ctx:ctx||null,
      shared_with:sharedWith||null,
      title:type==="ctx"?"Notes — "+getVL(ctx):type==="shared"?"Shared with "+sharedWith:"My Private Notes",
      body:"",
      updated_at:new Date().toISOString()
    };
    sb.from("notes").insert([row]).select().then(function(r){
      if(r.data&&r.data[0]){loadNotes();selectNote(r.data[0]);}
    });
  }

  function deleteNote(id){
    sb.from("notes").delete().eq("id",id).then(function(){
      if(activeId===id){setActiveId(null);setEditTitle("");setEditBody("");}
      loadNotes();
    });
  }

  // Filter notes by tab
  var privateNotes=notes.filter(function(n){return n.note_type==="private"&&n.owner===cu;});
  var ctxNotes=notes.filter(function(n){return n.note_type==="ctx"&&(n.owner===cu);});
  var sharedNotes=notes.filter(function(n){return n.note_type==="shared"&&(n.owner===cu||n.shared_with===cu);});

  var tabNotes=tab==="private"?privateNotes:tab==="ctx"?ctxNotes:sharedNotes;
  var activeNote=notes.find(function(n){return n.id===activeId;});

  // Note list
  var noteList=ce("div",{style:{width:220,flexShrink:0,display:"flex",flexDirection:"column",gap:0,borderRight:"1px solid #E8E8E6",paddingRight:0}},
    // Tabs
    ce("div",{style:{display:"flex",borderBottom:"1px solid #E8E8E6",marginBottom:0}},
      ["private","ctx","shared"].map(function(t){
        var labels={private:"Private",ctx:"Context",shared:"Shared"};
        var a=tab===t;
        return ce("button",{key:t,onClick:function(){setTab(t);setActiveId(null);},style:{flex:1,padding:"8px 4px",fontSize:11,fontWeight:a?700:400,border:"none",borderBottom:a?"2px solid "+MB:"2px solid transparent",background:"none",cursor:"pointer",color:a?MD:"#888"}},labels[t]);
      })
    ),
    // Note entries
    ce("div",{style:{flex:1,overflowY:"auto",maxHeight:500}},
      tabNotes.length===0?ce("div",{style:{padding:16,fontSize:12,color:"#bbb",textAlign:"center"}},"No notes yet"):
      tabNotes.map(function(n){
        var a=activeId===n.id;
        var isOwner=n.owner===cu;
        return ce("div",{key:n.id,onClick:function(){selectNote(n);},style:{padding:"10px 14px",cursor:"pointer",borderBottom:"0.5px solid #F0F0EE",background:a?"#E8FBF1":"transparent",display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}},
          ce("div",{style:{flex:1,minWidth:0}},
            ce("div",{style:{fontSize:13,fontWeight:a?600:400,color:a?MD:BLK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},n.title||"Untitled"),
            ce("div",{style:{fontSize:10,color:"#aaa",marginTop:2}},
              n.note_type==="ctx"?getVL(n.ctx):n.note_type==="shared"?(n.owner===cu?"→ "+n.shared_with:"← "+n.owner):"Only you"
            )
          ),
          isOwner?ce("button",{onClick:function(e){e.stopPropagation();deleteNote(n.id);},style:{background:"none",border:"none",cursor:"pointer",color:"#ccc",padding:2,flexShrink:0,display:"flex"}},Ico("trash",12)):null
        );
      })
    ),
    // New note button
    ce("div",{style:{padding:"10px 12px",borderTop:"0.5px solid #E8E8E6"}},
      tab==="private"?ce("button",{onClick:function(){createNote("private",null,null);},style:{width:"100%",padding:"7px",borderRadius:8,border:"1px dashed #DDD",background:"none",fontSize:12,color:MUT,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}},Ico("plus",12,MUT)," New private note"):
      tab==="ctx"?ce("div",{style:{display:"flex",gap:6}},
        ce("select",{value:newCtx,onChange:function(e){setNewCtx(e.target.value);},style:{flex:1,fontSize:11,padding:"5px 7px",borderRadius:7,border:"0.5px solid #DDD",background:WH,color:BLK}},
          accessibleTrees.map(function(n){return ce("option",{key:n.id,value:n.id},n.label);})
        ),
        ce("button",{onClick:function(){createNote("ctx",newCtx,null);},style:{padding:"5px 10px",borderRadius:7,border:"none",background:MB,color:BLK,fontSize:11,fontWeight:600,cursor:"pointer"}},"+ Add")
      ):
      ce("div",{style:{display:"flex",gap:6}},
        ce("select",{value:newSharedWith,onChange:function(e){setNewSharedWith(e.target.value);},style:{flex:1,fontSize:11,padding:"5px 7px",borderRadius:7,border:"0.5px solid #DDD",background:WH,color:BLK}},
          Object.keys(USERS).filter(function(u){return u!==cu;}).map(function(u){return ce("option",{key:u,value:u},u);})
        ),
        ce("button",{onClick:function(){createNote("shared",null,newSharedWith);},style:{padding:"5px 10px",borderRadius:7,border:"none",background:MB,color:BLK,fontSize:11,fontWeight:600,cursor:"pointer"}},"+ Add")
      )
    )
  );

  // Editor
  var MUT="#6B7280";
  var editor=activeNote?ce("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:"0 0 0 20px"}},
    // Note header
    ce("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:12}},
      ce("div",{style:{flex:1}},
        ce("input",{
          value:editTitle,
          onChange:function(e){setEditTitle(e.target.value);autoSave(activeNote.id,e.target.value,editBody);},
          style:{fontSize:18,fontWeight:700,color:BLK,border:"none",outline:"none",background:"none",width:"100%",fontFamily:"inherit"}
        })
      ),
      saving?ce("span",{style:{fontSize:11,color:"#aaa"}},"Saving..."):ce("span",{style:{fontSize:11,color:"#ccc"}},"Auto-saved"),
      activeNote.note_type==="shared"?ce("div",{style:{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#0F6E9A",background:"#E0F2FB",borderRadius:6,padding:"3px 8px"}},
        Ico("users",12,"#0F6E9A"),
        activeNote.owner===cu?"Shared with "+activeNote.shared_with:"From "+activeNote.owner
      ):activeNote.note_type==="ctx"?ce("div",{style:{fontSize:11,color:MD,background:"#E8FBF1",borderRadius:6,padding:"3px 8px"}},"📁 "+getVL(activeNote.ctx)):
      ce("div",{style:{fontSize:11,color:"#6B21A8",background:"#FEF0FF",borderRadius:6,padding:"3px 8px"}},"🔒 Private")
    ),
    // Can only edit if you own it (for shared notes, both can edit)
    activeNote.owner===cu||activeNote.note_type==="shared"?
    ce("textarea",{
      value:editBody,
      onChange:function(e){setEditBody(e.target.value);autoSave(activeNote.id,editTitle,e.target.value);},
      placeholder:"Start writing...",
      style:{flex:1,border:"none",outline:"none",resize:"none",fontSize:14,lineHeight:1.7,color:BLK,background:"none",fontFamily:"inherit",minHeight:400}
    }):
    ce("div",{style:{fontSize:14,lineHeight:1.7,color:BLK,whiteSpace:"pre-wrap"}},editBody||ce("span",{style:{color:"#ccc"}},"No content yet"))
  ):ce("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"#ccc"}},
    Ico("note",32,"#DDD"),
    ce("div",{style:{fontSize:13}},"Select a note or create a new one")
  );

  return ce("div",{style:{flex:1,minWidth:0}},
    ce("div",{style:{marginBottom:12,display:"flex",alignItems:"center",gap:8}},
      ce("span",{style:{fontSize:14,fontWeight:600,color:BLK}},"Notes"),
      ce("span",{style:{fontSize:12,color:"#aaa"}},"·"),
      ce("span",{style:{fontSize:12,color:"#888"}},"Private, contextual & shared")
    ),
    ce("div",{style:{background:WH,borderRadius:12,border:"0.5px solid #E2E2E0",display:"flex",minHeight:520,overflow:"hidden"}},
      noteList,
      ce("div",{style:{flex:1,padding:"16px 20px",display:"flex",flexDirection:"column"}},editor)
    )
  );
}


// ── HelpModal ──────────────────────────────────────────────────────────────
function HelpModal(props){
  var sections=[
    {title:"📋 Board View",body:"Your main workspace. Tasks are organized in three columns: To Do, In Progress, and Done. Click any task to expand it. Use the sort and filter bar to narrow down by priority, due date, or time window (Today / This Week / This Month / This Quarter). Recurring tasks only show within 30 days on the board."},
    {title:"📅 Monthly View",body:"A full calendar showing all tasks by their due date or created date. Tasks without a due date appear on the day they were created. Recurring tasks are expanded up to 18 months ahead. Click any task pill to open and edit it."},
    {title:"📊 Quarterly View",body:"Shows all four quarters of the year side by side. Navigate between years with the arrows. Recurring tasks are automatically expanded for the full year. Click any task row to edit it. Color dots match the task's category color."},
    {title:"🔁 Recurring View",body:"Lists only the base recurring tasks — one row per repeating task. Edit the repeat schedule, deadline offset, or any task details here. Changes apply to all future occurrences. Delete from here removes the entire recurring series."},
    {title:"📝 Notes",body:"A standalone scratchpad separate from tasks. Three tabs: Private (only you see it), Context (tied to a category like Nuve or Kesos), and Shared (a live scratchpad between you and one other user). Notes auto-save as you type."},
    {title:"✅ Creating & Editing Tasks",body:"Tap '+ New task' or '+ Add task' at the bottom of any column. Fill in title, category, priority, due date, and who it's assigned to. You can add subtasks (reorderable by the arrows), notes, private notes, and a message for the assignee. For recurring tasks, set the repeat schedule and an optional deadline offset."},
    {title:"🔄 Recurring Tasks",body:"When you complete a recurring task, choose 'Mark done & schedule next' to automatically create the next occurrence, or 'Mark done only' to stop the series. To delete: 'Delete this instance only' removes just that occurrence; 'Delete all repeating tasks' removes the series permanently (requires confirmation)."},
    {title:"🗂 Categories & Filters",body:"Use the sidebar to filter by category or subcategory. The 'Assigned to' section filters tasks by who they belong to. All views respect the active sidebar filter. Click 'All tasks' to reset."},
    {title:"🏷 Past Due",body:"Overdue tasks show a red PAST DUE badge. Use the Past Due filter button in the sort bar to see only overdue tasks across all views."},
    {title:"👥 Users & Access",body:"Jhonatan has full access to all categories. Sarah sees Personal & Rentals categories plus her own Work section. Gin sees Nuve and Kesos Tacos. Gin can also switch to 'View as Jhonatan' mode to act on his behalf (except Personal tasks). Each user has a 4-digit PIN."},
    {title:"🗑 Clear Done",body:"In the Board view, the Done column has a 'Clear all' button that permanently deletes all completed tasks. For recurring tasks, only the completed instance is removed — the next occurrence stays in To Do."},
  ];
  var [openIdx,setOpenIdx]=useState(null);
  return ce("div",{onClick:props.onClose,style:{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px 16px",overflowY:"auto"}},
    ce("div",{onClick:function(e){e.stopPropagation();},style:{background:WH,borderRadius:16,width:"100%",maxWidth:580,boxShadow:"0 16px 48px rgba(0,0,0,.18)"}},
      // Header
      ce("div",{style:{padding:"20px 24px 16px",borderBottom:"1px solid #F0F0EE",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:WH,borderRadius:"16px 16px 0 0",zIndex:1}},
        ce("div",null,
          ce("h2",{style:{fontSize:18,fontWeight:700,color:BLK,margin:0}},"How to Use Nuve Task Manager"),
          ce("p",{style:{fontSize:12,color:"#888",margin:"4px 0 0"}})
        ),
        ce("button",{onClick:props.onClose,style:{background:"none",border:"none",cursor:"pointer",color:"#aaa",display:"flex",padding:4,borderRadius:8}},Ico("x",18,"#aaa"))
      ),
      // Sections
      ce("div",{style:{padding:"12px 16px 20px"}},
        sections.map(function(s,i){
          var open=openIdx===i;
          return ce("div",{key:i,style:{borderRadius:10,border:"0.5px solid #E8E8E6",marginBottom:6,overflow:"hidden"}},
            ce("button",{onClick:function(){setOpenIdx(open?null:i);},style:{width:"100%",padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:open?"#E8FBF1":"#FAFAF9",border:"none",cursor:"pointer",textAlign:"left",gap:8}},
              ce("span",{style:{fontSize:13,fontWeight:600,color:open?MD:BLK}},s.title),
              Ico(open?"chevu":"chev",14,"#aaa")
            ),
            open?ce("div",{style:{padding:"10px 16px 14px",fontSize:13,color:"#444",lineHeight:1.7,borderTop:"0.5px solid #E8E8E6",background:WH}},s.body):null
          );
        }),
        ce("div",{style:{marginTop:16,padding:"12px 16px",background:"#E8FBF1",borderRadius:10,fontSize:12,color:MD,lineHeight:1.6,textAlign:"center"}},
          "💡 Tip: The sidebar filter applies to all views — Board, Monthly, Quarterly, and Recurring."
        )
      )
    )
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
  var [deleteRecurT,setDeleteRecurT]=useState(null);
  var [filterPastDue,setFilterPastDue]=useState(false);
  var [dateWindow,setDateWindow]=useState(null); // null|'today'|'week'|'month'|'quarter'
  var [dateWindowBy,setDateWindowBy]=useState('due'); // 'due'|'created'
  var [proxyView,setProxyView]=useState(false); // Gin viewing as Jhonatan
  var [showHelp,setShowHelp]=useState(false);
  var [searchQ,setSearchQ]=useState("");
  var [showSearch,setShowSearch]=useState(false);
  var [darkMode,setDarkMode]=useState(false);
  var [seenNotify,setSeenNotify]=useState({});  // taskId -> true when opened
  var [templates,setTemplates]=useState(function(){try{return JSON.parse(localStorage.getItem("nuve_templates")||"[]");}catch(e){return [];}});

  // Dark mode
  useEffect(function(){
    var root=document.documentElement;
    if(darkMode){
      root.style.setProperty("--bg","#1A1A2E");
      root.style.setProperty("--surface","#16213E");
      root.style.setProperty("--border","#2A2A4A");
      root.style.setProperty("--text","#E8E8F0");
      document.body.style.background="#1A1A2E";
      document.body.style.color="#E8E8F0";
    } else {
      root.style.removeProperty("--bg");
      root.style.removeProperty("--surface");
      root.style.removeProperty("--border");
      root.style.removeProperty("--text");
      document.body.style.background="";
      document.body.style.color="";
    }
  },[darkMode]);

  // Keyboard shortcuts
  useEffect(function(){
    function onKey(e){
      if(e.key==="Escape"){setModal(false);setEditT(null);setShowHelp(false);setShowSearch(false);}
      if(e.key==="n"&&!modal&&!showHelp&&e.target.tagName!=="INPUT"&&e.target.tagName!=="TEXTAREA"){setEditT(null);setModal(true);}
      if(e.key==="/"&&e.target.tagName!=="INPUT"&&e.target.tagName!=="TEXTAREA"){e.preventDefault();setShowSearch(function(v){return !v;});}
    }
    window.addEventListener("keydown",onKey);
    return function(){window.removeEventListener("keydown",onKey);};
  },[modal,showHelp]);

  // Tab title: overdue count
  useEffect(function(){
    if(!cu)return;
    var overdue=tasks.filter(function(t){return t.due&&t.due<new Date().toISOString().slice(0,10)&&t.status!=="Done";}).length;
    document.title=overdue>0?overdue+" overdue · Nuve Task Tracker":"Nuve Task Tracker";
  },[tasks,cu]);

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

  if(!cu){return ce(Login,{onLogin:function(u){setCu(u);setSel("All");setAf(u);setView("board");}});}

  var effectiveCu=proxyView&&cu==="Gin"?"Jhonatan":cu;
  var uctxs=proxyView&&cu==="Gin"?AI.filter(function(x){return PI.indexOf(x)<0;}):USERS[cu].ctxs;
  var actCtxs=resolveCtxs(sel,uctxs);
  var realVis=tasks.filter(function(t){
    if(uctxs.indexOf(t.ctx)>=0)return true;
    if(t.shared&&isPers(t.ctx)&&(effectiveCu==="Jhonatan"||effectiveCu==="Sarah")&&cu!=="Gin")return true;
    return false;
  });
  // Add virtual recurring occurrences (next 90 days) for board/monthly/quarterly
  var win=getBoardWindow();
  var virtualOccs=generateOccurrences(realVis.filter(function(t){return t.status!=="Done";}),win.start,win.end);
  var allVis=realVis.concat(virtualOccs);
  var base=tasks.filter(function(t){
    var inCtx=actCtxs.indexOf(t.ctx)>=0;
    var isPersonalSel=sel==="All"||sel==="P";
    var isMatchingSub=sel===t.ctx;
    var sv=t.shared&&isPers(t.ctx)&&(cu==="Jhonatan"||cu==="Sarah")&&(isPersonalSel||isMatchingSub)&&cu!=="Gin";
    if(!inCtx&&!sv)return false;
    if(af!=="All"&&!t.shared&&t.to!==af)return false;
    // In proxy view, show Jhonatan's tasks
    if(proxyView&&cu==="Gin"&&t.ctx&&PI.indexOf(t.ctx)>=0)return false;
    // Hide recurring tasks on board if due date is more than 30 days away
    if(t.recur&&t.recur!=="None"&&t.status!=="Done"&&t.due){
      var cutoff=new Date();cutoff.setDate(cutoff.getDate()+30);
      if(new Date(t.due+"T00:00:00")>cutoff)return false;
    }
    return true;
  });
  var todayStr2=new Date().toISOString().slice(0,10);
  var baseFiltered2=filterPastDue?base.filter(function(t){return t.due&&t.due.slice(0,10)<todayStr2&&t.status!=="Done"&&!t._virtual;}):base;
  var baseFiltered=dateWindow?baseFiltered2.filter(function(t){
    var d=dateWindowBy==="created"?(t.created_at?t.created_at.slice(0,10):""):displayDate(t);
    if(!d)return false;
    var now2=new Date(); var td=todayStr2;
    if(dateWindow==="today")return d===td;
    if(dateWindow==="week"){
      var wstart=new Date(now2);wstart.setDate(now2.getDate()-now2.getDay());
      var wend=new Date(wstart);wend.setDate(wstart.getDate()+6);
      return d>=wstart.toISOString().slice(0,10)&&d<=wend.toISOString().slice(0,10);
    }
    if(dateWindow==="month"){
      return d.slice(0,7)===td.slice(0,7);
    }
    if(dateWindow==="quarter"){
      var qm=Math.floor(now2.getMonth()/3)*3;
      var qs=now2.getFullYear()+"-"+padZ(qm+1)+"-01";
      var qe=new Date(now2.getFullYear(),qm+3,0).toISOString().slice(0,10);
      return d>=qs&&d<=qe;
    }
    return true;
  }):baseFiltered2;
  var baseSearched=searchQ.trim()?baseFiltered.filter(function(t){var q=searchQ.toLowerCase();return t.title.toLowerCase().indexOf(q)>=0||(t.notes&&t.notes.toLowerCase().indexOf(q)>=0)||(t.ctx&&ctxLbl(t.ctx).toLowerCase().indexOf(q)>=0);}):baseFiltered;
  var sorted=srt?baseSearched.slice().sort(function(a,b){
    if(srt==="pa")return PO[a.pri]-PO[b.pri];
    if(srt==="pd")return PO[b.pri]-PO[a.pri];
    if(srt==="da")return(a.due||"9999")>(b.due||"9999")?1:-1;
    if(srt==="dd")return(a.due||"0000")<(b.due||"0000")?1:-1;
    return 0;
  }):baseSearched;

  var notifyBadge=tasks.filter(function(t){return t.notify_notes&&t.to===cu&&t.status!=="Done"&&!seenNotify[t.id];}).length;
  var openCnt=allVis.filter(function(t){return t.status!=="Done";}).length;
  var recCnt=allVis.filter(function(t){return t.recur!=="None"&&t.status!=="Done";}).length;
  var mineCnt=allVis.filter(function(t){return(t.to===effectiveCu||t.shared)&&t.status!=="Done";}).length;
  var vl=getVL(sel);
  var roleLbl=cu==="Gin"?"Work only":cu==="Sarah"?"Personal & Rentals":"Full access";

  function saveTask(form){
    var data=taskToDb(form,proxyView&&cu==="Gin"?"Jhonatan":cu);
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
    // Find the task to check if it's recurring
    var t=allVis.find(function(x){return x.id===id;});
    if(t&&t.recur&&t.recur!=="None"){
      setDeleteRecurT(t);
    } else {
      sb.from("tasks").delete().eq("id",id).then(function(){loadTasks();});
    }
  }
  function delOneInstance(task){
    // Delete just this instance — mark it done with no recur so it disappears
    sb.from("tasks").update({status:"Done",recur:"None"}).eq("id",task.id).then(function(){loadTasks();});
    setDeleteRecurT(null);
  }
  function delAllRecurring(task){
    // Delete this task and all future virtual ones (they aren't in DB yet, just delete base)
    sb.from("tasks").delete().eq("id",task.id).then(function(){loadTasks();});
    setDeleteRecurT(null);
  }
  function saveTemplate(form){
    var name=window.prompt("Name this template:");
    if(!name||!name.trim())return;
    var tpl={name:name.trim(),ctx:form.ctx,pri:form.pri,recur:form.recur,recur_deadline:form.recur_deadline,subtasks:form.subtasks,notes:form.notes};
    var updated=templates.concat([tpl]);
    setTemplates(updated);
    try{localStorage.setItem("nuve_templates",JSON.stringify(updated));}catch(e){}
  }
  function deleteTemplate(i){
    var updated=templates.filter(function(_,j){return j!==i;});
    setTemplates(updated);
    try{localStorage.setItem("nuve_templates",JSON.stringify(updated));}catch(e){}
  }

  function exportCSV(){
    var rows=[["Title","Category","Priority","Status","Due Date","Assigned To","Created By","Recurring","Created At"]];
    var exportTasks=tasks.filter(function(t){return USERS[cu]&&(USERS[cu].ctxs.indexOf(t.ctx)>=0||(t.shared&&isPers(t.ctx)))});
    exportTasks.forEach(function(t){
      rows.push([
        '"'+(t.title||"").replace(/"/g,'""')+'"',
        ctxLbl(t.ctx),
        t.pri,
        t.status,
        t.due||"",
        t.to,
        t.by,
        recurLabel(t.recur)||"None",
        t.created_at?t.created_at.slice(0,10):""
      ]);
    });
    var csv=rows.map(function(r){return r.join(",");}).join("\n");
    var blob=new Blob([csv],{type:"text/csv"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;
    a.download="nuve-tasks-"+new Date().toISOString().slice(0,10)+".csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearDone(){
    var doneTasks=sorted.filter(function(t){return t.status==="Done"&&!t._virtual;});
    if(doneTasks.length===0)return;
    var ids=doneTasks.map(function(t){return t.id;});
    sb.from("tasks").delete().in("id",ids).then(function(){loadTasks();});
  }
  function doComplete(task){if(task.recur&&task.recur!=="None"){setRecurT(task);}else{moveTask(task.id,"Done");}}
  function spawnNext(){
    var t=recurT,nd=addInt(t.due,t.recur);
    // Mark completed instance as Done and strip recur so it's just a completed task
    sb.from("tasks").update({status:"Done",recur:"None"}).eq("id",t.id).then(function(){
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
    var cards=items.length===0?[ce("div",{key:"empty",style:{textAlign:"center",padding:"22px 0",color:"#bbb",fontSize:13}},"No tasks")]:items.map(function(t){return ce(TaskCard,{key:t.id,task:t,cu:effectiveCu,onMove:t._virtual?function(){}:moveTask,onEdit:function(tk){if(!tk._virtual){setEditT(tk);setModal(true);if(tk.notify_notes&&tk.to===cu)setSeenNotify(function(s){var n=Object.assign({},s);n[tk.id]=true;return n;});}},onDel:t._virtual?function(){}:delTask,onComplete:t._virtual?function(){}:doComplete});});
    var colHeader=ce("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"7px 10px",background:cm.bg,borderRadius:8,border:"0.5px solid "+cm.ac+"33"}},
      ce("span",{style:{width:8,height:8,borderRadius:"50%",background:cm.ac,flexShrink:0}}),
      ce("span",{style:{fontSize:13,fontWeight:600,color:cm.tx,flex:1}},col),
      ce("span",{style:{fontSize:12,color:cm.tx,background:"rgba(255,255,255,.75)",borderRadius:20,padding:"1px 8px",border:"0.5px solid "+cm.ac+"44"}},items.length),
      col==="Done"&&items.length>0?ce("button",{
        onClick:function(){
          var recurCount=items.filter(function(t){return t.recur&&t.recur!=="None";}).length;
          var msg="Clear all "+items.length+" completed task"+(items.length===1?"":"s")+"?";
          if(recurCount>0)msg+="\n\n"+recurCount+" are recurring — their next occurrence is already in To Do. This only removes the completed instances.";
          msg+="\n\nThis cannot be undone.";
          if(window.confirm(msg))clearDone();
        },
        style:{marginLeft:4,padding:"2px 9px",borderRadius:6,border:"1px solid #FCA5A5",background:"none",color:"#DC2626",fontSize:11,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap"}
      },"Clear all"):null
    );
    return ce("div",{key:col},colHeader,cards);
  });

  var boardView=ce("div",{style:{flex:1,minWidth:0}},
    ce("div",{style:{marginBottom:8,display:"flex",alignItems:"center",gap:8}},
      ce("span",{style:{fontSize:14,fontWeight:600,color:BLK}},vl),
      ce("span",{style:{fontSize:12,color:"#aaa"}},"·"),
      ce("span",{style:{fontSize:12,color:"#888"}},base.filter(function(t){return t.status!=="Done";}).length+" open")
    ),
    ce("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap",overflowX:"auto"}},
      ce("span",{style:{fontSize:11,color:"#aaa",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",flexShrink:0}},"Sort"),
      sortBtns,
      ce("button",{onClick:function(){setFilterPastDue(function(v){return !v;});},style:{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:filterPastDue?700:400,border:filterPastDue?"1.5px solid #DC2626":"0.5px solid #DDD",background:filterPastDue?"#FEF2F2":"#F7F7F6",color:filterPastDue?"#DC2626":"#666",cursor:"pointer"}},
        svg(["M12 9v4","M12 17h.01","M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"],11,11,filterPastDue?"#DC2626":"#999")," Past Due"
      ),
      srt?ce("button",{onClick:function(){setSrt(null);},style:{fontSize:11,color:"#999",background:"none",border:"none",cursor:"pointer",padding:"2px 4px"}},"x clear"):null
    ),
    ce("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:10,flexWrap:"wrap",overflowX:"auto"}},
      ce("span",{style:{fontSize:11,color:"#aaa",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",flexShrink:0}},"Show"),
      ["today","week","month","quarter"].map(function(w){
        var labels={today:"Today",week:"This Week",month:"This Month",quarter:"This Quarter"};
        var a=dateWindow===w;
        return ce("button",{key:w,onClick:function(){setDateWindow(a?null:w);},style:{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:a?600:400,border:a?"1.5px solid "+MD:"0.5px solid #DDD",background:a?"#E8FBF1":"#F7F7F6",color:a?MD:"#666",cursor:"pointer"}},labels[w]);
      }),
      dateWindow?ce("div",{style:{display:"flex",alignItems:"center",gap:4,marginLeft:4,background:"#F7F7F6",borderRadius:20,padding:"2px 4px",border:"0.5px solid #DDD"}},
        ce("span",{style:{fontSize:10,color:"#888"}},dateWindowBy==="due"?"by due date":"by created date"),
        ce("button",{onClick:function(){setDateWindowBy(function(v){return v==="due"?"created":"due";});},style:{fontSize:10,padding:"2px 7px",borderRadius:20,border:"0.5px solid #DDD",background:WH,cursor:"pointer",color:"#555"}},dateWindowBy==="due"?"→ created":"→ due date")
      ):null
    ),
    loading?ce("div",{style:{textAlign:"center",padding:40,color:"#aaa",fontSize:13}},"Loading tasks..."):ce("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}},colEls)
  );

  var calView=ce("div",{style:{flex:1,minWidth:0}},
    ce("div",{style:{marginBottom:12,display:"flex",alignItems:"center",gap:8}},
      ce("span",{style:{fontSize:14,fontWeight:600,color:BLK}},"Calendar"),
      ce("span",{style:{fontSize:12,color:"#aaa"}},"·"),
      ce("span",{style:{fontSize:12,color:"#888"}},"Your tasks by due date")
    ),
    ce(CalendarView,{cu:cu,tasks:base.concat(generateOccurrences(base.filter(function(t){return t.status!=="Done"&&!t._virtual;}),new Date().toISOString().slice(0,10),new Date(new Date().getFullYear(),new Date().getMonth()+18,0).toISOString().slice(0,10))),onTaskClick:function(t){setEditT(t);setModal(true);}})
  );

  var isMobile=window.innerWidth<700;
  var DM=darkMode; // shorthand for dark mode checks in JSX
  var viewLabels={board:"Board",calendar:"Monthly",quarterly:"Quarterly",recurring:"Recurring",notes:"Notes"};
  var topBar=ce("div",{style:{background:DM?"#16213E":WH,borderRadius:12,padding:"8px 12px",marginBottom:12,border:"0.5px solid "+(DM?"#2A2A4A":"#E2E2E0")}},
    // Row 1: logo + stats + user
    ce("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:6}},
      ce("button",{onClick:function(){setSideOpen(function(o){return !o;});},style:{display:"flex",alignItems:"center",justifyContent:"center",width:34,height:34,borderRadius:8,border:"0.5px solid #DDD",background:sideOpen?"#E8FBF1":"#F7F7F6",cursor:"pointer",flexShrink:0}},
        svg(sideOpen?["M3 5h10","M3 8h7","M3 11h4"]:["M3 5h10","M3 8h10","M3 11h10"],16,16,sideOpen?MD:"#666")
      ),
      ce("img",{src:LOGO_SVG,alt:"Nuve",style:{height:20,width:"auto",flexShrink:0}}),
      ce("div",{style:{display:"flex",gap:5,alignItems:"center",flex:1,overflowX:"auto"}},statEls),
      // Search button
      ce("button",{onClick:function(){setShowSearch(function(v){return !v;});},style:{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:"50%",border:showSearch?"1.5px solid "+MD:"1.5px solid #DDD",background:showSearch?"#E8FBF1":"#F7F7F6",cursor:"pointer",flexShrink:0,padding:0,lineHeight:0}},
        svg(["M11 11l4 4","M17 7a6 6 0 1 1-12 0 6 6 0 0 1 12 0"],14,14,showSearch?MD:"#888")
      ),
      // Notification badge
      notifyBadge>0?ce("div",{style:{position:"relative",flexShrink:0}},
        ce("button",{onClick:function(){setView("board");setAf(cu);},style:{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:"50%",border:"1.5px solid #FCA5A5",background:"#FEF2F2",cursor:"pointer",padding:0,lineHeight:0}},
          svg(["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"],14,14,"#DC2626")
        ),
        ce("span",{style:{position:"absolute",top:-4,right:-4,background:"#DC2626",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}},notifyBadge)
      ):null,
      // Dark mode toggle
      ce("button",{onClick:function(){setDarkMode(function(v){return !v;});},style:{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:"50%",border:"1.5px solid #DDD",background:darkMode?"#1A1A2E":"#F7F7F6",cursor:"pointer",flexShrink:0,padding:0,lineHeight:0}},
        darkMode?svg(["M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"],14,14,"#E8E8F0"):svg(["M12 2v2","M12 20v2","M4.93 4.93l1.41 1.41","M17.66 17.66l1.41 1.41","M2 12h2","M20 12h2","M4.93 19.07l1.41-1.41","M17.66 6.34l1.41-1.41","M12 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6z"],14,14,"#888")
      ),
      // Export CSV
      isMobile?null:ce("button",{onClick:exportCSV,title:"Export CSV",style:{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:"50%",border:"1.5px solid #DDD",background:"#F7F7F6",cursor:"pointer",flexShrink:0,padding:0,lineHeight:0}},
        svg(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5","M12 15V3"],14,14,"#888")
      ),
      // Help button
      ce("button",{onClick:function(){setShowHelp(true);},style:{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:"50%",border:"1.5px solid #DDD",background:"#F7F7F6",cursor:"pointer",flexShrink:0,fontSize:13,fontWeight:700,color:"#666",padding:0,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}},"?"),
      ce("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",background:"#F7F7F6",borderRadius:9,border:"0.5px solid #E2E2E0",flexShrink:0}},
        Av(cu,22),
        isMobile?null:ce("div",{style:{fontSize:12,fontWeight:600,color:BLK}},proxyView&&cu==="Gin"?"Acting as Jhonatan":cu),
        ce("button",{onClick:function(){setCu(null);setProxyView(false);},style:{background:"none",border:"none",cursor:"pointer",color:"#bbb",display:"flex",padding:2}},Ico("logout",13))
      )
    ),
    // Search bar row
    showSearch?ce("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"4px 0"}},
      ce("input",{
        autoFocus:true,
        value:searchQ,
        onChange:function(e){setSearchQ(e.target.value);},
        onKeyDown:function(e){if(e.key==="Escape"){setShowSearch(false);setSearchQ("");}},
        placeholder:"Search tasks... (press / to toggle)",
        style:{flex:1,padding:"7px 12px",borderRadius:9,border:"1.5px solid "+MD,background:"#F7F7F6",fontSize:13,color:BLK,outline:"none",fontFamily:"inherit"}
      }),
      searchQ?ce("button",{onClick:function(){setSearchQ("");},style:{background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:12,padding:"0 4px"}},"✕ clear"):null
    ):null,
    // Row 2: view switcher + actions
    ce("div",{style:{display:"flex",alignItems:"center",gap:6,flexWrap:"nowrap",overflowX:"auto"}},
      ce("button",{onClick:function(){setEditT(null);setModal(true);},style:{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:9,fontSize:12,fontWeight:600,border:"none",background:MB,color:BLK,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}},Ico("plus",13,BLK),isMobile?"":"New task"),
      // View buttons — on mobile use a select dropdown, on desktop use button row
      isMobile?ce("select",{value:view,onChange:function(e){setView(e.target.value);},style:{flex:1,padding:"6px 10px",borderRadius:8,border:"0.5px solid #DDD",background:WH,fontSize:12,color:BLK,fontFamily:"inherit"}},
        Object.keys(viewLabels).map(function(v){return ce("option",{key:v,value:v},viewLabels[v]);})
      ):ce("div",{style:{display:"flex",border:"0.5px solid #DDD",borderRadius:8,overflow:"hidden",flexShrink:0}},
        Object.keys(viewLabels).map(function(v){return ce("button",{key:v,onClick:function(){setView(v);},style:{padding:"6px 11px",fontSize:12,fontWeight:view===v?600:400,background:view===v?MB:"#F7F7F6",color:view===v?BLK:"#666",border:"none",cursor:"pointer"}},viewLabels[v]);})
      ),
      isMobile?ce("button",{onClick:exportCSV,title:"Export CSV",style:{display:"flex",alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:8,border:"0.5px solid #DDD",background:"#F7F7F6",cursor:"pointer",flexShrink:0}},
        svg(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5","M12 15V3"],14,14,"#888")
      ):null,
      cu==="Gin"?ce("button",{onClick:function(){setProxyView(function(p){return !p;});},style:{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:9,border:proxyView?"1.5px solid #00965E":"1px solid #DDD",background:proxyView?"#E0F7EE":"#F7F7F6",cursor:"pointer",fontSize:11,fontWeight:proxyView?600:400,color:proxyView?MD:"#555",flexShrink:0,whiteSpace:"nowrap"}},
        Av("Jhonatan",18),proxyView?"J-View":"As Jhonatan"
      ):null
    )
  );

  var modalEl=null;
  if(modal){modalEl=ce(TaskModal,{task:editT,cu:effectiveCu,onSave:saveTask,onClose:function(){setModal(false);setEditT(null);},templates:templates,onSaveTemplate:saveTemplate,onDeleteTemplate:deleteTemplate});}
  var recurEl=null;
  if(recurT){recurEl=ce(RecurModal,{task:recurT,onSpawn:spawnNext,onArchive:function(){moveTask(recurT.id,"Done");setRecurT(null);},onClose:function(){setRecurT(null);}});}
  var deleteRecurEl=null;
  if(deleteRecurT){deleteRecurEl=ce(DeleteRecurModal,{task:deleteRecurT,onDeleteOne:function(){delOneInstance(deleteRecurT);},onDeleteAll:function(){delAllRecurring(deleteRecurT);},onClose:function(){setDeleteRecurT(null);}});}

  return ce("div",{style:{background:darkMode?"#1A1A2E":"#F2F2F0",minHeight:"100vh",padding:14,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:darkMode?"#E8E8F0":BLK,transition:"background .2s"}},
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
        width:window.innerWidth<700?"85vw":undefined,
        boxShadow:window.innerWidth<700?"4px 0 24px rgba(0,0,0,.18)":undefined,
        overflowY:window.innerWidth<700?"auto":undefined,
        paddingTop:window.innerWidth<700?20:undefined,
      }},
        // Close button on mobile
        window.innerWidth<700?ce("button",{onClick:function(){setSideOpen(false);},style:{position:"absolute",top:12,right:12,background:"none",border:"none",cursor:"pointer",color:"#aaa",display:"flex",padding:4}},Ico("x",16)):null,
        ce(Sidebar,{cu:proxyView&&cu==="Gin"?"Jhonatan":cu,sel:sel,onSel:function(s){setSel(s);if(window.innerWidth<700)setSideOpen(false);},tasks:allVis,af:af,setAf:setAf})
      ):null,
      // Mobile backdrop
      sideOpen&&window.innerWidth<700?ce("div",{onClick:function(){setSideOpen(false);},style:{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:140}}):null,
      // Main content
      ce("div",{style:{flex:1,minWidth:0,overflowX:"auto"}},
        view==="calendar"?calView:
        view==="quarterly"?ce(QuarterlyView,{tasks:base,cu:cu,onTaskClick:function(t){setEditT(t);setModal(true);}}):
        view==="recurring"?ce(RecurringView,{tasks:base,cu:cu,onReload:loadTasks}):
        view==="notes"?ce(NotesView,{cu:cu}):
        boardView
      )
    ),
    modalEl,recurEl,deleteRecurEl,
    showHelp?ce(HelpModal,{onClose:function(){setShowHelp(false);}}):null
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(ce(App,null));
