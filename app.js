// ============================================================
//  Jhonatan's Task Manager — app.js
//  Supabase real-time sync + PIN protection
// ============================================================

const SUPABASE_URL  = "https://cwimgkiiswmpnpjbwply.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aW1na2lpc3dtcG5wamJ3cGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDExNDIsImV4cCI6MjA5MTY3NzE0Mn0.TdLVJcNHtEo6A5D6bJCJkHj7aICTDQNeEOD5kY1cNWA";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

const ce = React.createElement;
const { useState, useEffect, useRef, useCallback } = React;

// ── Users & PINs ─────────────────────────────────────────────
const USERS = [
  { name: "Jhonatan", pin: "2013", access: "full" },
  { name: "Sarah",    pin: "0222", access: "personal" },
  { name: "Gin",      pin: "0221", access: "work" },
];

// ── Constants ─────────────────────────────────────────────────
const COLS   = ["To Do", "In Progress", "Done"];
const PRIS   = ["High", "Medium", "Low"];
const RECURS = ["None","Daily","Weekly","Biweekly","Monthly","Quarterly","Annually"];
const CTXS   = ["Nuve","Kesos","Misc Business","Personal","Rentals"];
const WORK_CTXS = ["Nuve","Kesos","Misc Business"];

const CC = {
  "To Do":      { bg:"#FEF9EE", hd:"#B45309", bd:"#FCD34D" },
  "In Progress":{ bg:"#EFF6FF", hd:"#1D4ED8", bd:"#93C5FD" },
  "Done":       { bg:"#F0FDF4", hd:"#15803D", bd:"#86EFAC" },
};
const CTX_COLOR = {
  "Nuve":         { bg:"#D1FAE5", tx:"#065F46" },
  "Kesos":        { bg:"#FEF3C7", tx:"#92400E" },
  "Misc Business":{ bg:"#E0E7FF", tx:"#3730A3" },
  "Personal":     { bg:"#FCE7F3", tx:"#9D174D" },
  "Rentals":      { bg:"#F3E8FF", tx:"#6B21A8" },
};
const PRI_COLOR = { High:"#DC2626", Medium:"#D97706", Low:"#16A34A" };

const WH="#FFFFFF", BG="#F2F2F0", BLK="#1A1A1A", MUT="#6B7280";
const BLU="#2563EB", BLU_LT="#EFF6FF";

// ── Helpers ───────────────────────────────────────────────────
function initials(n){ return n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2); }
function fmtDate(d){
  if(!d) return null;
  const [y,m,day]=d.split("-");
  return `${m}/${day}/${y.slice(2)}`;
}
function isOverdue(d){ return d && new Date(d) < new Date(new Date().toDateString()); }
function isSoon(d){
  if(!d) return false;
  const diff=(new Date(d)-new Date(new Date().toDateString()))/(1000*60*60*24);
  return diff>=0 && diff<=3;
}
function addInterval(date,recur){
  if(!date) return null;
  const d=new Date(date);
  switch(recur){
    case "Daily":     d.setDate(d.getDate()+1); break;
    case "Weekly":    d.setDate(d.getDate()+7); break;
    case "Biweekly":  d.setDate(d.getDate()+14); break;
    case "Monthly":   d.setMonth(d.getMonth()+1); break;
    case "Quarterly": d.setMonth(d.getMonth()+3); break;
    case "Annually":  d.setFullYear(d.getFullYear()+1); break;
    default: return null;
  }
  return d.toISOString().split("T")[0];
}

function visibleCtxs(access){
  if(access==="full")     return CTXS;
  if(access==="work")     return WORK_CTXS;
  if(access==="personal") return ["Personal","Rentals"];
  return CTXS;
}

