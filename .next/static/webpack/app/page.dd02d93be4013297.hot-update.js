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

/***/ "(app-pages-browser)/./src/utils/seedData.ts":
/*!*******************************!*\
  !*** ./src/utils/seedData.ts ***!
  \*******************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   generateSampleData: () => (/* binding */ generateSampleData)\n/* harmony export */ });\nconst specialties = [\n    'Cardiology',\n    'Orthopedics',\n    'Internal Medicine',\n    'Family Medicine',\n    'Pediatrics',\n    'Neurology',\n    'Oncology',\n    'Dermatology'\n];\nconst generateProvider = (id)=>{\n    const specialty = specialties[Math.floor(Math.random() * specialties.length)];\n    const baseSalary = 200000 + Math.floor(Math.random() * 100000);\n    const fte = [\n        0.5,\n        0.75,\n        0.8,\n        0.9,\n        1.0\n    ][Math.floor(Math.random() * 5)];\n    return {\n        id: \"P\".concat(id),\n        firstName: \"John\",\n        lastName: \"Smith \".concat(id),\n        employeeId: \"EMP\".concat(1000 + id),\n        specialty,\n        providerType: 'Physician',\n        fte,\n        baseSalary,\n        annualSalary: baseSalary,\n        conversionFactor: 45.00,\n        annualWRVUTarget: 5000,\n        ytdWRVUs: 4800.00,\n        wrvuTarget: 5000.00,\n        incentivesEarned: 0.00,\n        holdback: 0.00,\n        hireDate: new Date(2023, Math.floor(Math.random() * 12), 1),\n        metrics: generateMetrics()\n    };\n};\nconst generateMetrics = ()=>{\n    return Array.from({\n        length: 12\n    }, (_, index)=>{\n        const actualWRVU = 380 + Math.floor(Math.random() * 40); // Random between 380-420\n        const targetWRVU = 417;\n        return {\n            month: \"2024-\".concat(String(index + 1).padStart(2, '0')),\n            actualWRVU,\n            targetWRVU,\n            difference: actualWRVU - targetWRVU\n        };\n    });\n};\nconst generateSampleData = function() {\n    let count = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 50;\n    const providers = Array.from({\n        length: count\n    }, (_, i)=>generateProvider(i + 1));\n    // Group by specialty for sidebar\n    const specialtyGroups = specialties.map((specialty)=>({\n            name: specialty,\n            providers: providers.filter((p)=>p.specialty === specialty).map((p)=>({\n                    id: p.id,\n                    name: \"\".concat(p.firstName, \" \").concat(p.lastName, \", MD\"),\n                    employeeId: p.employeeId\n                }))\n        })).filter((group)=>group.providers.length > 0);\n    return {\n        providers,\n        specialtyGroups\n    };\n};\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL3NyYy91dGlscy9zZWVkRGF0YS50cyIsIm1hcHBpbmdzIjoiOzs7O0FBQUEsTUFBTUEsY0FBYztJQUNsQjtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0NBQ0Q7QUFFRCxNQUFNQyxtQkFBbUIsQ0FBQ0M7SUFDeEIsTUFBTUMsWUFBWUgsV0FBVyxDQUFDSSxLQUFLQyxLQUFLLENBQUNELEtBQUtFLE1BQU0sS0FBS04sWUFBWU8sTUFBTSxFQUFFO0lBQzdFLE1BQU1DLGFBQWEsU0FBU0osS0FBS0MsS0FBSyxDQUFDRCxLQUFLRSxNQUFNLEtBQUs7SUFDdkQsTUFBTUcsTUFBTTtRQUFDO1FBQUs7UUFBTTtRQUFLO1FBQUs7S0FBSSxDQUFDTCxLQUFLQyxLQUFLLENBQUNELEtBQUtFLE1BQU0sS0FBSyxHQUFHO0lBRXJFLE9BQU87UUFDTEosSUFBSSxJQUFPLE9BQUhBO1FBQ1JRLFdBQVk7UUFDWkMsVUFBVSxTQUFZLE9BQUhUO1FBQ25CVSxZQUFZLE1BQWdCLE9BQVYsT0FBT1Y7UUFDekJDO1FBQ0FVLGNBQWM7UUFDZEo7UUFDQUQ7UUFDQU0sY0FBY047UUFDZE8sa0JBQWtCO1FBQ2xCQyxrQkFBa0I7UUFDbEJDLFVBQVU7UUFDVkMsWUFBWTtRQUNaQyxrQkFBa0I7UUFDbEJDLFVBQVU7UUFDVkMsVUFBVSxJQUFJQyxLQUFLLE1BQU1sQixLQUFLQyxLQUFLLENBQUNELEtBQUtFLE1BQU0sS0FBSyxLQUFLO1FBQ3pEaUIsU0FBU0M7SUFDWDtBQUNGO0FBRUEsTUFBTUEsa0JBQWtCO0lBQ3RCLE9BQU9DLE1BQU1DLElBQUksQ0FBQztRQUFFbkIsUUFBUTtJQUFHLEdBQUcsQ0FBQ29CLEdBQUdDO1FBQ3BDLE1BQU1DLGFBQWEsTUFBTXpCLEtBQUtDLEtBQUssQ0FBQ0QsS0FBS0UsTUFBTSxLQUFLLEtBQUsseUJBQXlCO1FBQ2xGLE1BQU13QixhQUFhO1FBQ25CLE9BQU87WUFDTEMsT0FBTyxRQUEyQyxPQUFuQ0MsT0FBT0osUUFBUSxHQUFHSyxRQUFRLENBQUMsR0FBRztZQUM3Q0o7WUFDQUM7WUFDQUksWUFBWUwsYUFBYUM7UUFDM0I7SUFDRjtBQUNGO0FBRU8sTUFBTUsscUJBQXFCO1FBQUNDLHlFQUFnQjtJQUNqRCxNQUFNQyxZQUFZWixNQUFNQyxJQUFJLENBQUM7UUFBRW5CLFFBQVE2QjtJQUFNLEdBQUcsQ0FBQ1QsR0FBR1csSUFBTXJDLGlCQUFpQnFDLElBQUk7SUFFL0UsaUNBQWlDO0lBQ2pDLE1BQU1DLGtCQUFrQnZDLFlBQVl3QyxHQUFHLENBQUNyQyxDQUFBQSxZQUFjO1lBQ3BEc0MsTUFBTXRDO1lBQ05rQyxXQUFXQSxVQUNSSyxNQUFNLENBQUNDLENBQUFBLElBQUtBLEVBQUV4QyxTQUFTLEtBQUtBLFdBQzVCcUMsR0FBRyxDQUFDRyxDQUFBQSxJQUFNO29CQUNUekMsSUFBSXlDLEVBQUV6QyxFQUFFO29CQUNSdUMsTUFBTSxHQUFrQkUsT0FBZkEsRUFBRWpDLFNBQVMsRUFBQyxLQUFjLE9BQVhpQyxFQUFFaEMsUUFBUSxFQUFDO29CQUNuQ0MsWUFBWStCLEVBQUUvQixVQUFVO2dCQUMxQjtRQUNKLElBQUk4QixNQUFNLENBQUNFLENBQUFBLFFBQVNBLE1BQU1QLFNBQVMsQ0FBQzlCLE1BQU0sR0FBRztJQUU3QyxPQUFPO1FBQ0w4QjtRQUNBRTtJQUNGO0FBQ0YsRUFBRSIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFx3aGVyZFxcUHl0aG9uUHJvamVjdHNcXHdvcmtydnUtZGFzaGJvYXJkXFxzcmNcXHV0aWxzXFxzZWVkRGF0YS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBzcGVjaWFsdGllcyA9IFtcclxuICAnQ2FyZGlvbG9neScsXHJcbiAgJ09ydGhvcGVkaWNzJyxcclxuICAnSW50ZXJuYWwgTWVkaWNpbmUnLFxyXG4gICdGYW1pbHkgTWVkaWNpbmUnLFxyXG4gICdQZWRpYXRyaWNzJyxcclxuICAnTmV1cm9sb2d5JyxcclxuICAnT25jb2xvZ3knLFxyXG4gICdEZXJtYXRvbG9neSdcclxuXTtcclxuXHJcbmNvbnN0IGdlbmVyYXRlUHJvdmlkZXIgPSAoaWQ6IG51bWJlcikgPT4ge1xyXG4gIGNvbnN0IHNwZWNpYWx0eSA9IHNwZWNpYWx0aWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNwZWNpYWx0aWVzLmxlbmd0aCldO1xyXG4gIGNvbnN0IGJhc2VTYWxhcnkgPSAyMDAwMDAgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDApO1xyXG4gIGNvbnN0IGZ0ZSA9IFswLjUsIDAuNzUsIDAuOCwgMC45LCAxLjBdW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUpXTtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgaWQ6IGBQJHtpZH1gLFxyXG4gICAgZmlyc3ROYW1lOiBgSm9obmAsXHJcbiAgICBsYXN0TmFtZTogYFNtaXRoICR7aWR9YCxcclxuICAgIGVtcGxveWVlSWQ6IGBFTVAkezEwMDAgKyBpZH1gLFxyXG4gICAgc3BlY2lhbHR5LFxyXG4gICAgcHJvdmlkZXJUeXBlOiAnUGh5c2ljaWFuJyxcclxuICAgIGZ0ZSxcclxuICAgIGJhc2VTYWxhcnksXHJcbiAgICBhbm51YWxTYWxhcnk6IGJhc2VTYWxhcnksXHJcbiAgICBjb252ZXJzaW9uRmFjdG9yOiA0NS4wMCxcclxuICAgIGFubnVhbFdSVlVUYXJnZXQ6IDUwMDAsXHJcbiAgICB5dGRXUlZVczogNDgwMC4wMCxcclxuICAgIHdydnVUYXJnZXQ6IDUwMDAuMDAsXHJcbiAgICBpbmNlbnRpdmVzRWFybmVkOiAwLjAwLFxyXG4gICAgaG9sZGJhY2s6IDAuMDAsXHJcbiAgICBoaXJlRGF0ZTogbmV3IERhdGUoMjAyMywgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTIpLCAxKSxcclxuICAgIG1ldHJpY3M6IGdlbmVyYXRlTWV0cmljcygpXHJcbiAgfTtcclxufTtcclxuXHJcbmNvbnN0IGdlbmVyYXRlTWV0cmljcyA9ICgpID0+IHtcclxuICByZXR1cm4gQXJyYXkuZnJvbSh7IGxlbmd0aDogMTIgfSwgKF8sIGluZGV4KSA9PiB7XHJcbiAgICBjb25zdCBhY3R1YWxXUlZVID0gMzgwICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNDApOyAvLyBSYW5kb20gYmV0d2VlbiAzODAtNDIwXHJcbiAgICBjb25zdCB0YXJnZXRXUlZVID0gNDE3O1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbW9udGg6IGAyMDI0LSR7U3RyaW5nKGluZGV4ICsgMSkucGFkU3RhcnQoMiwgJzAnKX1gLFxyXG4gICAgICBhY3R1YWxXUlZVLFxyXG4gICAgICB0YXJnZXRXUlZVLFxyXG4gICAgICBkaWZmZXJlbmNlOiBhY3R1YWxXUlZVIC0gdGFyZ2V0V1JWVVxyXG4gICAgfTtcclxuICB9KTtcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBnZW5lcmF0ZVNhbXBsZURhdGEgPSAoY291bnQ6IG51bWJlciA9IDUwKSA9PiB7XHJcbiAgY29uc3QgcHJvdmlkZXJzID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogY291bnQgfSwgKF8sIGkpID0+IGdlbmVyYXRlUHJvdmlkZXIoaSArIDEpKTtcclxuICBcclxuICAvLyBHcm91cCBieSBzcGVjaWFsdHkgZm9yIHNpZGViYXJcclxuICBjb25zdCBzcGVjaWFsdHlHcm91cHMgPSBzcGVjaWFsdGllcy5tYXAoc3BlY2lhbHR5ID0+ICh7XHJcbiAgICBuYW1lOiBzcGVjaWFsdHksXHJcbiAgICBwcm92aWRlcnM6IHByb3ZpZGVyc1xyXG4gICAgICAuZmlsdGVyKHAgPT4gcC5zcGVjaWFsdHkgPT09IHNwZWNpYWx0eSlcclxuICAgICAgLm1hcChwID0+ICh7XHJcbiAgICAgICAgaWQ6IHAuaWQsXHJcbiAgICAgICAgbmFtZTogYCR7cC5maXJzdE5hbWV9ICR7cC5sYXN0TmFtZX0sIE1EYCxcclxuICAgICAgICBlbXBsb3llZUlkOiBwLmVtcGxveWVlSWRcclxuICAgICAgfSkpXHJcbiAgfSkpLmZpbHRlcihncm91cCA9PiBncm91cC5wcm92aWRlcnMubGVuZ3RoID4gMCk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBwcm92aWRlcnMsXHJcbiAgICBzcGVjaWFsdHlHcm91cHNcclxuICB9O1xyXG59OyAiXSwibmFtZXMiOlsic3BlY2lhbHRpZXMiLCJnZW5lcmF0ZVByb3ZpZGVyIiwiaWQiLCJzcGVjaWFsdHkiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJsZW5ndGgiLCJiYXNlU2FsYXJ5IiwiZnRlIiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJlbXBsb3llZUlkIiwicHJvdmlkZXJUeXBlIiwiYW5udWFsU2FsYXJ5IiwiY29udmVyc2lvbkZhY3RvciIsImFubnVhbFdSVlVUYXJnZXQiLCJ5dGRXUlZVcyIsIndydnVUYXJnZXQiLCJpbmNlbnRpdmVzRWFybmVkIiwiaG9sZGJhY2siLCJoaXJlRGF0ZSIsIkRhdGUiLCJtZXRyaWNzIiwiZ2VuZXJhdGVNZXRyaWNzIiwiQXJyYXkiLCJmcm9tIiwiXyIsImluZGV4IiwiYWN0dWFsV1JWVSIsInRhcmdldFdSVlUiLCJtb250aCIsIlN0cmluZyIsInBhZFN0YXJ0IiwiZGlmZmVyZW5jZSIsImdlbmVyYXRlU2FtcGxlRGF0YSIsImNvdW50IiwicHJvdmlkZXJzIiwiaSIsInNwZWNpYWx0eUdyb3VwcyIsIm1hcCIsIm5hbWUiLCJmaWx0ZXIiLCJwIiwiZ3JvdXAiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/utils/seedData.ts\n"));

/***/ })

});