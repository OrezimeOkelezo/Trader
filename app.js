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
function setMode(mode){authMode=mode;document.querySelectorAll(".auth-tab").forEach(t=>t.classList.toggle("active",t.dataset.mode===mode));$("fullNameGroup").classList.toggle("hidden",mode!=="signup");$("fullName").required=mode==="signup";$("forgotLink").classList.toggle("hidden",mode==="signup");$("authTitle").textContent=mode==="login"?"Good to have you back.":"Create your learning account.";$("authSubtitle").textContent=mode==="login"?"Log in to continue your learning journey.":"Join Trader and save your learning progress.";$("submitText").textContent=mode==="login"?"Log in to Trader":"Create my account";$("password").autocomplete=mode==="login"?"current-password":"new-password";message("");}
function showAuth(){appShell.classList.add("hidden");authShell.classList.remove("hidden");}
function renderProgress(){$("lessonCount").innerHTML=completed.size+" <small>/ 8</small>";document.querySelectorAll("[data-lesson]").forEach(b=>{const done=completed.has(Number(b.dataset.lesson));b.classList.toggle("done",done);b.innerHTML=done?'Completed <span>✓</span>':'Mark complete <span>→</span>';});}
async function loadLearnerData(user){const fullName=user.user_metadata?.full_name||user.email?.split("@")[0]||"Trader";const {data:profile,error:pe}=await supabase.from("profiles").upsert({id:user.id,full_name:fullName,email:user.email},{onConflict:"id"}).select("full_name,email").single();if(pe)console.warn(pe.message);const name=profile?.full_name||fullName;$("profileEmail").textContent=user.email||"Trader learner";$("welcomeName").textContent=name.trim().split(/\s+/)[0];const {data:portfolios,error:portfolioError}=await supabase.from("paper_portfolios").select("id,market_type").eq("user_id",user.id);if(portfolioError)console.warn(portfolioError.message);else if(!portfolios?.length){const {error:createError}=await supabase.from("paper_portfolios").insert([{user_id:user.id,market_type:"forex"},{user_id:user.id,market_type:"crypto"}]);if(createError)console.warn(createError.message);}completed.clear();const {data:rows,error}=await supabase.from("lesson_progress").select("lesson_id").eq("user_id",user.id);if(error)console.error(error.message);else(rows||[]).forEach(r=>completed.add(Number(r.lesson_id)));renderProgress();}
async function enterApp(user){currentUser=user;authShell.classList.add("hidden");appShell.classList.remove("hidden");await loadLearnerData(user);}
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
$("togglePassword").addEventListener("click",()=>{const p=$("password");p.type=p.type==="password"?"text":"password";$("togglePassword").textContent=p.type==="password"?"Show":"Hide";});
$("authForm").addEventListener("submit",async e=>{e.preventDefault();const email=$("email").value.trim().toLowerCase(),password=$("password").value,fullName=$("fullName").value.trim();if(!email||password.length<8)return message("Enter a valid email and a password with at least 8 characters.","error");if(authMode==="signup"&&!fullName)return message("Please enter your name.","error");const btn=$("authForm").querySelector('button[type="submit"]');btn.disabled=true;message(authMode==="signup"?"Creating your secure account…":"Checking your details…");try{if(authMode==="signup"){const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName},emailRedirectTo:"https://orezimeokelezo.github.io/Trader/"}});if(error)throw error;if(data.session&&data.user){message("Account created. Welcome to Trader.","success");await enterApp(data.user);}else{setMode("login");message("Account created. Check your email for the verification link, then log in.","success");}}else{const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;if(data.user)await enterApp(data.user);}}catch(err){message(err.message||"We could not complete that request. Please try again.","error");}finally{btn.disabled=false;$("submitText").textContent=authMode==="signup"?"Create my account":"Log in to Trader";}});
$("forgotLink").addEventListener("click",async e=>{e.preventDefault();const email=$("email").value.trim().toLowerCase();if(!email)return message("Enter your email address first, then choose Forgot password.","error");const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:"https://orezimeokelezo.github.io/Trader/"});message(error?error.message:"If an account exists for that email, a password reset link has been sent.",error?"error":"success");});
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
$("logoutBtn").addEventListener("click",async()=>{const {error}=await supabase.auth.signOut();if(error)message(error.message,"error");currentUser=null;showAuth();});
document.querySelectorAll("[data-lesson]").forEach(b=>b.addEventListener("click",async()=>{if(!currentUser)return;const id=Number(b.dataset.lesson);if(completed.has(id)){const {error}=await supabase.from("lesson_progress").delete().eq("user_id",currentUser.id).eq("lesson_id",id);if(error)return console.error(error.message);completed.delete(id);}else{const {error}=await supabase.from("lesson_progress").upsert({user_id:currentUser.id,lesson_id:id,completed_at:new Date().toISOString()},{onConflict:"user_id,lesson_id"});if(error)return console.error(error.message);completed.add(id);}renderProgress();}));
document.querySelectorAll("[data-study]").forEach(b=>b.addEventListener("click",()=>{showPage("signals");const match=Object.keys(marketNames).find(key=>key.includes(b.dataset.study.toUpperCase().replace("/",""))||marketNames[key].toUpperCase().includes(b.dataset.study.toUpperCase()));if(match){$("marketSymbol").value=match;renderMarketChart(match);}}));
supabase.auth.onAuthStateChange((event,session)=>{if(session?.user&&["SIGNED_IN","INITIAL_SESSION","TOKEN_REFRESHED","USER_UPDATED"].includes(event)){enterApp(session.user);}else if(event==="SIGNED_OUT"){currentUser=null;showAuth();}});
const {data:{session}}=await supabase.auth.getSession();if(session?.user)await enterApp(session.user);
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
  renderBotResult(data);showBotMessage("Simulation completed. No live orders were sent.");
 }catch(error){showBotMessage(error.message||"Could not run the simulation. Check the API server and CSV file.",true);}
 finally{button.disabled=false;}
});
