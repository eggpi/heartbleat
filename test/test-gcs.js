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

require("sdk/test").run(exports);
