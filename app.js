import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://iqrmllibwsoflahhueil.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WFUKG-wGuCNLSBrLKD5q7A_xTMIzI4Z";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const authShell = document.getElementById("authShell");
const appShell = document.getElementById("appShell");
const $ = id => document.getElementById(id);
const slides = [
 {kicker:"START WITH CLARITY",title:"Learn how markets move",text:"Get comfortable with price action, market terminology and the ideas behind trading."},
 {kicker:"PRACTISE WITHOUT PRESSURE",title:"Explore with virtual funds",text:"Use a simulated learning balance to understand how a practice portfolio is organised."},
 {kicker:"TURN CURIOSITY INTO SKILL",title:"Study market scenarios",text:"Explore chart concepts, watchlists and educational signal studies at your own pace."}
];
let currentSlide=0, authMode="login", currentUser=null;
const completed=new Set();
function renderSlide(){const s=slides[currentSlide];$("slideKicker").textContent=s.kicker;$("slideTitle").textContent=s.title;$("slideText").textContent=s.text;document.querySelectorAll(".dot").forEach((d,i)=>d.classList.toggle("active",i===currentSlide));}
function message(text,kind=""){const el=$("formMessage");el.textContent=text;el.className="form-message"+(kind?" "+kind:"");}
function setMode(mode){authMode=mode;document.querySelectorAll(".auth-tab").forEach(t=>t.classList.toggle("active",t.dataset.mode===mode));$("fullNameGroup").classList.toggle("hidden",mode!=="signup");$("fullName").required=mode==="signup";$("legalConsentGroup").classList.toggle("hidden",mode!=="signup");$("legalConsent").required=mode==="signup";if(mode!=="signup")$("legalConsent").checked=false;$("forgotLink").classList.toggle("hidden",mode==="signup");$("authTitle").textContent=mode==="login"?"Good to have you back.":"Create your learning account.";$("authSubtitle").textContent=mode==="login"?"Log in to continue your learning journey.":"Join Trader and save your learning progress.";$("submitText").textContent=mode==="login"?"Log in to Trader":"Create my account";$("password").autocomplete=mode==="login"?"current-password":"new-password";message("");}
function showAuth(){appShell.classList.add("hidden");authShell.classList.remove("hidden");}
function renderProgress(){$("lessonCount").innerHTML=completed.size+" <small>/ 8</small>";document.querySelectorAll("[data-lesson]").forEach(b=>{const done=completed.has(Number(b.dataset.lesson));b.classList.toggle("done",done);b.innerHTML=done?'Review lesson <span>✓</span>':'Open lesson <span>→</span>';});}
async function loadLearnerData(user){const fullName=user.user_metadata?.full_name||user.email?.split("@")[0]||"Trader";const {data:profile,error:pe}=await supabase.from("profiles").upsert({id:user.id,full_name:fullName,email:user.email},{onConflict:"id"}).select("display_name,full_name,email").single();if(pe)console.warn(pe.message);const name=(profile?.display_name||profile?.full_name||user.user_metadata?.full_name||fullName||"Trader").trim();$("profileEmail").textContent=name;$("welcomeName").textContent=name.split(/\s+/)[0];document.querySelectorAll(".avatar").forEach(el=>{el.textContent=(name.match(/[\p{L}\p{N}]/u)||["T"])[0].toUpperCase();el.setAttribute("aria-label",name+" account");});const {data:portfolios,error:portfolioError}=await supabase.from("paper_portfolios").select("id,market_type").eq("user_id",user.id);if(portfolioError)console.warn(portfolioError.message);else if(!portfolios?.length){const {error:createError}=await supabase.from("paper_portfolios").insert([{user_id:user.id,market_type:"forex",starting_balance:10000,cash_balance:10000,currency:"USD",name:"Forex Paper Portfolio"},{user_id:user.id,market_type:"crypto",starting_balance:10000,cash_balance:10000,currency:"USD",name:"Crypto Paper Portfolio"}]);if(createError)console.warn(createError.message);}completed.clear();const {data:rows,error}=await supabase.from("lesson_progress").select("lesson_id").eq("user_id",user.id);if(error)console.error(error.message);else(rows||[]).forEach(r=>completed.add(Number(r.lesson_id)));renderProgress();}
async function enterApp(user){if(currentUser?.id===user.id&&!appShell.classList.contains("hidden"))return;currentUser=user;authShell.classList.add("hidden");appShell.classList.remove("hidden");await loadLearnerData(user);}
function showPage(page){document.querySelectorAll(".page-view").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));document.querySelectorAll(".nav-link[data-page]").forEach(n=>n.classList.toggle("active",n.dataset.page===page));$("pageName").textContent=({overview:"Overview",markets:"Market watch",practice:"Paper practice",signals:"Trading signals",bot:"Bot Lab",learn:"Learning hub"})[page]||"Overview";if(page==="signals")renderMarketChart();window.scrollTo({top:0,behavior:"smooth"});}
const marketNames={"FX:EURUSD":"EUR / USD","FX:GBPUSD":"GBP / USD","FX:USDJPY":"USD / JPY","FX:AUDUSD":"AUD / USD","FX:USDCHF":"USD / CHF","FX:USDCAD":"USD / CAD","FX:NZDUSD":"NZD / USD","OANDA:XAUUSD":"Gold / USD","OANDA:XAGUSD":"Silver / USD","BINANCE:BTCUSDT":"Bitcoin / USDT","BINANCE:ETHUSDT":"Ethereum / USDT","BINANCE:SOLUSDT":"Solana / USDT","BINANCE:BNBUSDT":"BNB / USDT","BINANCE:XRPUSDT":"XRP / USDT","BINANCE:ADAUSDT":"Cardano / USDT","BINANCE:DOGEUSDT":"Dogecoin / USDT"};
let chartLoadToken=0;
function renderMarketChart(symbol){const selected=symbol||$("marketSymbol").value;const interval=$("marketInterval").value;const box=$("tvChartContainer");if(!box)return;const token=++chartLoadToken;box.innerHTML="";$("chartAssetTitle").textContent=marketNames[selected]||selected;$("marketSymbol").value=marketNames[selected]?selected:$("marketSymbol").value;const script=document.createElement("script");script.type="text/javascript";script.async=true;script.src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";script.innerHTML=JSON.stringify({autosize:true,symbol:selected,interval,timezone:"Etc/UTC",theme:"dark",style:"1",locale:"en",allow_symbol_change:true,calendar:false,details:false,hotlist:false,hide_side_toolbar:false,withdateranges:true,save_image:false,studies:["STD;RSI","STD;MACD","STD;Bollinger Bands"],support_host:"https://www.tradingview.com"});if(token===chartLoadToken)box.appendChild(script);}
$("marketSymbol").addEventListener("change",()=>renderMarketChart());
$("marketInterval").addEventListener("change",()=>renderMarketChart());
$("loadCustomSymbol").addEventListener("click",()=>{const value=$("customSymbol").value.trim().toUpperCase();if(!value)return;$("marketSymbol").value="";renderMarketChart(value);});
$("customSymbol").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("loadCustomSymbol").click();}});

