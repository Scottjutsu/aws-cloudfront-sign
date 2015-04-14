/**
 * Custom policy tests
 */

var _ = require('lodash');
var chai = require('chai');
var expect = chai.expect;
var CustomPolicy = require('../../lib/CustomPolicy');

describe('CustomPolicy', function() {

  it('should convert `expireTime` to seconds', function(done) {
    var expireTimeMs = new Date().getTime();
    var expireTimeSecs = Math.round(expireTimeMs / 1000);
    var policy = new CustomPolicy('http://t.com', expireTimeMs);

    expect(policy.expireTime).to.equal(expireTimeSecs);
    done();
  });

  describe('#toJSON()', function() {
    it('should fail if `url` is missing', function(done) {
      var expireTimeMs = new Date().getTime();
      var policy = new CustomPolicy(undefined, expireTimeMs);
      var func = _.bind(policy.toJSON, policy);

      expect(func).to.throw(Error, /missing param: url/i);
      done();
    });
    it('should fail if `expireTime` is missing', function(done) {
      var policy = new CustomPolicy('test');
      var func = _.bind(policy.toJSON, policy);

      expect(func).to.throw(Error, /missing param: expireTime/i);
      done();
    });
    it('should fail if `expireTime` is after the end of time', function(done) {
      var policy = new CustomPolicy('test', 3000000000000);
      var func = _.bind(policy.toJSON, policy);

      expect(func).to.throw(Error, /expireTime must be less than.*/i);
      done();
    });
    it('should fail if `expireTime` is before now', function(done) {
      var beforeNow = new Date().getTime() - 10000;
      var policy = new CustomPolicy('test', beforeNow);
      var func = _.bind(policy.toJSON, policy);

      expect(func).to.throw(Error, /.*must be after the current time$/i);
      done();
    });
    it('should fail if `startTime` is after the end of time', function(done) {
      var expireTimeMs = new Date().getTime() + 10000;
      var options = { startTime: 3000000000000 };
      var policy = new CustomPolicy('test', expireTimeMs, options);
      var func = _.bind(policy.toJSON, policy);

      expect(func).to.throw(Error, /startTime must be less than.*/i);
      done();
    });
    it('should fail if `startTime` is greater than `expireTime`', function(done) {
      var expireTimeMs = new Date().getTime() + 10000;
      var options = { startTime: expireTimeMs + 10000 };
      var policy = new CustomPolicy('test', expireTimeMs, options);
      var func = _.bind(policy.toJSON, policy);

      expect(func).to.throw(Error, /startTime must be less than expireTime/i);
      done();
    });
    it('should return the custom policy as stringified JSON', function(done) {
      var expireTimeMs = new Date().getTime() + 10000;
      var expireTimeSecs = Math.round(expireTimeMs / 1000);
      var policy = new CustomPolicy('http://t.com', expireTimeMs);
      var result = policy.toJSON();
      var parsedResult;

      expect(result).to.be.a('string');

      // Parse the stringified result so we can examine it's properties.
      parsedResult = JSON.parse(result);

      expect(parsedResult).to.have.deep.property(
        'Statement[0].Resource', 'http://t.com');
      expect(parsedResult).to.have.deep.property(
        'Statement[0].Condition.DateLessThan.AWS:EpochTime', expireTimeSecs);

      done();
    });
    it('should return the custom policy as stringified JSON with options', function(done) {
      var expireTimeMs = new Date().getTime() + 10000;
      var expireTimeSecs = Math.round(expireTimeMs / 1000);
      var options = { startTime: new Date().getTime() };
      var startTimeSecs = Math.round(options.startTime / 1000);
      var policy = new CustomPolicy('http://t.com', expireTimeMs, options);
      var result = policy.toJSON();
      var parsedResult;

      expect(result).to.be.a('string');

      // Parse the stringified result so we can examine it's properties.
      parsedResult = JSON.parse(result);

      expect(parsedResult).to.have.deep.property(
        'Statement[0].Resource', 'http://t.com');
      expect(parsedResult).to.have.deep.property(
        'Statement[0].Condition.DateLessThan.AWS:EpochTime', expireTimeSecs);
      expect(parsedResult).to.have.deep.property(
        'Statement[0].Condition.DateGreaterThan.AWS:EpochTime', startTimeSecs);

      done();
    });
  });
});
