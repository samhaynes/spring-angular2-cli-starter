import { getDOM } from '../src/dom/dom_adapter';
import { StringMapWrapper } from '../src/facade/collection';
import { global, isString } from '../src/facade/lang';
var _global = (typeof window === 'undefined' ? global : window);
/**
 * Jasmine matching function with Angular matchers mixed in.
 *
 * ## Example
 *
 * {@example testing/ts/matchers.ts region='toHaveText'}
 */
export var expect = _global.expect;
// Some Map polyfills don't polyfill Map.toString correctly, which
// gives us bad error messages in tests.
// The only way to do this in Jasmine is to monkey patch a method
// to the object :-(
Map.prototype['jasmineToString'] = function () {
    var m = this;
    if (!m) {
        return '' + m;
    }
    var res = [];
    m.forEach((v /** TODO #???? */, k /** TODO #???? */) => { res.push(`${k}:${v}`); });
    return `{ ${res.join(',')} }`;
};
_global.beforeEach(function () {
    jasmine.addMatchers({
        // Custom handler for Map as Jasmine does not support it yet
        toEqual: function (util, customEqualityTesters) {
            return {
                compare: function (actual /** TODO #???? */, expected /** TODO #???? */) {
                    return { pass: util.equals(actual, expected, [compareMap]) };
                }
            };
            function compareMap(actual /** TODO #???? */, expected /** TODO #???? */) {
                if (actual instanceof Map) {
                    var pass = actual.size === expected.size;
                    if (pass) {
                        actual.forEach((v /** TODO #???? */, k /** TODO #???? */) => {
                            pass = pass && util.equals(v, expected.get(k));
                        });
                    }
                    return pass;
                }
                else {
                    return undefined;
                }
            }
        },
        toBePromise: function () {
            return {
                compare: function (actual /** TODO #???? */, expectedClass /** TODO #???? */) {
                    var pass = typeof actual === 'object' && typeof actual.then === 'function';
                    return { pass: pass, get message() { return 'Expected ' + actual + ' to be a promise'; } };
                }
            };
        },
        toBeAnInstanceOf: function () {
            return {
                compare: function (actual /** TODO #???? */, expectedClass /** TODO #???? */) {
                    var pass = typeof actual === 'object' && actual instanceof expectedClass;
                    return {
                        pass: pass,
                        get message() {
                            return 'Expected ' + actual + ' to be an instance of ' + expectedClass;
                        }
                    };
                }
            };
        },
        toHaveText: function () {
            return {
                compare: function (actual /** TODO #???? */, expectedText /** TODO #???? */) {
                    var actualText = elementText(actual);
                    return {
                        pass: actualText == expectedText,
                        get message() { return 'Expected ' + actualText + ' to be equal to ' + expectedText; }
                    };
                }
            };
        },
        toHaveCssClass: function () {
            return { compare: buildError(false), negativeCompare: buildError(true) };
            function buildError(isNot /** TODO #???? */) {
                return function (actual /** TODO #???? */, className /** TODO #???? */) {
                    return {
                        pass: getDOM().hasClass(actual, className) == !isNot,
                        get message() {
                            return `Expected ${actual.outerHTML} ${isNot ? 'not ' : ''}to contain the CSS class "${className}"`;
                        }
                    };
                };
            }
        },
        toHaveCssStyle: function () {
            return {
                compare: function (actual /** TODO #???? */, styles /** TODO #???? */) {
                    var allPassed;
                    if (isString(styles)) {
                        allPassed = getDOM().hasStyle(actual, styles);
                    }
                    else {
                        allPassed = !StringMapWrapper.isEmpty(styles);
                        StringMapWrapper.forEach(styles, (style /** TODO #???? */, prop /** TODO #???? */) => {
                            allPassed = allPassed && getDOM().hasStyle(actual, prop, style);
                        });
                    }
                    return {
                        pass: allPassed,
                        get message() {
                            var expectedValueStr = isString(styles) ? styles : JSON.stringify(styles);
                            return `Expected ${actual.outerHTML} ${!allPassed ? ' ' : 'not '}to contain the
                      CSS ${isString(styles) ? 'property' : 'styles'} "${expectedValueStr}"`;
                        }
                    };
                }
            };
        },
        toContainError: function () {
            return {
                compare: function (actual /** TODO #???? */, expectedText /** TODO #???? */) {
                    var errorMessage = actual.toString();
                    return {
                        pass: errorMessage.indexOf(expectedText) > -1,
                        get message() { return 'Expected ' + errorMessage + ' to contain ' + expectedText; }
                    };
                }
            };
        },
        toThrowErrorWith: function () {
            return {
                compare: function (actual /** TODO #???? */, expectedText /** TODO #???? */) {
                    try {
                        actual();
                        return {
                            pass: false,
                            get message() { return 'Was expected to throw, but did not throw'; }
                        };
                    }
                    catch (e) {
                        var errorMessage = e.toString();
                        return {
                            pass: errorMessage.indexOf(expectedText) > -1,
                            get message() { return 'Expected ' + errorMessage + ' to contain ' + expectedText; }
                        };
                    }
                }
            };
        },
        toMatchPattern() {
            return { compare: buildError(false), negativeCompare: buildError(true) };
            function buildError(isNot /** TODO #???? */) {
                return function (actual /** TODO #???? */, regex /** TODO #???? */) {
                    return {
                        pass: regex.test(actual) == !isNot,
                        get message() {
                            return `Expected ${actual} ${isNot ? 'not ' : ''}to match ${regex.toString()}`;
                        }
                    };
                };
            }
        },
        toImplement: function () {
            return {
                compare: function (actualObject /** TODO #???? */, expectedInterface /** TODO #???? */) {
                    var objProps = Object.keys(actualObject.constructor.prototype);
                    var intProps = Object.keys(expectedInterface.prototype);
                    var missedMethods = [];
                    intProps.forEach((k) => {
                        if (!actualObject.constructor.prototype[k])
                            missedMethods.push(k);
                    });
                    return {
                        pass: missedMethods.length == 0,
                        get message() {
                            return 'Expected ' + actualObject + ' to have the following methods: ' +
                                missedMethods.join(', ');
                        }
                    };
                }
            };
        }
    });
});
function elementText(n /** TODO #???? */) {
    var hasNodes = (n /** TODO #???? */) => {
        var children = getDOM().childNodes(n);
        return children && children.length > 0;
    };
    if (n instanceof Array) {
        return n.map(elementText).join('');
    }
    if (getDOM().isCommentNode(n)) {
        return '';
    }
    if (getDOM().isElementNode(n) && getDOM().tagName(n) == 'CONTENT') {
        return elementText(Array.prototype.slice.apply(getDOM().getDistributedNodes(n)));
    }
    if (getDOM().hasShadowRoot(n)) {
        return elementText(getDOM().childNodesAsList(getDOM().getShadowRoot(n)));
    }
    if (hasNodes(n)) {
        return elementText(getDOM().childNodesAsList(n));
    }
    return getDOM().getText(n);
}
//# sourceMappingURL=matchers.js.map