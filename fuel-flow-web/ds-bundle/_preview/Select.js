var __dsPreview = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ds-shim:ds
  var require_ds = __commonJS({
    "ds-shim:ds"(exports, module) {
      module.exports = window.FuelFlowDS;
    }
  });

  // shim:react-shim
  var require_react_shim = __commonJS({
    "shim:react-shim"(exports, module) {
      var R = window.React;
      function jsx2(t, p, k) {
        return R.createElement(t, k === void 0 ? p : Object.assign({ key: k }, p));
      }
      module.exports = R;
      module.exports.jsx = jsx2;
      module.exports.jsxs = jsx2;
      module.exports.jsxDEV = jsx2;
      module.exports.Fragment = R.Fragment;
    }
  });

  // .design-sync/previews/Select.tsx
  var Select_exports = {};
  __export(Select_exports, {
    Closed: () => Closed,
    Default: () => Default
  });
  var import_fuel_flow_web = __toESM(require_ds(), 1);
  var import_jsx_runtime = __toESM(require_react_shim(), 1);
  var Default = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 24, maxWidth: 280 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_fuel_flow_web.Select, { defaultValue: "petrol", open: true, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fuel_flow_web.SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fuel_flow_web.SelectValue, { placeholder: "Choose fuel type" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_fuel_flow_web.SelectContent, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fuel_flow_web.SelectItem, { value: "petrol", children: "Petrol" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fuel_flow_web.SelectItem, { value: "diesel", children: "Diesel" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fuel_flow_web.SelectItem, { value: "hi-octane", children: "Hi-Octane" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fuel_flow_web.SelectItem, { value: "cng", children: "CNG" })
    ] })
  ] }) });
  var Closed = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 24, maxWidth: 280 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_fuel_flow_web.Select, { defaultValue: "diesel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fuel_flow_web.SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fuel_flow_web.SelectValue, {}) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_fuel_flow_web.SelectContent, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fuel_flow_web.SelectItem, { value: "petrol", children: "Petrol" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fuel_flow_web.SelectItem, { value: "diesel", children: "Diesel" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fuel_flow_web.SelectItem, { value: "hi-octane", children: "Hi-Octane" })
    ] })
  ] }) });
  return __toCommonJS(Select_exports);
})();