document.querySelectorAll(".dot").forEach(d=>d.addEventListener("click",()=>{currentSlide=Number(d.dataset.slide);renderSlide();}));
$("nextSlide").addEventListener("click",()=>{currentSlide=(currentSlide+1)%slides.length;renderSlide();});$("prevSlide").addEventListener("click",()=>{currentSlide=(currentSlide+slides.length-1)%slides.length;renderSlide();});
document.querySelectorAll(".auth-tab").forEach(t=>t.addEventListener("click",()=>setMode(t.dataset.mode)));
const signupFormOpenedAt=Date.now();
$("togglePassword").addEventListener("click",()=>{const p=$("password");p.type=p.type==="password"?"text":"password";$("togglePassword").textContent=p.type==="password"?"Show":"Hide";});
$("authForm").addEventListener("submit",async e=>{e.preventDefault();const email=$("email").value.trim().toLowerCase(),password=$("password").value,fullName=$("fullName").value.trim();if(!email||password.length<8)return message("Enter a valid email and a password with at least 8 characters.","error");if(authMode==="signup"&&!fullName)return message("Please enter your name.","error");if(authMode==="signup"&&!$("legalConsent").checked)return message("Please agree to the Terms and acknowledge the Privacy Policy before creating your account.","error");if(authMode==="signup"&&$("website").value.trim())return message("We could not verify this registration. Please try again.","error");if(authMode==="signup"&&Date.now()-signupFormOpenedAt<2500)return message("Please take a moment to complete the registration form, then try again.","error");const btn=$("authForm").querySelector('button[type="submit"]');btn.disabled=true;message(authMode==="signup"?"Creating your secure account…":"Checking your details…");try{if(authMode==="signup"){const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName,terms_accepted_at:new Date().toISOString(),terms_version:"2026-11-20",privacy_version:"2026-11-20"},emailRedirectTo:"https://orezimeokelezo.github.io/Trader/app.html"}});if(error)throw error;if(data.session&&data.user){message("Account created. Welcome to Trader.","success");await enterApp(data.user);}else{setMode("login");message("Account created. Check your email for the verification link, then log in.","success");}}else{const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;if(data.user)await enterApp(data.user);}}catch(err){message(err.message||"We could not complete that request. Please try again.","error");}finally{btn.disabled=false;$("submitText").textContent=authMode==="signup"?"Create my account":"Log in to Trader";}});
$("forgotLink").addEventListener("click",async e=>{e.preventDefault();const email=$("email").value.trim().toLowerCase();if(!email)return message("Enter your email address first, then choose Forgot password.","error");const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:"https://orezimeokelezo.github.io/Trader/app.html"});message(error?error.message:"If an account exists for that email, a password reset link has been sent.",error?"error":"success");});