// ── SVG Icons ─────────────────────────────────────────────────
function Ico({name,size=16,color="currentColor"}){
  const s={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:color,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",display:"block",flexShrink:0};
  const icons={
    plus:     ce("svg",s,ce("line",{x1:12,y1:5,x2:12,y2:19}),ce("line",{x1:5,y1:12,x2:19,y2:12})),
    x:        ce("svg",s,ce("line",{x1:18,y1:6,x2:6,y2:18}),ce("line",{x1:6,y1:6,x2:18,y2:18})),
    check:    ce("svg",s,ce("polyline",{points:"20 6 9 17 4 12"})),
    edit:     ce("svg",s,ce("path",{d:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"}),ce("path",{d:"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"})),
    trash:    ce("svg",s,ce("polyline",{points:"3 6 5 6 21 6"}),ce("path",{d:"M19 6l-1 14H6L5 6"}),ce("path",{d:"M10 11v6"}),ce("path",{d:"M14 11v6"}),ce("path",{d:"M9 6V4h6v2"})),
    calendar: ce("svg",s,ce("rect",{x:3,y:4,width:18,height:18,rx:2,ry:2}),ce("line",{x1:16,y1:2,x2:16,y2:6}),ce("line",{x1:8,y1:2,x2:8,y2:6}),ce("line",{x1:3,y1:10,x2:21,y2:10})),
    repeat:   ce("svg",s,ce("polyline",{points:"17 1 21 5 17 9"}),ce("path",{d:"M3 11V9a4 4 0 0 1 4-4h14"}),ce("polyline",{points:"7 23 3 19 7 15"}),ce("path",{d:"M21 13v2a4 4 0 0 1-4 4H3"})),
    logout:   ce("svg",s,ce("path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}),ce("polyline",{points:"16 17 21 12 16 7"}),ce("line",{x1:21,y1:12,x2:9,y2:12})),
    lock:     ce("svg",s,ce("rect",{x:3,y:11,width:18,height:11,rx:2,ry:2}),ce("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})),
    eye:      ce("svg",s,ce("path",{d:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"}),ce("circle",{cx:12,cy:12,r:3})),
    eyeoff:   ce("svg",s,ce("path",{d:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"}),ce("path",{d:"M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"}),ce("line",{x1:1,y1:1,x2:23,y2:23})),
  };
  return icons[name] || ce("svg",s);
}

// ── PIN Input Component ───────────────────────────────────────
function PinInput({ user, onSuccess, onBack }) {
  const [pin, setPin]       = useState(["","","",""]);
  const [error, setError]   = useState(false);
  const [show, setShow]     = useState(false);
  const inputs              = useRef([]);

  function handleKey(i, val) {
    if(!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[i] = val;
    setPin(next);
    setError(false);
    if(val && i < 3) inputs.current[i+1]?.focus();
    if(!val && i > 0) inputs.current[i-1]?.focus();
  }

  function handlePaste(e) {
    const paste = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,4);
    if(paste.length===4){
      setPin(paste.split(""));
      inputs.current[3]?.focus();
    }
  }

  function submit() {
    const entered = pin.join("");
    if(entered === user.pin) {
      onSuccess();
    } else {
      setError(true);
      setPin(["","","",""]);
      setTimeout(()=>{ inputs.current[0]?.focus(); }, 50);
    }
  }

  function handleKeyDown(e) {
    if(e.key==="Enter") submit();
  }

  const boxStyle = (i) => ({
    width:56, height:64,
    borderRadius:12,
    border: error ? "2px solid #DC2626" : pin[i] ? "2px solid "+BLU : "1.5px solid #DDD",
    background: error ? "#FEF2F2" : pin[i] ? BLU_LT : WH,
    fontSize:28, fontWeight:700,
    textAlign:"center",
    color: show ? BLK : "transparent",
    caretColor:"transparent",
    outline:"none",
    transition:"border-color .15s, background .15s",
    boxShadow: pin[i] && !error ? "0 0 0 3px "+BLU_LT : "none",
    WebkitTextFillColor: show ? BLK : "transparent",
    textSecurity: show ? "none" : "disc",
  });

  // Show dots when hidden
  const dotStyle = (i) => ({
    position:"absolute", top:0, left:0, right:0, bottom:0,
    display:"flex", alignItems:"center", justifyContent:"center",
    pointerEvents:"none",
  });

  return ce("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:28,padding:"40px 32px",background:WH,borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,.12)",minWidth:320}},
    // Avatar
    ce("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:12}},
      ce("div",{style:{width:64,height:64,borderRadius:"50%",background:BLU_LT,color:BLU,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700}},
        initials(user.name)
      ),
      ce("div",{style:{fontSize:20,fontWeight:700,color:BLK}}, user.name),
      ce("div",{style:{fontSize:13,color:MUT,display:"flex",alignItems:"center",gap:5}},
        ce(Ico,{name:"lock",size:13,color:MUT}), "Enter your 4-digit PIN"
      )
    ),

    // PIN boxes
    ce("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:16}},
      ce("div",{style:{display:"flex",gap:12,position:"relative"}},
        pin.map((val,i) =>
          ce("div",{key:i,style:{position:"relative"}},
            ce("input",{
              ref: el => inputs.current[i]=el,
              type:"tel",
              maxLength:1,
              value: val,
              onChange: e => handleKey(i, e.target.value),
              onPaste: handlePaste,
              onKeyDown: handleKeyDown,
              autoFocus: i===0,
              style: boxStyle(i),
            }),
            !show && val && ce("div",{style:dotStyle(i)},
              ce("div",{style:{width:14,height:14,borderRadius:"50%",background: error?"#DC2626":BLU}})
            )
          )
        )
      ),

      // Show/hide toggle
      ce("button",{
        onClick:()=>setShow(s=>!s),
        style:{background:"none",border:"none",cursor:"pointer",color:MUT,display:"flex",alignItems:"center",gap:5,fontSize:12,padding:"2px 8px"}
      },
        ce(Ico,{name: show?"eyeoff":"eye", size:13, color:MUT}),
        show ? "Hide PIN" : "Show PIN"
      ),

      error && ce("div",{style:{color:"#DC2626",fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:5}},
        "Incorrect PIN. Try again."
      )
    ),

    // Buttons
    ce("div",{style:{display:"flex",gap:10,width:"100%"}},
      ce("button",{
        onClick:onBack,
        style:{flex:1,padding:"11px",borderRadius:10,border:"1.5px solid #DDD",background:WH,color:MUT,fontSize:14,fontWeight:500,cursor:"pointer"}
      }, "← Back"),
      ce("button",{
        onClick:submit,
        disabled: pin.join("").length<4,
        style:{flex:2,padding:"11px",borderRadius:10,border:"none",background: pin.join("").length===4 ? BLU : "#DDD",color: pin.join("").length===4 ? WH : MUT,fontSize:14,fontWeight:600,cursor: pin.join("").length===4?"pointer":"default",transition:"background .15s"}
      }, "Unlock")
    )
  );
}

// ── Login Screen ──────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [selected, setSelected] = useState(null);

  if(selected) {
    return ce("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:BG,padding:24}},
      ce(PinInput,{
        user: selected,
        onSuccess: ()=>onLogin(selected),
        onBack: ()=>setSelected(null),
      })
    );
  }

  return ce("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:BG,gap:32,padding:24}},
    ce("div",{style:{textAlign:"center"}},
      ce("h1",{style:{fontSize:26,fontWeight:800,color:BLK,letterSpacing:"-.5px"}},"Jhonatan's Task Manager"),
      ce("p",{style:{color:MUT,marginTop:6,fontSize:14}},"Select your profile to continue")
    ),
    ce("div",{style:{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center"}},
      USERS.map(u=>
        ce("button",{
          key:u.name,
          onClick:()=>setSelected(u),
          style:{background:WH,border:"1.5px solid #E2E2E0",borderRadius:16,padding:"24px 28px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:12,minWidth:130,boxShadow:"0 2px 8px rgba(0,0,0,.06)",transition:"border-color .15s, box-shadow .15s, transform .12s"}
        },
          ce("div",{style:{width:52,height:52,borderRadius:"50%",background:BLU_LT,color:BLU,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700}},
            initials(u.name)
          ),
          ce("div",{style:{fontSize:15,fontWeight:600,color:BLK}},u.name),
          ce("div",{style:{fontSize:11,color:MUT,display:"flex",alignItems:"center",gap:4}},
            ce(Ico,{name:"lock",size:11,color:MUT}), "PIN protected"
          )
        )
      )
    )
  );
}

// ── Task Modal ────────────────────────────────────────────────
function TaskModal({task,cu,onSave,onClose}){
  const ctxs = visibleCtxs(cu.access);
  const [form,setForm]=useState({
    title:task?.title||"",
    ctx:task?.ctx||ctxs[0],
    pri:task?.pri||"Medium",
    due:task?.due||"",
    status:task?.status||"To Do",
    notes:task?.notes||"",
    subtasks:task?.subtasks||[],
    recur:task?.recur||"None",
    to_user:task?.to_user||cu.name,
    shared:task?.shared||false,
  });

  function upd(k,v){setForm(f=>({...f,[k]:v}));}
  function addSub(){upd("subtasks",[...form.subtasks,{text:"",done:false}]);}
  function updSub(i,k,v){const a=[...form.subtasks];a[i]={...a[i],[k]:v};upd("subtasks",a);}
  function remSub(i){upd("subtasks",form.subtasks.filter((_,j)=>j!==i));}

  return ce("div",{onClick:onClose,style:{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}},
    ce("div",{onClick:e=>e.stopPropagation(),style:{background:WH,borderRadius:16,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 16px 48px rgba(0,0,0,.18)"}},
      // Header
      ce("div",{style:{padding:"20px 24px 16px",borderBottom:"1px solid #F0F0EF",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:WH,zIndex:1}},
        ce("h2",{style:{fontSize:17,fontWeight:700,color:BLK}}, task?"Edit Task":"New Task"),
        ce("button",{onClick:onClose,style:{background:"none",border:"none",cursor:"pointer",color:MUT,display:"flex",padding:4,borderRadius:6}}, ce(Ico,{name:"x",size:18,color:MUT}))
      ),
      // Body
      ce("div",{style:{padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}},
        // Title
        ce("div",{style:{display:"flex",flexDirection:"column",gap:5}},
          ce("label",{style:{fontSize:11,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:".4px"}},"Title"),
          ce("input",{value:form.title,onChange:e=>upd("title",e.target.value),placeholder:"Task title",style:{background:BG,border:"1.5px solid #E2E2E0",borderRadius:8,padding:"9px 12px",fontSize:14,color:BLK,outline:"none",width:"100%"}})
        ),
        // Row: Context + Priority
        ce("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}},
          ce("div",{style:{display:"flex",flexDirection:"column",gap:5}},
            ce("label",{style:{fontSize:11,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:".4px"}},"Context"),
            ce("select",{value:form.ctx,onChange:e=>upd("ctx",e.target.value),style:{background:BG,border:"1.5px solid #E2E2E0",borderRadius:8,padding:"9px 12px",fontSize:14,color:BLK,outline:"none"}},
              ctxs.map(c=>ce("option",{key:c},c))
            )
          ),
          ce("div",{style:{display:"flex",flexDirection:"column",gap:5}},
            ce("label",{style:{fontSize:11,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:".4px"}},"Priority"),
            ce("select",{value:form.pri,onChange:e=>upd("pri",e.target.value),style:{background:BG,border:"1.5px solid #E2E2E0",borderRadius:8,padding:"9px 12px",fontSize:14,color:BLK,outline:"none"}},
              PRIS.map(p=>ce("option",{key:p},p))
            )
          )
        ),
        // Row: Due + Recur
        ce("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}},
          ce("div",{style:{display:"flex",flexDirection:"column",gap:5}},
            ce("label",{style:{fontSize:11,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:".4px"}},"Due Date"),
            ce("input",{type:"date",value:form.due,onChange:e=>upd("due",e.target.value),style:{background:BG,border:"1.5px solid #E2E2E0",borderRadius:8,padding:"9px 12px",fontSize:14,color:BLK,outline:"none"}})
          ),
          ce("div",{style:{display:"flex",flexDirection:"column",gap:5}},
            ce("label",{style:{fontSize:11,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:".4px"}},"Recurring"),
            ce("select",{value:form.recur,onChange:e=>upd("recur",e.target.value),style:{background:BG,border:"1.5px solid #E2E2E0",borderRadius:8,padding:"9px 12px",fontSize:14,color:BLK,outline:"none"}},
              RECURS.map(r=>ce("option",{key:r},r))
            )
          )
        ),
        // Row: Status + Assign
        ce("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}},
          ce("div",{style:{display:"flex",flexDirection:"column",gap:5}},
            ce("label",{style:{fontSize:11,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:".4px"}},"Status"),
            ce("select",{value:form.status,onChange:e=>upd("status",e.target.value),style:{background:BG,border:"1.5px solid #E2E2E0",borderRadius:8,padding:"9px 12px",fontSize:14,color:BLK,outline:"none"}},
              COLS.map(c=>ce("option",{key:c},c))
            )
          ),
          ce("div",{style:{display:"flex",flexDirection:"column",gap:5}},
            ce("label",{style:{fontSize:11,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:".4px"}},"Assign To"),
            ce("select",{value:form.to_user,onChange:e=>upd("to_user",e.target.value),style:{background:BG,border:"1.5px solid #E2E2E0",borderRadius:8,padding:"9px 12px",fontSize:14,color:BLK,outline:"none"}},
              USERS.map(u=>ce("option",{key:u.name},u.name))
            )
          )
        ),
        // Shared toggle
        ce("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:BG,borderRadius:9,border:"1px solid #E8E8E6"}},
          ce("span",{style:{fontSize:13,fontWeight:500,color:BLK}},"Shared task (Sarah + Jhonatan)"),
          ce("label",{style:{position:"relative",width:40,height:22,cursor:"pointer"}},
            ce("input",{type:"checkbox",checked:form.shared,onChange:e=>upd("shared",e.target.checked),style:{opacity:0,width:0,height:0}}),
            ce("span",{style:{position:"absolute",inset:0,background:form.shared?BLU:"#DDD",borderRadius:11,transition:"background .15s",cursor:"pointer"}}),
            ce("span",{style:{position:"absolute",width:16,height:16,borderRadius:"50%",background:WH,top:3,left:form.shared?21:3,transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}})
          )
        ),
        // Notes
        ce("div",{style:{display:"flex",flexDirection:"column",gap:5}},
          ce("label",{style:{fontSize:11,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:".4px"}},"Notes"),
          ce("textarea",{value:form.notes,onChange:e=>upd("notes",e.target.value),rows:3,placeholder:"Optional notes...",style:{background:BG,border:"1.5px solid #E2E2E0",borderRadius:8,padding:"9px 12px",fontSize:14,color:BLK,outline:"none",resize:"vertical",width:"100%",fontFamily:"inherit"}})
        ),
        // Subtasks
        ce("div",{style:{display:"flex",flexDirection:"column",gap:8}},
          ce("label",{style:{fontSize:11,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:".4px"}},"Subtasks"),
          form.subtasks.map((s,i)=>
            ce("div",{key:i,style:{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:BG,borderRadius:8,border:"1px solid #E8E8E6"}},
              ce("input",{type:"checkbox",checked:s.done,onChange:e=>updSub(i,"done",e.target.checked),style:{width:15,height:15,accentColor:BLU,cursor:"pointer",flexShrink:0}}),
              ce("input",{value:s.text,onChange:e=>updSub(i,"text",e.target.value),placeholder:"Subtask...",style:{flex:1,background:"none",border:"none",outline:"none",fontSize:13,color:s.done?MUT:BLK,textDecoration:s.done?"line-through":"none",fontFamily:"inherit"}}),
              ce("button",{onClick:()=>remSub(i),style:{background:"none",border:"none",cursor:"pointer",color:MUT,display:"flex",padding:2,borderRadius:4}}, ce(Ico,{name:"x",size:14,color:MUT}))
            )
          ),
          ce("button",{onClick:addSub,style:{background:"none",border:"1px dashed #DDD",borderRadius:8,padding:"7px 12px",fontSize:13,color:MUT,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"border-color .12s"}},
            ce(Ico,{name:"plus",size:13,color:MUT}), "Add subtask"
          )
        )
      ),
      // Footer
      ce("div",{style:{padding:"14px 24px",borderTop:"1px solid #F0F0EF",display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:WH}},
        task && ce("button",{onClick:()=>onSave({...form,_delete:true}),style:{marginRight:"auto",padding:"8px 14px",borderRadius:8,border:"1px solid #FECACA",background:"none",color:"#DC2626",fontSize:13,fontWeight:500,cursor:"pointer"}},
          "Delete"
        ),
        ce("button",{onClick:onClose,style:{padding:"8px 16px",borderRadius:8,border:"1px solid #DDD",background:WH,color:MUT,fontSize:14,fontWeight:500,cursor:"pointer"}},"Cancel"),
        ce("button",{onClick:()=>onSave(form),style:{padding:"8px 18px",borderRadius:8,border:"none",background:BLU,color:WH,fontSize:14,fontWeight:600,cursor:"pointer"}},"Save Task")
      )
    )
  );
}

// ── Recur Modal ───────────────────────────────────────────────
function RecurModal({task,onSpawn,onArchive,onClose}){
  const nd=addInterval(task.due,task.recur);
  return ce("div",{onClick:onClose,style:{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}},
    ce("div",{onClick:e=>e.stopPropagation(),style:{background:WH,borderRadius:16,padding:28,maxWidth:400,width:"100%",boxShadow:"0 16px 48px rgba(0,0,0,.18)"}},
      ce("h3",{style:{fontSize:17,fontWeight:700,marginBottom:10,color:BLK}},"Recurring Task"),
      ce("p",{style:{fontSize:14,color:MUT,marginBottom:20,lineHeight:1.5}},
        `"${task.title}" is set to repeat ${task.recur.toLowerCase()}. What would you like to do?`
      ),
      nd && ce("p",{style:{fontSize:13,color:BLU,marginBottom:20}},"Next occurrence: "+fmtDate(nd)),
      ce("div",{style:{display:"flex",flexDirection:"column",gap:10}},
        ce("button",{onClick:onSpawn,style:{padding:"11px",borderRadius:10,border:"none",background:BLU,color:WH,fontSize:14,fontWeight:600,cursor:"pointer"}},
          "✓ Complete & schedule next"
        ),
        ce("button",{onClick:onArchive,style:{padding:"11px",borderRadius:10,border:"1px solid #DDD",background:WH,color:MUT,fontSize:14,cursor:"pointer"}},
          "Complete only (don't repeat)"
        ),
        ce("button",{onClick:onClose,style:{padding:"11px",borderRadius:10,border:"none",background:"none",color:MUT,fontSize:13,cursor:"pointer"}},
          "Cancel"
        )
      )
    )
  );
}

// ── Task Card ─────────────────────────────────────────────────
function TaskCard({task,onEdit,onComplete,onMove}){
  const cc=CTX_COLOR[task.ctx]||{bg:"#F3F4F6",tx:"#374151"};
  const done=task.status==="Done";
  const over=isOverdue(task.due)&&!done;
  const soon=isSoon(task.due)&&!done&&!over;
  const totalSub=task.subtasks?.length||0;
  const doneSub=task.subtasks?.filter(s=>s.done).length||0;
  const pct=totalSub>0?Math.round(doneSub/totalSub*100):0;

  return ce("div",{
    onClick:()=>onEdit(task),
    style:{background:WH,border:"1px solid #E8E8E6",borderRadius:10,padding:"12px 14px",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.06)",transition:"box-shadow .12s, transform .1s",position:"relative"}
  },
    // Top row
    ce("div",{style:{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}},
      ce("div",{style:{width:8,height:8,borderRadius:"50%",background:PRI_COLOR[task.pri]||MUT,flexShrink:0,marginTop:4}}),
      ce("div",{style:{flex:1,fontSize:13,fontWeight:600,color:done?MUT:BLK,lineHeight:1.4,textDecoration:done?"line-through":"none"}},task.title),
      task.status!=="Done" && ce("button",{
        onClick:e=>{e.stopPropagation();onComplete(task);},
        title:"Mark complete",
        style:{background:"none",border:"1px solid #DDD",borderRadius:6,padding:"2px 6px",cursor:"pointer",display:"flex",alignItems:"center",color:MUT,flexShrink:0}
      }, ce(Ico,{name:"check",size:13,color:MUT}))
    ),
    // Meta
    ce("div",{style:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}},
      ce("span",{style:{background:cc.bg,color:cc.tx,borderRadius:4,padding:"1px 7px",fontSize:11,fontWeight:600}},task.ctx),
      task.due && ce("span",{style:{fontSize:11,color:over?"#DC2626":soon?"#D97706":MUT,fontWeight:over||soon?600:400,display:"flex",alignItems:"center",gap:3}},
        ce(Ico,{name:"calendar",size:11,color:over?"#DC2626":soon?"#D97706":MUT}),
        fmtDate(task.due)
      ),
      task.recur!=="None" && ce("span",{style:{fontSize:10,color:MUT,background:BG,border:"1px solid #E2E2E0",borderRadius:4,padding:"1px 5px",display:"flex",alignItems:"center",gap:3}},
        ce(Ico,{name:"repeat",size:10,color:MUT}), task.recur
      ),
      task.to_user!==task.by_user && ce("span",{style:{fontSize:11,color:MUT,marginLeft:"auto"}}, "→ "+task.to_user)
    ),
    // Subtask bar
    totalSub>0 && ce("div",{style:{marginTop:8}},
      ce("div",{style:{height:3,background:"#E8E8E6",borderRadius:2,overflow:"hidden"}},
        ce("div",{style:{width:pct+"%",height:"100%",background:BLU,borderRadius:2,transition:"width .3s"}})
      ),
      ce("div",{style:{fontSize:10,color:MUT,marginTop:3}},doneSub+"/"+totalSub+" subtasks")
    )
  );
}

// ── Main App ──────────────────────────────────────────────────
function App(){
  const [cu,setCu]         = useState(null); // current user object
  const [tasks,setTasks]   = useState([]);
  const [loading,setLoading]= useState(false);
  const [modal,setModal]   = useState(false);
  const [editT,setEditT]   = useState(null);
  const [recurT,setRecurT] = useState(null);
  const [filterCtx,setFilterCtx]=useState("All");
  const [filterAsgn,setFilterAsgn]=useState("All");

  // Load tasks
  const loadTasks=useCallback(async()=>{
    if(!cu) return;
    setLoading(true);
    const {data}=await sb.from("tasks").select("*").order("created_at",{ascending:false});
    setLoading(false);
    if(data){
      const ctxs=visibleCtxs(cu.access);
      setTasks(data.filter(t=>ctxs.includes(t.ctx)||(t.shared&&(cu.name==="Jhonatan"||cu.name==="Sarah"))));
    }
  },[cu]);

  useEffect(()=>{ loadTasks(); },[loadTasks]);

  // Real-time
  useEffect(()=>{
    if(!cu) return;
    const ch=sb.channel("tasks-rt").on("postgres_changes",{event:"*",schema:"public",table:"tasks"},()=>loadTasks()).subscribe();
    return ()=>{ sb.removeChannel(ch); };
  },[cu,loadTasks]);

  async function saveTask(form){
    if(form._delete){
      await sb.from("tasks").delete().eq("id",editT.id);
    } else {
      const row={title:form.title,ctx:form.ctx,pri:form.pri,due:form.due||null,status:form.status,notes:form.notes||null,subtasks:form.subtasks,recur:form.recur,by_user:cu.name,to_user:form.to_user,shared:form.shared};
      if(editT){ await sb.from("tasks").update(row).eq("id",editT.id); }
      else { await sb.from("tasks").insert([row]); }
    }
    setModal(false); setEditT(null); loadTasks();
  }

  async function moveTask(id,status){ await sb.from("tasks").update({status}).eq("id",id); loadTasks(); }

  async function completeTask(task){
    if(task.recur!=="None"){ setRecurT(task); }
    else { await moveTask(task.id,"Done"); }
  }

  async function spawnNext(){
    const t=recurT;
    const nd=addInterval(t.due,t.recur);
    await sb.from("tasks").update({status:"Done"}).eq("id",t.id);
    if(nd){
      await sb.from("tasks").insert([{...t,id:undefined,status:"To Do",due:nd,created_at:undefined,subtasks:t.subtasks.map(s=>({...s,done:false}))}]);
    }
    setRecurT(null); loadTasks();
  }

  if(!cu){
    return ce(LoginScreen,{onLogin:user=>setCu(user)});
  }

  const ctxs=["All",...visibleCtxs(cu.access)];
  const asgnOpts=["All","Mine","Assigned by me"];

  let visible=tasks;
  if(filterCtx!=="All") visible=visible.filter(t=>t.ctx===filterCtx);
  if(filterAsgn==="Mine") visible=visible.filter(t=>t.to_user===cu.name);
  if(filterAsgn==="Assigned by me") visible=visible.filter(t=>t.by_user===cu.name&&t.to_user!==cu.name);

  const openCnt=tasks.filter(t=>t.status!=="Done").length;
  const mineCnt=tasks.filter(t=>t.to_user===cu.name&&t.status!=="Done").length;

  return ce("div",{style:{minHeight:"100vh",background:BG,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}},
    // Header
    ce("div",{style:{background:WH,borderBottom:"1px solid #E8E8E6",padding:"0 20px",height:56,display:"flex",alignItems:"center",gap:14,position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 0 #E8E8E6"}},
      ce("h1",{style:{fontSize:17,fontWeight:800,color:BLK,letterSpacing:"-.3px",whiteSpace:"nowrap"}},"Task Manager"),
      ce("div",{style:{display:"flex",gap:6}},
        ce("div",{style:{background:BG,border:"1px solid #DDD",borderRadius:20,padding:"2px 10px",fontSize:12,color:MUT}},
          ce("span",{style:{fontWeight:700,color:BLK}},openCnt)," open"
        ),
        ce("div",{style:{background:"#E0F7EE",border:"1px solid #86EFAC",borderRadius:20,padding:"2px 10px",fontSize:12,color:"#15803D"}},
          ce("span",{style:{fontWeight:700}},mineCnt)," mine"
        )
      ),
      ce("div",{style:{flex:1}}),
      // Context filters
      ce("div",{style:{display:"flex",gap:5,overflowX:"auto"}},
        ctxs.map(c=>ce("button",{key:c,onClick:()=>setFilterCtx(c),style:{padding:"4px 11px",borderRadius:20,fontSize:12,fontWeight:filterCtx===c?600:400,border:filterCtx===c?"1.5px solid "+BLU:"1px solid #DDD",background:filterCtx===c?BLU_LT:WH,color:filterCtx===c?BLU:MUT,cursor:"pointer",whiteSpace:"nowrap"}},c))
      ),
      // Assign filter
      ce("select",{value:filterAsgn,onChange:e=>setFilterAsgn(e.target.value),style:{padding:"5px 10px",borderRadius:8,border:"1px solid #DDD",background:WH,fontSize:12,color:MUT,outline:"none"}},
        asgnOpts.map(o=>ce("option",{key:o},o))
      ),
      // Add task
      ce("button",{onClick:()=>{setEditT(null);setModal(true);},style:{background:BLU,border:"none",borderRadius:9,padding:"7px 14px",color:WH,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}},
        ce(Ico,{name:"plus",size:14,color:WH}),"New Task"
      ),
      // User chip
      ce("div",{style:{display:"flex",alignItems:"center",gap:7,background:BG,border:"1px solid #DDD",borderRadius:20,padding:"4px 12px 4px 6px",cursor:"pointer"},onClick:()=>setCu(null)},
        ce("div",{style:{width:26,height:26,borderRadius:"50%",background:BLU_LT,color:BLU,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}},initials(cu.name)),
        ce("span",{style:{fontSize:13,fontWeight:500,color:BLK}},cu.name),
        ce(Ico,{name:"logout",size:13,color:MUT})
      )
    ),

    // Board
    ce("div",{style:{padding:20,display:"flex",gap:14,alignItems:"flex-start",overflowX:"auto"}},
      COLS.map(col=>{
        const cm=CC[col];
        const items=visible.filter(t=>t.status===col);
        return ce("div",{key:col,style:{flex:1,minWidth:270,background:BG,borderRadius:12,border:"1px solid #E2E2E0"}},
          // Column header
          ce("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px 10px",borderBottom:"1px solid #E8E8E6"}},
            ce("span",{style:{fontSize:12,fontWeight:700,color:cm.hd,textTransform:"uppercase",letterSpacing:".4px"}},col),
            ce("span",{style:{background:cm.bg,color:cm.hd,border:"1px solid "+cm.bd,borderRadius:20,padding:"1px 8px",fontSize:12,fontWeight:600}},items.length)
          ),

          // Cards
          ce("div",{style:{padding:"0 10px 10px",display:"flex",flexDirection:"column",gap:8}},
            items.length===0
              ? ce("div",{style:{padding:20,textAlign:"center",color:MUT,fontSize:13}},col==="Done"?"No completed tasks":"No tasks here")
              : items.map(t=>ce(TaskCard,{key:t.id,task:t,onEdit:t2=>{setEditT(t2);setModal(true);},onComplete:completeTask,onMove:moveTask}))
          ),
          // Add button
          col!=="Done" && ce("button",{
            onClick:()=>{setEditT(null);setModal(true);},
            style:{margin:"0 10px 10px",padding:"8px",border:"1.5px dashed #DDD",borderRadius:9,background:"none",color:MUT,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,width:"calc(100% - 20px)",transition:"border-color .12s, color .12s"}
          }, ce(Ico,{name:"plus",size:13,color:MUT}),"Add task")
        );
      })
    ),

    // Modals
    modal && ce(TaskModal,{task:editT,cu,onSave:saveTask,onClose:()=>{setModal(false);setEditT(null);}}),
    recurT && ce(RecurModal,{task:recurT,onSpawn:spawnNext,onArchive:async()=>{await moveTask(recurT.id,"Done");setRecurT(null);},onClose:()=>setRecurT(null)})
  );
}

// ── Column header fix — wrap in clean component ───────────────
function ColHeader({col}){
  const cm=CC[col];
  return null; // handled inline above
}

ReactDOM.createRoot(document.getElementById("root")).render(ce(App,null));
