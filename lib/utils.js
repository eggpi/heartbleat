"use strict";

const { Cc, Ci, Cu, Cr } = require("chrome");

/**
 * Tries to get the window associated with a channel. If it cannot, returns
 * null and logs an explanation to the console. This is not necessarily an
 * error, as many internal requests are not associated with a window, e.g. OCSP
 * or Safe Browsing requests.
 */
let getWindowForChannel = function(channel) {
  let nc;
  try {
    nc = channel.notificationCallbacks ? channel.notificationCallbacks : channel.loadGroup.notificationCallbacks;
  } catch(e) {
    console.log("ERROR missing loadgroup notificationCallbacks for " + channel.URI.spec);
    return null;
  }
  if (!nc) {
    console.log("ERROR no loadgroup notificationCallbacks for " + channel.URI.spec);
    return null;
  }

  let loadContext;
  try {
    loadContext = nc.getInterface(Ci.nsILoadContext);
  } catch(ex) {
    try {
      loadContext = channel.loadGroup.notificationCallbacks
        .getInterface(Ci.nsILoadContext);
    } catch(ex) {
      console.log("ERROR missing loadcontext", channel.URI.spec, ex.name);
      return null;
    }
  }

  let contentWindow = loadContext.associatedWindow;
  if (!contentWindow) {
    console.log("WARN no associated window for", channel.URI.spec);
  }
  return contentWindow;
}

/**
 * Returns the top window in the given channel's associated window hierarchy.
 */
let getTopWindowForChannel = function(channel) {
  let win = getWindowForChannel(channel);
  if (win) {
    return win.top;
  }
  return null;
};

exports.getWindowForChannel = getWindowForChannel;
exports.getTopWindowForChannel = getTopWindowForChannel;