/* Functional profile menu and lesson reader */
const profileMore=document.querySelector(".profile-mini .more");
if(profileMore){
 profileMore.setAttribute("role","button");profileMore.setAttribute("tabindex","0");profileMore.setAttribute("aria-label","More account options");
 const menu=document.createElement("div");menu.className="profile-menu hidden";menu.innerHTML='<button data-menu-action="profile">My profile</button><button data-menu-action="settings">Account settings</button><button data-menu-action="help">Help & learning guide</button><button data-menu-action="logout">Log out</button>';
 profileMore.parentElement.appendChild(menu);
 const toggleMenu=()=>menu.classList.toggle("hidden");
 profileMore.addEventListener("click",e=>{e.stopPropagation();toggleMenu();});
 profileMore.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();toggleMenu();}});
 document.addEventListener("click",e=>{if(!menu.contains(e.target)&&e.target!==profileMore)menu.classList.add("hidden");});
 menu.addEventListener("click",e=>{const action=e.target.closest("[data-menu-action]")?.dataset.menuAction;if(!action)return;menu.classList.add("hidden");if(action==="logout")$("logoutBtn").click();else if(action==="profile")showProfilePanel();else if(action==="settings")showProfilePanel("Account settings");else showProfilePanel("Help & learning guide");});
}
function showProfilePanel(title="My profile"){
 let modal=document.getElementById("traderInfoModal");if(!modal){modal=document.createElement("div");modal.id="traderInfoModal";modal.className="trader-modal";modal.innerHTML='<div class="trader-modal-card" role="dialog" aria-modal="true"><button class="modal-close" aria-label="Close">×</button><div class="eyebrow">TRADER ACCOUNT</div><h2 class="modal-title"></h2><p class="modal-copy"></p><button class="primary-btn modal-ok">Done</button></div>';document.body.appendChild(modal);modal.querySelector(".modal-close").onclick=()=>modal.classList.remove("open");modal.querySelector(".modal-ok").onclick=()=>modal.classList.remove("open");modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open");});}
 modal.querySelector(".modal-title").textContent=title;modal.querySelector(".modal-copy").textContent=title==="Help & learning guide"?"Use the Market Watch to explore labelled sample data, Trading Signals to open TradingView charts, Paper Practice for simulated learning, and the Learning Hub for short lessons. No real-money orders are available.":title==="Account settings"?"Your account is secured by Supabase Authentication. To change your name or password, use the account profile and password-reset options provided by your sign-in service.":"Signed in as "+(currentUser?.email||"your Trader account")+". Your learning progress is saved to your account.";modal.classList.add("open");
}
const lessonContent=[
["What is a financial market?","A financial market is a place or system where participants exchange assets such as currencies, shares, bonds, commodities or digital assets. Prices change as buyers and sellers express different expectations.","Key idea","A quoted price is the point where a buyer and seller are willing to transact, subject to the venue and its rules."],
["Reading candlesticks","A candle summarises price movement over a chosen period. Its body shows the open and close. Its upper and lower wicks show the highest and lowest traded prices in that period.","Remember OHLC","Open, High, Low and Close describe the four key values. A candle alone does not reveal everything that happened inside the period."],
["Bid, ask and spread","The bid is the price buyers are offering; the ask is the price sellers are requesting. The spread is the difference between them.","Simple example","If a quote shows 1.1000 bid and 1.1002 ask, the spread is 0.0002. Costs and quote conventions vary by market."],
["Trends and ranges","A trend describes a sustained directional sequence in price. A range describes price moving back and forth within an area. Neither condition is guaranteed to continue.","Study question","What evidence would show that the market condition has changed? Avoid treating a visual pattern as certainty."],
["Support and resistance","Support and resistance are areas where price has previously paused, reacted or changed direction. They are zones for study, not precise barriers.","Important limitation","A level can fail. News, liquidity and changing participation can move price through an area."],
["Risk and position sizing","Risk management is about limiting the impact of an incorrect assumption. A position's size, possible loss, costs and market volatility all matter.","Practice principle","In a simulator, record the hypothetical risk before an example trade and review whether the plan was followed."],
["Keeping a learning journal","A journal records the date, market, timeframe, observation, reason for the idea and what happened afterwards. It helps separate a repeatable process from hindsight.","Journal prompt","Write what you expected, what would prove you wrong, and what you learned after reviewing the chart."],
["Bias and decision-making","People can become attached to a prediction, notice only confirming evidence or feel pressure after a recent result. These thinking patterns can distort judgement.","Pause and check","List one piece of evidence against your idea as well as evidence supporting it. Uncertainty is part of market study."]
];
function openLesson(id){
 const lesson=lessonContent[id];if(!lesson)return;let modal=document.getElementById("lessonReader");if(!modal){modal=document.createElement("div");modal.id="lessonReader";modal.className="trader-modal";modal.innerHTML='<article class="trader-modal-card lesson-reader-card" role="dialog" aria-modal="true"><button class="modal-close" aria-label="Close">×</button><div class="eyebrow">LEARNING HUB · LESSON</div><span class="lesson-number modal-lesson-number"></span><h2 class="modal-title"></h2><p class="modal-copy"></p><div class="lesson-takeaway"><b></b><p></p></div><button class="primary-btn lesson-complete-btn">Mark lesson complete</button></article>';document.body.appendChild(modal);modal.querySelector(".modal-close").onclick=()=>modal.classList.remove("open");modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open");});}
 modal.querySelector(".modal-lesson-number").textContent=String(id+1).padStart(2,"0");modal.querySelector(".modal-title").textContent=lesson[0];modal.querySelector(".modal-copy").textContent=lesson[1];modal.querySelector(".lesson-takeaway b").textContent=lesson[2];modal.querySelector(".lesson-takeaway p").textContent=lesson[3];const done=completed.has(id),btn=modal.querySelector(".lesson-complete-btn");btn.textContent=done?"Completed ✓":"Mark lesson complete";btn.disabled=done;btn.onclick=async()=>{if(!currentUser)return;const {error}=await supabase.from("lesson_progress").upsert({user_id:currentUser.id,lesson_id:id,completed_at:new Date().toISOString()},{onConflict:"user_id,lesson_id"});if(error){console.error(error.message);return;}completed.add(id);renderProgress();btn.textContent="Completed ✓";btn.disabled=true;};modal.classList.add("open");
}
document.querySelectorAll(".learning-card").forEach(card=>{const button=card.querySelector("[data-lesson]");if(!button)return;const id=Number(button.dataset.lesson);card.classList.add("lesson-card-clickable");card.setAttribute("tabindex","0");card.setAttribute("role","button");card.setAttribute("aria-label","Open lesson: "+(card.querySelector("h3")?.textContent||"lesson"));card.addEventListener("click",e=>{if(e.target.closest("[data-lesson]"))return;openLesson(id);});card.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target===card){e.preventDefault();openLesson(id);}});button.textContent="Open lesson";button.querySelector("span")?.remove();button.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openLesson(id);});});

