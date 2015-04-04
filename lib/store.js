var Immutable = require('immutable');
var Cursor = require('immutable/contrib/cursor/index');
var _ = require('./utils');

/**
 * 数据中心
 *
 * @param obj
 */
function Store(data) {
  if (!(this instanceof Store)) return new Store(data);

  //当前应用的数据
  this.data = Immutable.fromJS(data || {});

  //缓存初始状态的值
  this.init = this.data;

  //注册store change的callback
  this.callbacks = [];

  /**
   * 暴露给外面的方法
   */
  return {
    data: this.getData.bind(this),
    onStoreChange: this.onStoreChange.bind(this),
    cursor: this.cursor.bind(this),
    reset: this.reset.bind(this)
  };
};


/**
 * 获取数据
 */
 Store.prototype.getData = function() {
   return this.data;
 };


/**
 * 获取store中的cursor
 */
Store.prototype.cursor = function() {
  /**
   * cursor发生变化的回调
   *
   * @param nextState 变化后的状态
   * @param preState 变化前状态
   * @param path cursor变化的路径
   */
   var change = function (nextState, preState, path) {
     var nextData = nextState[_.isArray(path) ? 'getIn' : 'get'](path);

     _.log(
       'cursor path: [', path.join(), '] store: ',
        (typeof(nextData) !== 'undefined' && nextData != null) ? nextData.toString() : 'was deleted.'
      );

      //判断是否出现数据不同步的情况
      if (preState != this.data) {
        throw new Error('attempted to altere expired data.');
      }

      this.data = nextState;

      this.callbacks.forEach(function (callback) {
        callback(nextState, path);
      });
    }.bind(this);

    return Cursor.from(this.data, change);
 };


/**
 * 绑定Store数据变化的回调
 */
 Store.prototype.onStoreChange = function(callback) {
   this.callbacks.push(callback);
 };



/**
 * 重置某个路径下的immutable值
 *
 * @param path 数据的路径
 */
 Store.prototype.reset = function(path) {
   if (path) {
     var isArray = _.isArray(path);
     var initVal = this.init[isArray ? 'getIn' : 'get'](path);

     //set
     this.cursor()[isArray ? 'setIn' : 'set'](path, initVal);
   } else {
     //如果path为空，整个数据全部回到初始状态
     this.data = this.init;
     this.callbacks.forEach(function (callback) {
       callback(this.data);
     });
   }
 };


module.exports = Store;
