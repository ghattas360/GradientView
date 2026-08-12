// ============ GEX-by-price + candlestick hero chart ============
// Renders into an element as inline SVG. Illustrative data, brand palette.
function buildGexChart(hostId){
  var host = document.getElementById(hostId);
  if(!host) return;

  var W = 720, H = 430;
  var padT = 18, padB = 26, padL = 10;
  var profileW = 168;                 // width reserved for the gamma profile on the right
  var chartR = W - profileW - 14;     // right edge of candle area
  var chartL = padL + 4;
  var plotTop = padT, plotBot = H - padB;

  // ----- price scale -----
  var pMin = 566, pMax = 606;         // SPX-ish band (hundreds omitted for legibility)
  function y(price){ return plotBot - (price - pMin)/(pMax - pMin) * (plotBot - plotTop); }

  // ----- candles (illustrative, trending up into a gamma wall) -----
  // each: [open, high, low, close]
  var candles = [
    [571,574,570,573],[573,576,572,575],[575,575,571,572],[572,577,571,576],
    [576,579,575,578],[578,580,576,577],[577,581,576,580],[580,583,579,582],
    [582,584,580,581],[581,586,580,585],[585,588,584,587],[587,589,585,586],
    [586,590,585,589],[589,592,588,588],[588,591,586,590],[590,593,589,592],
    [592,594,590,591],[591,595,590,594],[594,596,592,593],[593,597,592,596],
    [596,598,594,595],[595,597,593,594],[594,596,592,593],[593,595,591,592],
    [592,594,590,593],[593,596,592,595]
  ];
  var n = candles.length;
  var cw = (chartR - chartL)/n;
  var bodyW = Math.max(3, cw*0.62);

  var UP="#33C08A", DOWN="#F0524A", AMBER="#F0A93B", BLUE="#4A90D9", MUTED="#7E889B", LINE="#1E2430", DIM="#4A5364";

  var svg = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Mono, monospace">';

  // subtle grid + price labels
  var gridStep=8;
  for(var pp=Math.ceil(pMin/gridStep)*gridStep; pp<=pMax; pp+=gridStep){
    var yy=y(pp);
    svg+='<line x1="'+chartL+'" y1="'+yy.toFixed(1)+'" x2="'+chartR+'" y2="'+yy.toFixed(1)+'" stroke="'+LINE+'" stroke-width="0.5"/>';
    svg+='<text x="'+(chartL-2)+'" y="'+(yy+3).toFixed(1)+'" fill="'+DIM+'" font-size="9" text-anchor="start" opacity="0.75">'+(5000+pp)+'</text>';
  }

  // ----- gamma profile data: gamma per strike (bar length), sign = color -----
  // strike, gamma(+/- magnitude 0..1)
  var strikes = [
    [570,-0.35],[572,-0.5],[574,-0.28],[576,-0.15],[578,0.08],[580,0.22],
    [582,0.30],[584,0.18],[586,0.42],[588,0.9],[590,0.55],[592,0.7],
    [594,0.38],[596,0.6],[598,0.25],[600,0.32],[602,0.15],[604,0.10]
  ];
  var maxAbs=0.9;
  var profX0 = chartR + 14;              // left edge of profile
  var profMax = W - 8 - 34;              // leave room for strike labels at far right
  function barLen(g){ return Math.abs(g)/maxAbs * (profMax - profX0); }

  // profile backdrop label
  svg+='<text x="'+profX0+'" y="'+(plotTop-4)+'" fill="'+AMBER+'" font-size="9" letter-spacing="0.5">GAMMA BY STRIKE</text>';

  // zero axis for profile
  svg+='<line x1="'+profX0+'" y1="'+plotTop+'" x2="'+profX0+'" y2="'+plotBot+'" stroke="'+LINE+'" stroke-width="1"/>';

  // bars
  strikes.forEach(function(s){
    var strike=s[0], g=s[1];
    var yy=y(strike);
    var bh=Math.max(2, (plotBot-plotTop)/ (strikes.length) * 0.74);
    var len=barLen(g);
    var col = g>=0 ? UP : DOWN;
    var op = 0.35 + Math.abs(g)/maxAbs*0.5;
    svg+='<rect x="'+profX0+'" y="'+(yy-bh/2).toFixed(1)+'" width="'+len.toFixed(1)+'" height="'+bh.toFixed(1)+'" fill="'+col+'" opacity="'+op.toFixed(2)+'"/>';
    // strike label at far right for the biggest walls
    if(Math.abs(g)>=0.5){
      svg+='<text x="'+(profMax+4)+'" y="'+(yy+3).toFixed(1)+'" fill="'+MUTED+'" font-size="8.5">'+(5000+strike)+'</text>';
    }
  });

  // biggest positive wall callout (gamma wall)
  var wall=strikes.reduce(function(a,b){return b[1]>a[1]?b:a;});
  var wy=y(wall[0]);
  svg+='<line x1="'+chartL+'" y1="'+wy.toFixed(1)+'" x2="'+profMax+'" y2="'+wy.toFixed(1)+'" stroke="'+UP+'" stroke-width="1" stroke-dasharray="2 3" opacity="0.5"/>';
  svg+='<rect x="'+(chartR-118)+'" y="'+(wy-14).toFixed(1)+'" width="112" height="12.5" fill="#07090C" opacity="0.85"/>';
  svg+='<text x="'+(chartR-6)+'" y="'+(wy-4.5).toFixed(1)+'" fill="'+UP+'" font-size="8.5" text-anchor="end">GAMMA WALL '+(5000+wall[0])+'</text>';

  // ----- gamma flip level (regime change) -----
  var flip=578.5, fy=y(flip);
  svg+='<line x1="'+chartL+'" y1="'+fy.toFixed(1)+'" x2="'+profMax+'" y2="'+fy.toFixed(1)+'" stroke="'+AMBER+'" stroke-width="1.2" stroke-dasharray="5 3"/>';
  svg+='<rect x="'+chartL+'" y="'+(fy-14).toFixed(1)+'" width="120" height="12.5" fill="#07090C" opacity="0.9"/>';
  svg+='<text x="'+(chartL+3)+'" y="'+(fy-4.5).toFixed(1)+'" fill="'+AMBER+'" font-size="8.5">GAMMA FLIP '+(5000+flip)+'</text>';

  // shade negative-gamma region (below flip) faintly red, positive faintly green
  svg+='<rect x="'+chartL+'" y="'+fy.toFixed(1)+'" width="'+(chartR-chartL)+'" height="'+(plotBot-fy).toFixed(1)+'" fill="'+DOWN+'" opacity="0.05"/>';
  svg+='<rect x="'+chartL+'" y="'+plotTop+'" width="'+(chartR-chartL)+'" height="'+(fy-plotTop).toFixed(1)+'" fill="'+UP+'" opacity="0.04"/>';

  // ----- candles -----
  candles.forEach(function(c,i){
    var o=c[0],h=c[1],l=c[2],cl=c[3];
    var xc=chartL + i*cw + cw/2;
    var up=cl>=o;
    var col=up?UP:DOWN;
    // wick
    svg+='<line x1="'+xc.toFixed(1)+'" y1="'+y(h).toFixed(1)+'" x2="'+xc.toFixed(1)+'" y2="'+y(l).toFixed(1)+'" stroke="'+col+'" stroke-width="1" opacity="0.85"/>';
    // body
    var yo=y(o), yc=y(cl);
    var top=Math.min(yo,yc), bh=Math.max(1.5,Math.abs(yc-yo));
    svg+='<rect x="'+(xc-bodyW/2).toFixed(1)+'" y="'+top.toFixed(1)+'" width="'+bodyW.toFixed(1)+'" height="'+bh.toFixed(1)+'" fill="'+col+'" opacity="0.9"/>';
  });

  // spot marker (last close)
  var last=candles[n-1][3], ly=y(last);
  var lx=chartL+(n-1)*cw+cw/2;
  svg+='<circle cx="'+lx.toFixed(1)+'" cy="'+ly.toFixed(1)+'" r="2.6" fill="'+BLUE+'"/>';
  svg+='<line x1="'+lx.toFixed(1)+'" y1="'+ly.toFixed(1)+'" x2="'+chartR+'" y2="'+ly.toFixed(1)+'" stroke="'+BLUE+'" stroke-width="0.6" stroke-dasharray="1 2" opacity="0.6"/>';
  svg+='<rect x="'+(chartR-2)+'" y="'+(ly-7).toFixed(1)+'" width="46" height="14" fill="'+BLUE+'" opacity="0.9"/>';
  svg+='<text x="'+(chartR+1)+'" y="'+(ly+3).toFixed(1)+'" fill="#07090C" font-size="9" font-weight="600">'+(5000+last)+'</text>';

  // compact regime legend (bottom-left)
  var lgy=plotBot+16;
  svg+='<rect x="'+chartL+'" y="'+(lgy-8)+'" width="9" height="9" fill="'+UP+'" opacity="0.7"/>';
  svg+='<text x="'+(chartL+13)+'" y="'+(lgy-0.5)+'" fill="'+MUTED+'" font-size="8.5">+γ · vol suppressed</text>';
  svg+='<rect x="'+(chartL+150)+'" y="'+(lgy-8)+'" width="9" height="9" fill="'+DOWN+'" opacity="0.7"/>';
  svg+='<text x="'+(chartL+163)+'" y="'+(lgy-0.5)+'" fill="'+MUTED+'" font-size="8.5">−γ · moves amplified</text>';

  svg+='</svg>';
  host.innerHTML=svg;
}
