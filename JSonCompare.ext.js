Ext.namespace('Ext.ux.util');

/**
 * Custom routines for working with objects.
 */
Ext.ux.util.Object = function() {
		//private comparer body
		function compareJSons(src1, src2, options) {
			var CmpJSon = {
				//Based on the idea from Ext.JSON functions.
				decodeJSon : function(sourceStr) {
					var isJSONSupported = (window.JSON && JSON.toString() == '[object JSON]'),
						evalJSon = function(code) {
							return eval('(' + code + ')');
						};
					dc = isJSONSupported ? JSON.parse : evalJSon;
					try {
						return dc(sourceStr);
					} catch (e) {
						return sourceStr;
					}
				},
				ObjectAlg : {
					prepareToCompare : function(sourceStr){
						return (typeof sourceStr == "string") ? CmpJSon.decodeJSon(sourceStr) : sourceStr;
					},
					getObjectLength : function(sourceObj){
						return (sourceObj && CmpJSon.ObjectAlg.isExisting(sourceObj.length)) ? sourceObj.length : 0;
					},
					isExisting : function(obj){
						return (typeof obj != "undefined");
					},
					isObject : function(obj){
						return (typeof obj == "object");
					},
					//ECMA Script standart check
					isArray : function(obj) {
						return Object.prototype.toString.call(obj);
					},
					isJQueryObject : function(obj) {
						return (typeof jQuery != "undefined") && !jQuery.isPlainObject(obj);
					}
				},
				FunctionAlg : {
					isFunction : function(func){
						return (typeof func == "function");
					},
					compareFunctions : function(func1, func2) {
						return func1.toString() == func2.toString();
					}
				}
			};
			var CmpStack = {
				_stackArray : [],
				_cmpStackCount : 0,
				// Array Remove - By John Resig (MIT Licensed)
				_cmpStackRemove : function(from) {
					var rest = this._stackArray.slice(from + 1 || this._stackArray.length);
					this._stackArray.length = from < 0 ? this._stackArray.length + from : from;
					return this._stackArray.push.apply(this._stackArray, rest);
				},
				objInCmpStack : function(obj) {
					var i = this._cmpStackCount;
					while(i--) {
						if(obj === this._stackArray[i]) {
							return i;
						}
					}
					return -1;
				},
				addObject : function(obj) {
					this._stackArray.push(obj);
					this._cmpStackCount++;
				},
				remObject : function(obj) {
					var pos = this.objInCmpStack(obj);
					if(pos == -1) {
						return;
					}
					this._cmpStackRemove(pos);
					this._cmpStackCount--;
				},
				popLastObject : function() {
					this._stackArray.pop();
				}
			};
			var doComparation = function(sourceStr1, sourceStr2, options) {
				var Options = {
					arraysAsSets : false
				};
				if(options) {
					if(CmpJSon.ObjectAlg.isExisting(options.arraysAsSets))
						Options.arraysAsSets = options.arraysAsSets;
				}
				if(sourceStr1 == sourceStr2) {
					return true;
				}
				if(!CmpJSon.ObjectAlg.isExisting(sourceStr1)) {
					return !CmpJSon.ObjectAlg.isExisting(sourceStr2);
				}
				if(CmpJSon.FunctionAlg.isFunction(sourceStr1)) {
					if(CmpJSon.FunctionAlg.isFunction(sourceStr2)) {
						return CmpJSon.FunctionAlg.compareFunctions(sourceStr1, sourceStr2);
					} else {
						return false;
					}
				}
				
				var sourceObj1 = CmpJSon.ObjectAlg.prepareToCompare(sourceStr1),
					lengthObj1 = CmpJSon.ObjectAlg.getObjectLength(sourceObj1),
					sourceObj2 = CmpJSon.ObjectAlg.prepareToCompare(sourceStr2),
					lengthObj2 = CmpJSon.ObjectAlg.getObjectLength(sourceObj2),
					result = true;
				if(lengthObj1 != lengthObj2) {
					return false;
				}
				if(CmpJSon.ObjectAlg.isObject(sourceObj1)) {
					if(CmpJSon.ObjectAlg.isObject(sourceObj2)) {
						CmpStack.addObject(sourceObj1);
						CmpStack.addObject(sourceObj2);
						//Arrays support
						if(CmpJSon.ObjectAlg.isArray(sourceObj1)) {
							if(CmpJSon.ObjectAlg.isArray(sourceObj2)) {
								if(Options.arraysAsSets) {
									var iter1 = sourceObj1.length;
									while(iter1--) {
										var iter2 = sourceObj2.length,
											isFoundInSet = false;
										while(iter2--){
											if(doComparation(sourceObj1[iter1], sourceObj2[iter2], Options)){
												isFoundInSet = true;
												break;
											}
										}
										result = result && isFoundInSet;
									}
								} else {
									var iter = sourceObj1.length;
									while(iter--) {
										result = result && doComparation(sourceObj1[iter], sourceObj2[iter], Options);
									}
								}
							} else {
								return false;
							}
						} else if (CmpJSon.ObjectAlg.isJQueryObject(sourceObj1)) {
							if(CmpJSon.ObjectAlg.isJQueryObject(sourceObj2)) {
								return sourceObj1.is(sourceObj2);
							} else {
								return false;
							}
						} else {
							for(var propertyObject in sourceObj1) {
								//debug output
								//console.log(propertyObject + ":" + sourceObj1[propertyObject]);
								//console.log(propertyObject + ":" + sourceObj2[propertyObject]);
								var propertyObjectField1 = sourceObj1[propertyObject];
								var propertyObjectField2 = sourceObj2[propertyObject];
								if(CmpStack.objInCmpStack(propertyObjectField1) > -1 || CmpStack.objInCmpStack(propertyObjectField2) > -1) {
									return (propertyObjectField1 === propertyObjectField1);
								}
								result = result && CmpJSon.ObjectAlg.isExisting(propertyObjectField2) && doComparation(propertyObjectField1, propertyObjectField2);
								if(!result) {
									break;
								}
							}
						}
						CmpStack.popLastObject(); // Remove sourceObj1
						CmpStack.popLastObject(); // Remove sourceObj2
						return result;
					} else {
						return false;
					}
				} else {
					if(!CmpJSon.ObjectAlg.isObject(sourceObj2)) {
						return sourceObj1 === sourceObj2;
					} else {
						return false;
					}
				}
				return true;
			}
			return doComparation(src1, src2, options);
		}
    //public
    return {
        /**
         * Compares two objects to determine if they are identical.
         * @param {Object} o1
         * @param {Object} o2
		 * @param (Object) options
         * @return Boolean
         */
        compare: function(o1, o2, options){
            return compareJSons(o1, o2, options);
        }
    };
}();