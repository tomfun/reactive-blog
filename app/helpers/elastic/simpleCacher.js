const _ = require("lodash");

const cache = new Map();
let timer = null;
let minTime = 1;

function scheduleClear() {
  process.nextTick(function () {
    if (timer) {return;}
    timer = setTimeout(clear, minTime);
  });
}

function clear() {
  const clearKeys = new Set();
  const now = Date.now();
  minTime = 1000000000;
  for (let [key, value] of cache) {
    if (value.ttl <= now) {
      clearKeys.add(key);
    } else {
      minTime = Math.min(minTime, value.ttl - now);
    }
  }
  for (let item of clearKeys) {
    cache.delete(item);
  }
  timer = null;
  scheduleClear();
}

export default {
  set: function (key, data, cacheTime) {
    cacheTime = +cacheTime;
    if (!cacheTime || cacheTime < 0 || _.isNaN(cache) || !_.isFinite(cacheTime)) {
      throw new TypeError("cacheTime must be positive finite number");
    }
    const ttl = Date.now() + cacheTime;
    cache.set(key, {
      data,
      ttl
    });
    if (minTime > cacheTime) {
      clearTimeout(timer);
      timer = null;
      minTime = cacheTime;
      scheduleClear();
    } else if (!timer) {
      scheduleClear();
    }
  },
  get: function (key) {
    let res = cache.get(key);
    if (res) {
      if (res.ttl > Date.now()) {
        return res.data;
      }
      cache.delete(key);
    }
  },
  delete: function (key) {
    cache.delete(key);
  },
  size() {
    clear();
    return cache.size;
  }
};
