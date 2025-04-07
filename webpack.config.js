const path = require("path");
const ejs = require("ejs");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const MangleCssClassPlugin = require("mangle-css-class-webpack-plugin");

/* ---------------------------------------------------------------- Constants */

const dirs = {
  input: path.resolve(__dirname, "src"),
  output: path.resolve(__dirname, "dist"),
  html: path.resolve(__dirname, "src", "html"),
  scripts: path.resolve(__dirname, "src", "scripts"),
  styles: path.resolve(__dirname, "src", "styles"),
  assets: path.resolve(__dirname, "src", "assets"),
}

const paths = {
  html: path.join(dirs.html, "index.ejs"),
  js: path.join(dirs.scripts, "main.js"),
  css: path.join(dirs.styles, "main.scss"),
  favicon: path.join(dirs.assets, "favicon.ico")
};

/* ------------------------------------------------------------ Configuration */

/** 
 * @type {(_, argv) => import("webpack").Configuration} 
 */
function getConfig(_, argv) {
  const isDevMode = argv.mode === "development"
  const needSourceMaps = false
  const shouldMangleCss = false

  return {
    mode: argv.mode || "production",
    entry: [paths.js, paths.css],
    output: {
      filename: "bundle.js",
      path: dirs.output,
      clean: ! isDevMode
    },
    module: {
      rules: [
        js_rules(isDevMode), 
        html_rules(isDevMode),
        ejs_rules(isDevMode),
        css_rules(isDevMode),
        sass_rules(isDevMode),
      ]
    },
    plugins: plugins(isDevMode, shouldMangleCss),
    optimization: { minimizer: ["...", new CssMinimizerPlugin()] },
    devtool: isDevMode && needSourceMaps && "source-map",
    devServer: dev_server(),
    infrastructureLogging: { level: 'error' },
    stats: 'minimal'
  }
}

/* -------------------------------------------------------------------- Rules */

/**
 * Describes how to process JavaScript files.
 * @param {boolean} isDevMode 
 * @returns {() => import("webpack").RuleSetRule}
 */
function js_rules(isDevMode) {
  return {
    test: /\.js$/,
    exclude: /node_modules/,
    use: [
      {
        loader: "babel-loader",
        options: { targets: "defaults", presets: ["@babel/preset-env"] }
      },
      {
        loader: "webpack-preprocessor-loader",
        options: { debug: isDevMode }
      }
    ]
  }
}

/**
 * Describes how to process HTML files.
 * @param {boolean} isDevMode 
 * @returns {() => import("webpack").RuleSetRule}
 */
function html_rules(isDevMode) {
  return {
    test: /\.html$/,
    exclude: /node_modules/,
    use: "html-loader",
  }
}


/**
 * Describes how to process EJS templates.
 * @param {boolean} isDevMode 
 * @returns {() => import("webpack").RuleSetRule}
 */
function ejs_rules(isDevMode) {
  return {
    test: /\.ejs$/,
    exclude: /node_modules/,
    loader: 'html-loader',
    options: { preprocessor: ejsPreprocessor }
  }
}

/**
 * Describes how to process CSS files.
 * @param {boolean} isDevMode 
 * @returns {() => import("webpack").RuleSetRule}
 */
function css_rules(isDevMode) {
  return {
    test: /\.css$/,
    use: [
      MiniCssExtractPlugin.loader, // or "style-loader"
      "css-loader"
    ]
  }
}

/**
 * Describes how to process SASS/SCSS files.
 * @param {boolean} isDevMode 
 * @returns {() => import("webpack").RuleSetRule}
 */
function sass_rules(isDevMode) {
  return {
    test: /\.s[ac]ss$/,
    use: [
      MiniCssExtractPlugin.loader, // or "style-loader"
      "css-loader",
      "sass-loader"
    ]
  }
}

/* ------------------------------------------------------------------ Plugins */

/**
 * @type {(isDevMode: boolean, shouldMangleCss: boolean) => import("webpack").Configuration["plugins"]}
 */
function plugins(isDevMode, shouldMangleCss) {
  return [
    shouldMangleCss || ! isDevMode ? new MangleCssClassPlugin({
      classNameRegExp: classNameRules('specific'),
      mangleCssVariables: true,
      reserveClassName: ["_"],
    }) : null,
    new MiniCssExtractPlugin({
      filename: "style.css",
    }),
    new HtmlWebpackPlugin({
      title: "design-pouch",
      template: paths.html,
      templateParameters: {title: "design-pouch"},
      favicon: paths.favicon
    })
  ]
}

/* --------------------------------------------------------- CSS Optimisation */

/**
 * Defines how to process CSS class names and IDs. Returns a regular expression.
 * - **prefixed**: class names start with `c-`, ids start with `id-`;
 * - **specific**: concrete class names and ids, i.e. `row`, `pt-1/2`, `auth-form`  
 *   (note that you'll need to update the regex according to your stylesheets).
 * @param {"prefixed"|"specific"} type 
 */
function classNameRules(type = "prefixed") {
  switch (type) {
    case "prefixed":
      return "(c|id)-[a-zA-Z0-9_-]*";
    case "specific":
      return "("
      + "row|col|center|responsive|(no-)?(grow|shrink)|[hw]-full|grid-*|col-*|"
      + "logo|header|subheader|paragraph|caption|uppercase|link|navlink|"
      + "[xy]-(around|baseline|between|center|end|evenly|start|stretch)|"
      + "to-(start|end|center|top|middle|end)"
      + "(([hw]|gap(-[cr])?|[mp][tblrxy]?|rd(-(t|r|b|l|tl|tr|bl|br))?)"
      + "-([0-9]-[0-9]\\\\\\\/[0-9]|[0-9]\\\\\\\/[0-9]|[0-9]+))"
      + ")";
  }
}

/* --------------------------------------------------------------- Dev Server */

/** 
 * Webpack's dev server configuration.
 * @type {import("webpack-dev-server").Configuration} 
 */
function dev_server() {
  return {
    static: { directory: dirs.output },
    port: 3000,
    hot: true,
    watchFiles: [path.join(dirs.html, '**/*.ejs')]
    // proxy: [{ context: ["/api/*"], target: "http://0.0.0.0:5000/", secure: false }]
  }
}

/**
 * Processes the EJS string; allows to include fragments in the main EJS file.
 * @example
 * <body>
 *   <%- include("header.ejs") %>
 *   <main>...</main>
 * @param {string} content 
 * @param {any} loaderContext 
 */
function ejsPreprocessor(content, loaderContext) {
  try {
    fs.readdirSync(dirs.html).forEach(file => 
      file.endsWith('.ejs') && loaderContext.addDependency(path.join(dirs.html, file)))
    return ejs.render(content, {}, {filename: paths.html})
  } catch (error) {
    loaderContext.emitError(error);
    return content;
  }
}

module.exports = getConfig