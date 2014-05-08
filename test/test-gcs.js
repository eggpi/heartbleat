var gcs = require("./gcs");

/* example GCS taken from:
 * http://giovanni.bajo.it/post/47119962313/golomb-coded-sets-smaller-than-bloom-filters
 */
var longNumberList = [
  151, 192, 208, 269, 461, 512, 526, 591, 662, 806,
  831, 866, 890, 997, 1005, 1017, 1134, 1207, 1231,
  1327, 1378, 1393, 1418, 1525, 1627, 1630
];

var longGCS =
  "110010111010100100100000111101111000000001100110001110100000011000011111" +
  "001000000110010100011001100010101011000100000011001011010110001001001100" +
  "01010000001100110001111001100110101011101001100000011";

exports["test unpackGCS"] = function(assert) {
  assert.deepEqual(gcs.unpackGCS("10000001", 64), [64 + 1]);
  assert.deepEqual(gcs.unpackGCS("1000100", 32), [32 + 4]);
  assert.deepEqual(gcs.unpackGCS("100000010000111", 64), [65, 65 + 7]);
  assert.deepEqual(gcs.unpackGCS(longGCS, 64), longNumberList);
}

exports["test packGCS"] = function(assert) {
  assert.equal(gcs.packGCS([65], 64), "10000001");
  assert.equal(gcs.packGCS(longNumberList, 64), longGCS);
}

exports["test patchGCS"] = function(assert) {
  var numberList = [51, 76, 92, 101, 119, 215];
  var packed = gcs.packGCS(numberList, 32);

  var testResult = numberList.concat([]);
  testResult.splice(3, 0, 95, 97);
  assert.deepEqual(
      gcs.unpackGCS(gcs.patchGCS(packed, 32, [95, 97], []), 32),
      testResult);

  var testResult = numberList.concat([]);
  testResult.splice(0, 2);
  assert.deepEqual(
      gcs.unpackGCS(gcs.patchGCS(packed, 32, [], [51, 76]), 32),
      testResult);

  var testResult = numberList.concat([]);
  testResult.splice(0, 2, 49);
  testResult.splice(3, 0, 104);
  testResult.push(300);
  assert.deepEqual(
      gcs.unpackGCS(gcs.patchGCS(packed, 32, [49, 104, 300], [51, 76]), 32),
      testResult);
}

require("sdk/test").run(exports);
