"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/page",{

/***/ "(app-pages-browser)/./src/components/Dashboard/CompensationHistory.tsx":
/*!**********************************************************!*\
  !*** ./src/components/Dashboard/CompensationHistory.tsx ***!
  \**********************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _barrel_optimize_names_PencilSquareIcon_TrashIcon_heroicons_react_24_outline__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! __barrel_optimize__?names=PencilSquareIcon,TrashIcon!=!@heroicons/react/24/outline */ \"(app-pages-browser)/./node_modules/@heroicons/react/24/outline/esm/PencilSquareIcon.js\");\n/* harmony import */ var _barrel_optimize_names_PencilSquareIcon_TrashIcon_heroicons_react_24_outline__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! __barrel_optimize__?names=PencilSquareIcon,TrashIcon!=!@heroicons/react/24/outline */ \"(app-pages-browser)/./node_modules/@heroicons/react/24/outline/esm/TrashIcon.js\");\n\n\n\nconst CompensationHistory = (param)=>{\n    let { changes, onDelete, onEdit } = param;\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        className: \"bg-white rounded-lg shadow-sm p-6\",\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h3\", {\n                className: \"text-lg font-medium mb-4\",\n                children: \"Compensation History\"\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                lineNumber: 14,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"overflow-x-auto\",\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"table\", {\n                    className: \"min-w-full divide-y divide-gray-200\",\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"thead\", {\n                            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"tr\", {\n                                children: [\n                                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"th\", {\n                                        className: \"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\",\n                                        children: \"Effective Date\"\n                                    }, void 0, false, {\n                                        fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                        lineNumber: 19,\n                                        columnNumber: 15\n                                    }, undefined),\n                                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"th\", {\n                                        className: \"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\",\n                                        children: \"Salary Change\"\n                                    }, void 0, false, {\n                                        fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                        lineNumber: 22,\n                                        columnNumber: 15\n                                    }, undefined),\n                                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"th\", {\n                                        className: \"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\",\n                                        children: \"FTE Change\"\n                                    }, void 0, false, {\n                                        fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                        lineNumber: 25,\n                                        columnNumber: 15\n                                    }, undefined),\n                                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"th\", {\n                                        className: \"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\",\n                                        children: \"Reason\"\n                                    }, void 0, false, {\n                                        fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                        lineNumber: 28,\n                                        columnNumber: 15\n                                    }, undefined),\n                                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"th\", {\n                                        className: \"px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider\",\n                                        children: \"Actions\"\n                                    }, void 0, false, {\n                                        fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                        lineNumber: 31,\n                                        columnNumber: 15\n                                    }, undefined)\n                                ]\n                            }, void 0, true, {\n                                fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                lineNumber: 18,\n                                columnNumber: 13\n                            }, undefined)\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                            lineNumber: 17,\n                            columnNumber: 11\n                        }, undefined),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"tbody\", {\n                            className: \"bg-white divide-y divide-gray-200\",\n                            children: changes.map((change)=>/*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"tr\", {\n                                    children: [\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"td\", {\n                                            className: \"px-6 py-4 whitespace-nowrap\",\n                                            children: change.effectiveDate.split('-').reverse().join('/')\n                                        }, void 0, false, {\n                                            fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                            lineNumber: 39,\n                                            columnNumber: 17\n                                        }, undefined),\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"td\", {\n                                            className: \"px-6 py-4 whitespace-nowrap\",\n                                            children: [\n                                                \"$\",\n                                                change.previousSalary.toLocaleString(),\n                                                \" → $\",\n                                                change.newSalary.toLocaleString()\n                                            ]\n                                        }, void 0, true, {\n                                            fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                            lineNumber: 42,\n                                            columnNumber: 17\n                                        }, undefined),\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"td\", {\n                                            className: \"px-6 py-4 whitespace-nowrap\",\n                                            children: [\n                                                change.previousFTE,\n                                                \" → \",\n                                                change.newFTE\n                                            ]\n                                        }, void 0, true, {\n                                            fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                            lineNumber: 45,\n                                            columnNumber: 17\n                                        }, undefined),\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"td\", {\n                                            className: \"px-6 py-4\",\n                                            children: change.reason\n                                        }, void 0, false, {\n                                            fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                            lineNumber: 48,\n                                            columnNumber: 17\n                                        }, undefined),\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"td\", {\n                                            className: \"px-6 py-4 text-right\",\n                                            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                                                className: \"flex justify-end space-x-2\",\n                                                children: [\n                                                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                                                        onClick: ()=>onEdit(change),\n                                                        className: \"text-blue-600 hover:text-blue-900\",\n                                                        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_PencilSquareIcon_TrashIcon_heroicons_react_24_outline__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {\n                                                            className: \"h-5 w-5\"\n                                                        }, void 0, false, {\n                                                            fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                                            lineNumber: 57,\n                                                            columnNumber: 23\n                                                        }, undefined)\n                                                    }, void 0, false, {\n                                                        fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                                        lineNumber: 53,\n                                                        columnNumber: 21\n                                                    }, undefined),\n                                                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                                                        onClick: ()=>onDelete(change.id),\n                                                        className: \"text-red-600 hover:text-red-900\",\n                                                        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_PencilSquareIcon_TrashIcon_heroicons_react_24_outline__WEBPACK_IMPORTED_MODULE_3__[\"default\"], {\n                                                            className: \"h-5 w-5\"\n                                                        }, void 0, false, {\n                                                            fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                                            lineNumber: 63,\n                                                            columnNumber: 23\n                                                        }, undefined)\n                                                    }, void 0, false, {\n                                                        fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                                        lineNumber: 59,\n                                                        columnNumber: 21\n                                                    }, undefined)\n                                                ]\n                                            }, void 0, true, {\n                                                fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                                lineNumber: 52,\n                                                columnNumber: 19\n                                            }, undefined)\n                                        }, void 0, false, {\n                                            fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                            lineNumber: 51,\n                                            columnNumber: 17\n                                        }, undefined)\n                                    ]\n                                }, change.id, true, {\n                                    fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                                    lineNumber: 38,\n                                    columnNumber: 15\n                                }, undefined))\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                            lineNumber: 36,\n                            columnNumber: 11\n                        }, undefined)\n                    ]\n                }, void 0, true, {\n                    fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                    lineNumber: 16,\n                    columnNumber: 9\n                }, undefined)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n                lineNumber: 15,\n                columnNumber: 7\n            }, undefined)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\Users\\\\wherd\\\\PythonProjects\\\\workrvu-dashboard\\\\src\\\\components\\\\Dashboard\\\\CompensationHistory.tsx\",\n        lineNumber: 13,\n        columnNumber: 5\n    }, undefined);\n};\n_c = CompensationHistory;\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (CompensationHistory);\nvar _c;\n$RefreshReg$(_c, \"CompensationHistory\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL3NyYy9jb21wb25lbnRzL0Rhc2hib2FyZC9Db21wZW5zYXRpb25IaXN0b3J5LnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQTBCO0FBRWdEO0FBUTFFLE1BQU1HLHNCQUEwRDtRQUFDLEVBQUVDLE9BQU8sRUFBRUMsUUFBUSxFQUFFQyxNQUFNLEVBQUU7SUFDNUYscUJBQ0UsOERBQUNDO1FBQUlDLFdBQVU7OzBCQUNiLDhEQUFDQztnQkFBR0QsV0FBVTswQkFBMkI7Ozs7OzswQkFDekMsOERBQUNEO2dCQUFJQyxXQUFVOzBCQUNiLDRFQUFDRTtvQkFBTUYsV0FBVTs7c0NBQ2YsOERBQUNHO3NDQUNDLDRFQUFDQzs7a0RBQ0MsOERBQUNDO3dDQUFHTCxXQUFVO2tEQUFpRjs7Ozs7O2tEQUcvRiw4REFBQ0s7d0NBQUdMLFdBQVU7a0RBQWlGOzs7Ozs7a0RBRy9GLDhEQUFDSzt3Q0FBR0wsV0FBVTtrREFBaUY7Ozs7OztrREFHL0YsOERBQUNLO3dDQUFHTCxXQUFVO2tEQUFpRjs7Ozs7O2tEQUcvRiw4REFBQ0s7d0NBQUdMLFdBQVU7a0RBQWtGOzs7Ozs7Ozs7Ozs7Ozs7OztzQ0FLcEcsOERBQUNNOzRCQUFNTixXQUFVO3NDQUNkSixRQUFRVyxHQUFHLENBQUMsQ0FBQ0MsdUJBQ1osOERBQUNKOztzREFDQyw4REFBQ0s7NENBQUdULFdBQVU7c0RBQ1hRLE9BQU9FLGFBQWEsQ0FBQ0MsS0FBSyxDQUFDLEtBQUtDLE9BQU8sR0FBR0MsSUFBSSxDQUFDOzs7Ozs7c0RBRWxELDhEQUFDSjs0Q0FBR1QsV0FBVTs7Z0RBQThCO2dEQUN4Q1EsT0FBT00sY0FBYyxDQUFDQyxjQUFjO2dEQUFHO2dEQUFLUCxPQUFPUSxTQUFTLENBQUNELGNBQWM7Ozs7Ozs7c0RBRS9FLDhEQUFDTjs0Q0FBR1QsV0FBVTs7Z0RBQ1hRLE9BQU9TLFdBQVc7Z0RBQUM7Z0RBQUlULE9BQU9VLE1BQU07Ozs7Ozs7c0RBRXZDLDhEQUFDVDs0Q0FBR1QsV0FBVTtzREFDWFEsT0FBT1csTUFBTTs7Ozs7O3NEQUVoQiw4REFBQ1Y7NENBQUdULFdBQVU7c0RBQ1osNEVBQUNEO2dEQUFJQyxXQUFVOztrRUFDYiw4REFBQ29CO3dEQUNDQyxTQUFTLElBQU12QixPQUFPVTt3REFDdEJSLFdBQVU7a0VBRVYsNEVBQUNOLG9IQUFnQkE7NERBQUNNLFdBQVU7Ozs7Ozs7Ozs7O2tFQUU5Qiw4REFBQ29CO3dEQUNDQyxTQUFTLElBQU14QixTQUFTVyxPQUFPYyxFQUFFO3dEQUNqQ3RCLFdBQVU7a0VBRVYsNEVBQUNQLG9IQUFTQTs0REFBQ08sV0FBVTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7bUNBekJwQlEsT0FBT2MsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0NoQztLQS9ETTNCO0FBaUVOLGlFQUFlQSxtQkFBbUJBLEVBQUMiLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcd2hlcmRcXFB5dGhvblByb2plY3RzXFx3b3JrcnZ1LWRhc2hib2FyZFxcc3JjXFxjb21wb25lbnRzXFxEYXNoYm9hcmRcXENvbXBlbnNhdGlvbkhpc3RvcnkudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IENvbXBlbnNhdGlvbkNoYW5nZSB9IGZyb20gJ0AvdHlwZXMvY29tcGVuc2F0aW9uJztcclxuaW1wb3J0IHsgVHJhc2hJY29uLCBQZW5jaWxTcXVhcmVJY29uIH0gZnJvbSAnQGhlcm9pY29ucy9yZWFjdC8yNC9vdXRsaW5lJztcclxuXHJcbmludGVyZmFjZSBDb21wZW5zYXRpb25IaXN0b3J5UHJvcHMge1xyXG4gIGNoYW5nZXM6IENvbXBlbnNhdGlvbkNoYW5nZVtdO1xyXG4gIG9uRGVsZXRlOiAoaWQ6IHN0cmluZykgPT4gdm9pZDtcclxuICBvbkVkaXQ6IChjaGFuZ2U6IENvbXBlbnNhdGlvbkNoYW5nZSkgPT4gdm9pZDtcclxufVxyXG5cclxuY29uc3QgQ29tcGVuc2F0aW9uSGlzdG9yeTogUmVhY3QuRkM8Q29tcGVuc2F0aW9uSGlzdG9yeVByb3BzPiA9ICh7IGNoYW5nZXMsIG9uRGVsZXRlLCBvbkVkaXQgfSkgPT4ge1xyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIHJvdW5kZWQtbGcgc2hhZG93LXNtIHAtNlwiPlxyXG4gICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bSBtYi00XCI+Q29tcGVuc2F0aW9uIEhpc3Rvcnk8L2gzPlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm92ZXJmbG93LXgtYXV0b1wiPlxyXG4gICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJtaW4tdy1mdWxsIGRpdmlkZS15IGRpdmlkZS1ncmF5LTIwMFwiPlxyXG4gICAgICAgICAgPHRoZWFkPlxyXG4gICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyB0ZXh0LWxlZnQgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclwiPlxyXG4gICAgICAgICAgICAgICAgRWZmZWN0aXZlIERhdGVcclxuICAgICAgICAgICAgICA8L3RoPlxyXG4gICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC02IHB5LTMgdGV4dC1sZWZ0IHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5cclxuICAgICAgICAgICAgICAgIFNhbGFyeSBDaGFuZ2VcclxuICAgICAgICAgICAgICA8L3RoPlxyXG4gICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC02IHB5LTMgdGV4dC1sZWZ0IHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5cclxuICAgICAgICAgICAgICAgIEZURSBDaGFuZ2VcclxuICAgICAgICAgICAgICA8L3RoPlxyXG4gICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC02IHB5LTMgdGV4dC1sZWZ0IHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5cclxuICAgICAgICAgICAgICAgIFJlYXNvblxyXG4gICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyB0ZXh0LXJpZ2h0IHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5cclxuICAgICAgICAgICAgICAgIEFjdGlvbnNcclxuICAgICAgICAgICAgICA8L3RoPlxyXG4gICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgIDx0Ym9keSBjbGFzc05hbWU9XCJiZy13aGl0ZSBkaXZpZGUteSBkaXZpZGUtZ3JheS0yMDBcIj5cclxuICAgICAgICAgICAge2NoYW5nZXMubWFwKChjaGFuZ2UpID0+IChcclxuICAgICAgICAgICAgICA8dHIga2V5PXtjaGFuZ2UuaWR9PlxyXG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxyXG4gICAgICAgICAgICAgICAgICB7Y2hhbmdlLmVmZmVjdGl2ZURhdGUuc3BsaXQoJy0nKS5yZXZlcnNlKCkuam9pbignLycpfVxyXG4gICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTQgd2hpdGVzcGFjZS1ub3dyYXBcIj5cclxuICAgICAgICAgICAgICAgICAgJHtjaGFuZ2UucHJldmlvdXNTYWxhcnkudG9Mb2NhbGVTdHJpbmcoKX0g4oaSICR7Y2hhbmdlLm5ld1NhbGFyeS50b0xvY2FsZVN0cmluZygpfVxyXG4gICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTQgd2hpdGVzcGFjZS1ub3dyYXBcIj5cclxuICAgICAgICAgICAgICAgICAge2NoYW5nZS5wcmV2aW91c0ZURX0g4oaSIHtjaGFuZ2UubmV3RlRFfVxyXG4gICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTRcIj5cclxuICAgICAgICAgICAgICAgICAge2NoYW5nZS5yZWFzb259XHJcbiAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB0ZXh0LXJpZ2h0XCI+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWVuZCBzcGFjZS14LTJcIj5cclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkVkaXQoY2hhbmdlKX1cclxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtYmx1ZS02MDAgaG92ZXI6dGV4dC1ibHVlLTkwMFwiXHJcbiAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPFBlbmNpbFNxdWFyZUljb24gY2xhc3NOYW1lPVwiaC01IHctNVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gb25EZWxldGUoY2hhbmdlLmlkKX1cclxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtcmVkLTYwMCBob3Zlcjp0ZXh0LXJlZC05MDBcIlxyXG4gICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaEljb24gY2xhc3NOYW1lPVwiaC01IHctNVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICApKX1cclxuICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgPC90YWJsZT5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ29tcGVuc2F0aW9uSGlzdG9yeTsgIl0sIm5hbWVzIjpbIlJlYWN0IiwiVHJhc2hJY29uIiwiUGVuY2lsU3F1YXJlSWNvbiIsIkNvbXBlbnNhdGlvbkhpc3RvcnkiLCJjaGFuZ2VzIiwib25EZWxldGUiLCJvbkVkaXQiLCJkaXYiLCJjbGFzc05hbWUiLCJoMyIsInRhYmxlIiwidGhlYWQiLCJ0ciIsInRoIiwidGJvZHkiLCJtYXAiLCJjaGFuZ2UiLCJ0ZCIsImVmZmVjdGl2ZURhdGUiLCJzcGxpdCIsInJldmVyc2UiLCJqb2luIiwicHJldmlvdXNTYWxhcnkiLCJ0b0xvY2FsZVN0cmluZyIsIm5ld1NhbGFyeSIsInByZXZpb3VzRlRFIiwibmV3RlRFIiwicmVhc29uIiwiYnV0dG9uIiwib25DbGljayIsImlkIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/components/Dashboard/CompensationHistory.tsx\n"));

/***/ })

});