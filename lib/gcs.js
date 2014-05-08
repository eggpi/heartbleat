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

exports.unpackGCS = unpackGCS;
