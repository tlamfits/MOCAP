/* Headless sanity checks for the studio engine — run: node engine.test.js
 * Verifies geometry + metrics are finite, contacts are detected, and reported
 * values are physically plausible for every movement. No browser needed.
 */
var E = require("./engine.js");
var isNum = function (x) { return typeof x === "number" && isFinite(x); };
var fail = 0;

Object.keys(E.MOVEMENTS).forEach(function (id) {
  var t = E.generateTake(id);
  var badJ = 0, air = 0;
  t.frames.forEach(function (fr) {
    for (var k in fr.joints) { if (!isNum(fr.joints[k][0]) || !isNum(fr.joints[k][1])) badJ++; }
    for (var a in fr.angles) { if (!isNum(fr.angles[a])) badJ++; }
    if (fr.airborne) air++;
  });
  var mets = E.metrics(t);
  var badM = mets.filter(function (m) { return !isNum(m.val); });
  var contacts = 0;
  for (var i = 1; i < t.frames.length; i++) if (!t.frames[i].airborne && t.frames[i - 1].airborne) contacts++;

  var ok = badJ === 0 && badM.length === 0;
  if (!ok) fail++;
  console.log((ok ? "PASS " : "FAIL ") + id.padEnd(15) +
    " frames=" + t.frames.length + " air=" + air + " contacts=" + contacts +
    " badJoints=" + badJ + " badMetrics=" + badM.length);
  console.log("     " + mets.map(function (m) { return m.label + "=" + m.val.toFixed(m.fmt) + m.unit; }).join("  |  "));
});

console.log(fail ? "\nFAIL: " + fail + " movement(s) produced NaN" : "\nALL CLEAN");
process.exit(fail ? 1 : 0);
