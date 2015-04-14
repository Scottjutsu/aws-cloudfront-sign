/**
 * `CustomPolicy` constructor.
 *
 * @param {String} Resource URL
 * @param {Number} Epoch time of URL expiration
 * @param {Object} Optional parameters
 */
function CustomPolicy(url, expireTime, options) {
  this.url = url;
  this.expireTime = Math.round(expireTime/ 1000) || undefined;
  if (options) {
    this.startTime = Math.round(options.startTime/ 1000) || undefined;
    this.ipAddress = options.ipAddress;
  }
}

/**
 * Serialize the CustomPolicy instance.
 *
 * @return {String} Serialized policy
 */
CustomPolicy.prototype.toJSON = function() {
  // Ensure the current instance is valid before building the custom policy.
  this._validate();

  var policy = {
    'Statement': [{
      'Resource': this.url,
      'Condition': {
        'DateLessThan': {
          'AWS:EpochTime': this.expireTime
        }
      }
    }]
  };

  if (this.startTime) {
    policy.Statement[0].Condition.DateGreaterThan = {
      'AWS:EpochTime': this.startTime
    };
  }

  if (this.ipAddress) {
    policy.Statement[0].Condition.IpAddress = {
      'AWS:SourceIp': this.ipAddress
    };
  }

  return JSON.stringify(policy);
};

/**
 * Check for common mistakes with types
 * @private
 */
CustomPolicy.prototype._validate = function() {
  // Ensure required params are present
  assert(!!this.url, 'Missing param: url');
  this._validateTime('expireTime');
  assert(this.expireTime > (new Date().getTime() / 1000),
    'expireTime must be after the current time');
  if (this.startTime) {
    this._validateTime('startTime');
    assert(this.startTime < this.expireTime,
      'startTime must be less than expireTime');
  }
  if (this.ipAddress) {
    // FIXME validate IP Address
  }

  return true;
};

/**
 * Helper to validate time values.
 * @private
 */
CustomPolicy.prototype._validateTime = function (timeVariable) {
  assert(!!this[timeVariable], 'Missing param: ' + timeVariable);

  // Ensure time value is valid
  assert(this[timeVariable] < 2147483647,
    timeVariable + ' must be less than January 19, 2038 03:14:08 GMT ' +
    'due to the limits of UNIX time');

};

/**
 * Assert that an expression evaluates to `true`
 */
function assert(assertion, msg) {
  if (!assertion) {
    throw new Error(msg);
  }
}


module.exports = CustomPolicy;