document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
$("logoutBtn").addEventListener("click",async()=>{const {error}=await supabase.auth.signOut();if(error)message(error.message,"error");currentUser=null;showAuth();});
document.querySelectorAll("[data-lesson]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openLesson(Number(b.dataset.lesson));}));
document.querySelectorAll("[data-study]").forEach(b=>b.addEventListener("click",()=>{showPage("signals");const match=Object.keys(marketNames).find(key=>key.includes(b.dataset.study.toUpperCase().replace("/",""))||marketNames[key].toUpperCase().includes(b.dataset.study.toUpperCase()));if(match){$("marketSymbol").value=match;renderMarketChart(match);}}));
supabase.auth.onAuthStateChange((event,session)=>{if(session?.user&&["SIGNED_IN","INITIAL_SESSION"].includes(event)){const user=session.user;queueMicrotask(()=>{enterApp(user).catch(err=>console.error("Could not load Trader session:",err));});}else if(event==="SIGNED_OUT"){currentUser=null;showAuth();}});
const {data:{session}}=await supabase.auth.getSession();if(session?.user)await enterApp(session.user);
if(new URLSearchParams(window.location.search).get("mode")==="signup")setMode("signup");
renderSlide();
const botFileInput=$("botCsvFile");
function parseBotCsv(text){
 const lines=text.trim().split(/\r?\n/);
 if(lines.length<61)throw new Error("Please upload a CSV containing at least 60 candle rows plus a header.");
 const headers=lines[0].split(",").map(x=>x.trim().toLowerCase());
 const required=["timestamp","open","high","low","close"];
 for(const name of required)if(!headers.includes(name))throw new Error("CSV is missing the required column: "+name);
 const candles=lines.slice(1).filter(Boolean).map((line,index)=>{
  const cells=line.split(",");
  const row={};headers.forEach((key,i)=>row[key]=cells[i]?.trim());
  const candle={timestamp:row.timestamp,open:Number(row.open),high:Number(row.high),low:Number(row.low),close:Number(row.close),volume:Number(row.volume||0)};
  if(!candle.timestamp||![candle.open,candle.high,candle.low,candle.close,candle.volume].every(Number.isFinite))throw new Error("Invalid candle values on CSV row "+(index+2));
  if(candle.open<=0||candle.high<=0||candle.low<=0||candle.close<=0||candle.volume<0||candle.high<Math.max(candle.open,candle.close,candle.low)||candle.low>Math.min(candle.open,candle.close,candle.high))throw new Error("Invalid OHLC values on CSV row "+(index+2));
  return candle;
 });
 return candles;
}
function showBotMessage(text,error=false){const el=$("botRunMessage");el.textContent=text;el.className="bot-run-message"+(error?" error":"");}
function renderBotResult(result){
 $("botResults").hidden=false;
 $("botResultTitle").textContent=result.symbol+" · "+result.timeframe+" · "+result.market.toUpperCase();
 const metrics=[["Ending balance",result.ending_balance],["Net result",result.net_profit],["Return",result.net_return_pct+"%"],["Trades",result.trade_count],["Win rate",result.win_rate_pct+"%"],["Max drawdown",result.max_drawdown_pct+"%"]];
 $("botMetrics").innerHTML=metrics.map(([label,value])=>'<div class="bot-metric"><span>'+label+'</span><b>'+value+'</b></div>').join("");
 $("botRiskSummary").innerHTML='<p>Risk budget: <b>'+result.risk_controls.risk_per_trade_pct+'%</b> per simulated position</p><p>Daily stop: <b>'+result.risk_controls.daily_loss_limit_pct+'%</b></p><p>Max drawdown stop: <b>'+result.risk_controls.max_drawdown_pct+'%</b></p><p>Leverage cap: <b>'+result.risk_controls.max_leverage+'x</b></p><p>Mode: <b>PAPER ONLY</b></p>';
 $("botTradeRows").innerHTML=result.trades.length?result.trades.slice().reverse().map(t=>'<tr><td>'+t.side+'</td><td>'+t.entry_price+'</td><td>'+t.exit_price+'</td><td>'+t.net_pnl+'</td><td>'+t.exit_reason+'</td></tr>').join(""):'<tr><td colspan="5">No simulated trades were generated for this sample.</td></tr>';
}

async function persistPaperReplayAndNotify(result){
 if(!currentUser?.id)throw new Error("Please sign in again before saving paper results.");
 const {data:portfolios,error:portfolioError}=await supabase.from("paper_portfolios").select("id,market_type").eq("user_id",currentUser.id);
 if(portfolioError)throw new Error("Could not load your paper portfolios: "+portfolioError.message);
 const portfolio=portfolios?.find(p=>p.market_type===result.market);
 if(!portfolio)throw new Error("No "+result.market+" paper portfolio was found. Refresh your account and try again.");
 const trades=Array.isArray(result.trades)?result.trades:[];
 if(!trades.length){
  const {error}=await supabase.functions.invoke("telegram-notify",{body:{message:"TRADER · PAPER REPLAY\n"+result.symbol+" · "+result.timeframe+"\nNo simulated entry events were generated for this historical sample.\nNo live orders were sent."}});
  if(error)throw new Error("Replay completed, but Telegram notification failed: "+error.message);
  return;
 }
 const rows=trades.map(t=>({
  user_id:currentUser.id,
  portfolio_id:portfolio.id,
  market_type:result.market,
  symbol:result.symbol,
  timeframe:result.timeframe,
  side:String(t.side||"").toLowerCase(),
  quantity:t.quantity,
  entry_price:t.entry_price,
  exit_price:t.exit_price,
  fees:t.fees||0,
  pnl:t.net_pnl,
  status:"closed",
  strategy_label:result.strategy||"Educational paper replay",
  notes:"Historical CSV paper replay only. Exit reason: "+String(t.exit_reason||"end_of_data"),
  opened_at:t.entry_time,
  closed_at:t.exit_time
 }));
 const {error:saveError}=await supabase.from("paper_trades").insert(rows);
 if(saveError)throw new Error("Replay completed, but saving simulated trades failed: "+saveError.message);
 const lines=trades.slice(0,10).map((t,i)=>
  (i+1)+". "+String(t.side).toUpperCase()+" · "+result.symbol+
  "\nEntry: "+t.entry_price+" ("+t.entry_time+")"+
  "\nExit: "+t.exit_price+" ("+t.exit_time+")"+
  "\nNet P&L: "+Number(t.net_pnl).toFixed(2)+" USD · "+String(t.exit_reason||"closed")
 );
 const omitted=trades.length>10?"\n…plus "+(trades.length-10)+" additional simulated trades saved in Trader.":"";
 const message="TRADER · PAPER SIGNAL & TRADE REPORT\n"+
  "Historical replay only · "+result.market.toUpperCase()+" · "+result.symbol+" · "+result.timeframe+
  "\nStrategy study: "+(result.strategy||"EMA/RSI study")+
  "\nSimulated positions: "+trades.length+
  "\nNet result: "+Number(result.net_profit).toFixed(2)+" USD"+
  "\nEnding virtual balance: "+Number(result.ending_balance).toFixed(2)+" USD"+
  "\n\nENTRY / EXIT EVENTS\n"+lines.join("\n\n")+omitted+
  "\n\nEducational historical simulation. Not a live signal or financial advice. No real orders were placed.";
 const {error:notifyError}=await supabase.functions.invoke("telegram-notify",{body:{message}});
 if(notifyError)throw new Error("Paper trades were saved, but Telegram delivery failed: "+notifyError.message);
}
$("runBotBacktest").addEventListener("click",async()=>{
 const file=botFileInput.files?.[0];
 if(!file)return showBotMessage("Choose a historical OHLCV CSV file first.",true);
 if(file.size>5*1024*1024)return showBotMessage("CSV is larger than 5 MB. Please use a smaller historical sample.",true);
 const apiUrl=$("botApiUrl").value.trim().replace(/\/$/,"");
 if(!/^https?:\/\//i.test(apiUrl))return showBotMessage("Enter a valid API URL, for example http://127.0.0.1:8000.",true);
 const balance=Number($("botBalance").value),riskPct=Number($("botRisk").value);
 if(!(balance>=100&&balance<=1000000)||!(riskPct>=0.1&&riskPct<=2))return showBotMessage("Check the virtual balance and risk budget values.",true);
 const button=$("runBotBacktest");button.disabled=true;showBotMessage("Reading candles and running the paper simulation…");
 try{
  const candles=parseBotCsv(await file.text());
  if(candles.length>100000)throw new Error("Please limit each backtest to 100,000 candles.");
  const body={market:$("botMarket").value,symbol:$("botSymbol").value.trim().toUpperCase(),timeframe:$("botTimeframe").value,candles,risk:{starting_balance:balance,risk_per_trade_pct:riskPct}};
  if(!body.symbol)throw new Error("Enter a symbol such as EURUSD or BTC/USDT.");
  const response=await fetch(apiUrl+"/paper/replay",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await response.json();
  if(!response.ok)throw new Error(data.detail||"Paper engine returned an error.");
  renderBotResult(data);
  showBotMessage("Simulation completed. Saving paper-trade history and sending Telegram report…");
  await persistPaperReplayAndNotify(data);
  showBotMessage("Simulation saved to Supabase and Telegram report delivered. No live orders were sent.");
 }catch(error){showBotMessage(error.message||"Could not run the simulation. Check the API server and CSV file.",true);}
 finally{button.disabled=false;}
});
