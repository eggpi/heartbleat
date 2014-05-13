/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Cc, Ci, Cr, Cu, components } = require("chrome");
const events = require("sdk/system/events");
const { getMostRecentBrowserWindow } = require("sdk/window/utils");

Cu.import("resource://services-common/utils.js");
let makeURI = CommonUtils.makeURI;

const utils = require("./utils");

const gIoService = Cc["@mozilla.org/network/io-service;1"]
                 .getService(Ci.nsIIOService);
const gPromptService = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                       .getService(Ci.nsIPromptService);

const gCheckServiceURI = "http://bleed-1161785939.us-east-1.elb.amazonaws.com/bleed/"

// cache decisions returned by the external service to avoid brutalizing it
// and perf to boot
//
// this will automatically be cleared on restart because it's stored in the
// addon's memory. if we persist it, we need to periodically check it as hosts
// update.
let HOSTNAME_CACHE = {};

function HeartbeatCheckListener(origRequest) {
  this.origRequest = origRequest;
  this._wrapper = null;
  this._response = "";
}

HeartbeatCheckListener.prototype = {

  QueryInterface: function(iid) {
    if (iid.equals(Ci.nsIStreamListener) ||
        iid.equals(Ci.nsIRequestObserver) ||
          iid.equals(Ci.nsISupports))
      return this;
    throw Cr.NS_ERROR_NO_INTERFACE;
  },

  onStartRequest: function(request, context) {},

  onDataAvailable:
  function(request, context, inputStream, offset, count) {
    if (this._wrapper == null) {
      this._wrapper = Cc["@mozilla.org/scriptableinputstream;1"]
                      .createInstance(Ci.nsIScriptableInputStream);
      this._wrapper.init(inputStream);
    }
    // store the response as it becomes available
    this._response += this._wrapper.read(count);
  },

  _isVulnerable: function(response) {
    console.log("external check server response: " + response);
    let responseObj = JSON.parse(response);
    return responseObj.code != 1;
  },

  _cacheResult: function(uri, result) {
    // add to cache
    console.log("caching decision (" + this.origRequest.URI.host + ", "
                                     + result + ")");
    HOSTNAME_CACHE[uri.host] = result;
  },

  onStopRequest:
  function(request, context, status) {
    if (components.isSuccessCode(status)) {
      if (this._isVulnerable(this._response)) {
        // ask the user if they want to visit anyway
        let checkbox = { value: false };
        let loadAnyway = gPromptService.confirmCheck(getMostRecentBrowserWindow(), "Heartbleed Warning", "This site is vulnerable to heartbleed. Are you sure you want to load it?", "Don't show again for this site.", checkbox);
        if (loadAnyway) {
          console.log("Loading anyway");
          if (checkbox.value == true) {
            // Cache this "good" decision due to user's choice
            this._cacheResult(this.origRequest.URI, true);
          }
          this.origRequest.resume();
        } else {
          console.log("cancelled request");
          if (checkbox.value == true) {
            // Cache this "bad" decision due to user's choice
            this._cacheResult(this.origRequest.URI, false);
          }
          this.origRequest.cancel(Cr.NS_ERROR_ABORT);
        }
      } else {
        console.log("External service said all good, resuming original request");
        this._cacheResult(this.origRequest.URI, true);
        this.origRequest.resume();
      }
    } else {
      // something went wrong... log error and resume original request to avoid
      // breaking the web TODO do better
      console.error("status != NS_OK, allowing original request due to error");
      // resume the original request
      this.origRequest.resume();
    }
  }
}

function validateRequestChannel(channel) {
  try {
    channel = channel.QueryInterface(Ci.nsIHttpChannel);
  } catch (e) {
    console.log("channel was not nsIHttpChannel!");
  }

  if (!channel) {
    return null;
  }

  // Ignore requests that don't have an associated window
  let win = utils.getTopWindowForChannel(channel);
  if (!win) {
    return null;
  }

  let uri = channel.URI;

  // Note: this is not good enough. We probably shouldn't check Safe Browsing
  // requests, etc.
  if (!uri.schemeIs("https")) {
    console.log("not https: " + uri.asciiSpec);
    return null;
  }

  return channel;
}

function onExamineResponse(event) {
  console.log("http-on-examine-response triggered!");
  let channel = validateRequestChannel(event.subject);
  if (channel === null) return;

  /*
  // first check the cache
  if (HOSTNAME_CACHE.hasOwnProperty(uri.host)) {
    if (HOSTNAME_CACHE[uri.host] == false) {
      console.log("Cancelling from cache");
      channel.cancel(Cr.NS_ERROR_ABORT);
    } else {
      console.log("Allowing from cache");
      return;
    }
  }
  */

  /*
   * FIXME The request has already been made!
   * Do we still want to suspend the channel?
   */
  try {
    channel.suspend();
    console.log("suspended " + channel.URI.asciiSpec);
  } catch (e) {
    console.log("error suspending https channel: " + e);
  }

  let cert =
    channel.securityInfo.QueryInterface(Ci.nsISSLStatusProvider).
    SSLStatus.QueryInterface(Ci.nsISSLStatus).serverCert;

  console.log("issuer is: " + cert.issuerName);
  console.log("serial number is: " + cert.serialNumber);
}

function main(options) {
  console.log("in main");
  events.on("http-on-examine-response", onExamineResponse, false);
}

exports.main = main;
