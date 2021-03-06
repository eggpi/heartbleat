function unpackGCS(gcs, p) {
  var remsize = Math.log2(p);
  var unpacked = []; // FIXME probably want to unpack lazily later

  var entry = 0;
  while (gcs !== "") {
    var quotient = gcs.indexOf("0");
    var remainder = gcs.slice(quotient + 1, quotient + 1 + remsize);
    remainder = Number.parseInt(remainder, 2);

    entry = entry + quotient*p + remainder;
    unpacked.push(entry);

    gcs = gcs.slice(quotient + remsize + 1);
  }

  return unpacked;
}

function packGCS(hashes, p) {
  var gcs = "";
  var remsize = Math.log2(p);

  var differences = [hashes[0]];
  for (var i = 1; i < hashes.length; i++) {
    differences.push(hashes[i] - hashes[i-1]);
  }

  return differences.map(function(n) {
    var quotient = Math.floor(n / p);
    var remainder = n % p;

    var one_encoded_quotient = new Array(quotient+1).join("1") + "0";
    var base_two_remainder = remainder.toString(2);
    while (base_two_remainder.length < remsize) {
      base_two_remainder = "0" + base_two_remainder;
    }

    return one_encoded_quotient + base_two_remainder;
  }).join("");
}

function patchGCS(gcs, p, add, remove) {
  var unpacked = unpackGCS(gcs, p);

  if (remove) {
    unpacked = unpacked.filter(function(n) {
      return remove.indexOf(n) == -1;
    });
  }

  if (add) {
    unpacked = unpacked.concat(add);
  }

  unpacked.sort(function(a, b) { return a - b; });
  return packGCS(unpacked, p);
}

function searchGCS(gcs, p, n) {
  return unpackGCS(gcs, p).indexOf(n) != -1;
}

exports.unpackGCS = unpackGCS;
exports.packGCS = packGCS;
exports.patchGCS = patchGCS;
exports.searchGCS = searchGCS;
